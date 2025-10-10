const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/membros - Listar todos os membros
router.get('/', async (req, res) => {
  try {
    const { tipo, busca, ativo = 'true' } = req.query;
    
    let sql = `
      SELECT 
        id, nome, email, telefone, data_nascimento, data_batismo,
        endereco, cidade, tipo_membro, ministerio, observacoes,
        ativo, data_cadastro, data_atualizacao
      FROM membros 
      WHERE ativo = $1
    `;
    
    const params = [ativo === 'true'];
    let paramCount = 1;
    
    // Filtro por tipo
    if (tipo) {
      paramCount++;
      sql += ` AND tipo_membro = $${paramCount}`;
      params.push(tipo);
    }
    
    // Busca por nome, email ou telefone
    if (busca) {
      paramCount++;
      sql += ` AND (
        nome ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        telefone ILIKE $${paramCount}
      )`;
      params.push(`%${busca}%`);
    }
    
    sql += ' ORDER BY nome ASC';
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/membros/:id - Buscar membro por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM membros WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Membro não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/membros - Criar novo membro
router.post('/', async (req, res) => {
  try {
    const {
      nome, email, telefone, data_nascimento, data_batismo,
      endereco, cidade, tipo_membro, ministerio, observacoes
    } = req.body;
    
    // Validações básicas
    if (!nome || !tipo_membro) {
      return res.status(400).json({
        success: false,
        error: 'Nome e tipo de membro são obrigatórios'
      });
    }
    
    const result = await query(`
      INSERT INTO membros (
        nome, email, telefone, data_nascimento, data_batismo,
        endereco, cidade, tipo_membro, ministerio, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      nome, email, telefone, data_nascimento, data_batismo,
      endereco, cidade, tipo_membro, ministerio, observacoes
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Membro cadastrado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/membros/:id - Atualizar membro
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, email, telefone, data_nascimento, data_batismo,
      endereco, cidade, tipo_membro, ministerio, observacoes, ativo
    } = req.body;
    
    // Verificar se o membro existe
    const exists = await query('SELECT id FROM membros WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Membro não encontrado'
      });
    }
    
    const result = await query(`
      UPDATE membros SET
        nome = $1, email = $2, telefone = $3, data_nascimento = $4,
        data_batismo = $5, endereco = $6, cidade = $7, tipo_membro = $8,
        ministerio = $9, observacoes = $10, ativo = $11
      WHERE id = $12
      RETURNING *
    `, [
      nome, email, telefone, data_nascimento, data_batismo,
      endereco, cidade, tipo_membro, ministerio, observacoes, ativo, id
    ]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Membro atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/membros/:id - Excluir membro (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - marcar como inativo
    const result = await query(
      'UPDATE membros SET ativo = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Membro não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Membro excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir membro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/membros/stats/dashboard - Estatísticas para dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN tipo_membro = 'membro' AND ativo = true THEN 1 END) as total_membros,
        COUNT(CASE WHEN tipo_membro = 'membro' AND ativo = true THEN 1 END) as membros_ativos,
        COUNT(CASE WHEN tipo_membro = 'visitante' AND ativo = true THEN 1 END) as visitantes,
        COUNT(CASE WHEN tipo_membro = 'novo-convertido' AND ativo = true THEN 1 END) as novos_convertidos,
        COUNT(CASE WHEN ativo = true THEN 1 END) as membros_ativos_total
      FROM membros
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
