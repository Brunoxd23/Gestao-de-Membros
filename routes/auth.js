const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para verificar autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acesso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'ceppembu_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Privilégios de administrador requeridos.'
        });
    }
    next();
};

// POST /api/auth/login - Fazer login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e senha são obrigatórios'
            });
        }

        // Buscar usuário
        const result = await query(`
            SELECT u.*, m.nome, m.email, m.ministerio 
            FROM usuarios u 
            JOIN membros m ON u.membro_id = m.id 
            WHERE u.username = $1 AND u.ativo = true
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        const user = result.rows[0];

        // Verificar senha (para desenvolvimento, senha padrão é 'admin123')
        const isValidPassword = password === 'admin123' || await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }

        // Atualizar último login
        await query(`
            UPDATE usuarios 
            SET ultimo_login = CURRENT_TIMESTAMP 
            WHERE id = $1
        `, [user.id]);

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                membro_id: user.membro_id 
            },
            process.env.JWT_SECRET || 'ceppembu_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    nome: user.nome,
                    email: user.email,
                    ministerio: user.ministerio
                }
            },
            message: 'Login realizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/logout - Fazer logout
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT u.*, m.nome, m.email, m.ministerio 
            FROM usuarios u 
            JOIN membros m ON u.membro_id = m.id 
            WHERE u.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                role: user.role,
                nome: user.nome,
                email: user.email,
                ministerio: user.ministerio,
                ultimo_login: user.ultimo_login
            }
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// GET /api/auth/users - Listar usuários (apenas admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id, u.username, u.role, u.ativo, u.ultimo_login, u.data_criacao,
                   m.nome, m.email, m.ministerio
            FROM usuarios u 
            JOIN membros m ON u.membro_id = m.id 
            ORDER BY u.data_criacao DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/users - Criar usuário (apenas admin)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { membro_id, username, password, role } = req.body;

        if (!membro_id || !username || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se username já existe
        const existingUser = await query('SELECT id FROM usuarios WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username já existe'
            });
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // Criar usuário
        const result = await query(`
            INSERT INTO usuarios (membro_id, username, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, role, ativo, data_criacao
        `, [membro_id, username, passwordHash, role]);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Usuário criado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// PUT /api/auth/users/:id - Atualizar usuário (apenas admin)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, role, ativo } = req.body;

        const result = await query(`
            UPDATE usuarios 
            SET username = $1, role = $2, ativo = $3, data_atualizacao = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, username, role, ativo
        `, [username, role, ativo, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Usuário atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// DELETE /api/auth/users/:id - Deletar usuário (apenas admin)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuário deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = { router, authenticateToken, requireAdmin };
