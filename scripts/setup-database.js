const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    // Verificar se DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL não encontrada no arquivo .env');
        console.log('📝 Configure a DATABASE_URL no arquivo .env com a connection string do Neon');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Testar conexão
        console.log('🔌 Testando conexão com o banco...');
        const client = await pool.connect();
        console.log('✅ Conectado ao banco de dados!');

        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Executando script SQL...');
        
        // Executar o script SQL
        await client.query(sqlContent);
        
        console.log('✅ Tabelas criadas com sucesso!');
        console.log('✅ Índices criados com sucesso!');
        console.log('✅ Triggers criados com sucesso!');
        console.log('✅ Dados de exemplo inseridos com sucesso!');

        // Verificar se as tabelas foram criadas
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tabelas criadas:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Verificar dados de exemplo
        const membersResult = await client.query('SELECT COUNT(*) as total FROM membros');
        console.log(`👥 Membros de exemplo: ${membersResult.rows[0].total}`);

        client.release();
        
        console.log('\n🎉 Banco de dados configurado com sucesso!');
        console.log('🚀 Agora você pode executar: npm run dev');
        
    } catch (error) {
        console.error('❌ Erro ao configurar banco de dados:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Verifique se a DATABASE_URL está correta no arquivo .env');
        } else if (error.code === '42P07') {
            console.log('ℹ️  Tabelas já existem. Tudo certo!');
        } else {
            console.log('💡 Verifique os logs acima para mais detalhes');
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;
