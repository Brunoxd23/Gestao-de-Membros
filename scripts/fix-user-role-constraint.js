const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'igreja_db',
    password: 'admin123',
    port: 5432,
});

async function fixUserRoleConstraint() {
    try {
        console.log('🔧 Corrigindo constraint de role de usuários...');
        
        // Remover constraint antigo
        await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;');
        console.log('✅ Constraint antigo removido');
        
        // Adicionar novo constraint com 'membro'
        await pool.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_role_check 
            CHECK (role IN ('admin', 'secretaria', 'membro'))
        `);
        console.log('✅ Novo constraint adicionado com sucesso');
        
        // Verificar constraint
        const result = await pool.query(`
            SELECT conname, consrc 
            FROM pg_constraint 
            WHERE conname = 'usuarios_role_check'
        `);
        
        console.log('📋 Constraint atual:', result.rows[0]);
        console.log('🎉 Constraint corrigido com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir constraint:', error);
    } finally {
        await pool.end();
    }
}

fixUserRoleConstraint();
