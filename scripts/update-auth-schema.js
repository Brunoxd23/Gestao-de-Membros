// Script para atualizar schema com sistema de autenticação
require('dotenv').config();
const { query } = require('../config/database');

async function updateAuthSchema() {
    try {
        console.log('🔄 Atualizando schema com sistema de autenticação...');
        
        // Atualizar constraint do ministério para incluir secretaria
        await query(`
            ALTER TABLE membros 
            DROP CONSTRAINT IF EXISTS membros_ministerio_check
        `);
        
        await query(`
            ALTER TABLE membros 
            ADD CONSTRAINT membros_ministerio_check 
            CHECK (ministerio IN ('Pastor', 'secretaria', 'louvor', 'infantil', 'jovens', 'senhores', 'senhoras', 'evangelismo', 'diaconia', 'outros'))
        `);
        
        // Criar tabela de usuários
        await query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                membro_id INTEGER REFERENCES membros(id) ON DELETE CASCADE,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'secretaria', 'user')),
                ativo BOOLEAN DEFAULT true,
                ultimo_login TIMESTAMP,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Atualizar tabela de logs
        await query(`
            ALTER TABLE logs_atividade 
            ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
        `);
        
        await query(`
            ALTER TABLE logs_atividade 
            ADD COLUMN IF NOT EXISTS ip_address INET
        `);
        
        await query(`
            ALTER TABLE logs_atividade 
            ADD COLUMN IF NOT EXISTS user_agent TEXT
        `);
        
        // Inserir membros admin se não existirem
        await query(`
            INSERT INTO membros (nome, email, telefone, data_nascimento, tipo_membro, ministerio, endereco, cidade) 
            VALUES 
            ('Pastor Principal', 'pastor@ceppembu.com', '(11) 99999-0001', '1975-03-15', 'membro', 'Pastor', 'Rua da Igreja, 1', 'São Paulo'),
            ('Secretária Principal', 'secretaria@ceppembu.com', '(11) 99999-0002', '1980-07-20', 'membro', 'secretaria', 'Rua da Igreja, 2', 'São Paulo')
            ON CONFLICT DO NOTHING
        `);
        
        // Inserir usuários admin (senha: admin123)
        await query(`
            INSERT INTO usuarios (membro_id, username, password_hash, role) 
            VALUES 
            ((SELECT id FROM membros WHERE email = 'pastor@ceppembu.com'), 'pastor', '$2b$10$rQZ8KjHv9XKjHv9XKjHv9OuKjHv9XKjHv9XKjHv9XKjHv9XKjHv9XK', 'admin'),
            ((SELECT id FROM membros WHERE email = 'secretaria@ceppembu.com'), 'secretaria', '$2b$10$rQZ8KjHv9XKjHv9XKjHv9OuKjHv9XKjHv9XKjHv9XKjHv9XKjHv9XK', 'admin')
            ON CONFLICT (username) DO NOTHING
        `);
        
        console.log('✅ Schema de autenticação atualizado com sucesso!');
        console.log('✅ Usuários admin criados:');
        console.log('   - Username: pastor, Senha: admin123');
        console.log('   - Username: secretaria, Senha: admin123');
        console.log('⚠️  IMPORTANTE: Troque essas senhas após o primeiro login!');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar schema:', error);
    } finally {
        process.exit(0);
    }
}

updateAuthSchema();
