// Script para atualizar constraints do banco de dados
require('dotenv').config();
const { query } = require('../config/database');

async function updateConstraints() {
    try {
        console.log('🔄 Atualizando constraints do banco de dados...');
        
        // Remover constraint antigo
        await query(`
            ALTER TABLE membros 
            DROP CONSTRAINT IF EXISTS membros_ministerio_check
        `);
        
        // Adicionar nova constraint
        await query(`
            ALTER TABLE membros 
            ADD CONSTRAINT membros_ministerio_check 
            CHECK (ministerio IN ('Pastor', 'louvor', 'infantil', 'jovens', 'senhores', 'senhoras', 'evangelismo', 'diaconia', 'outros'))
        `);
        
        console.log('✅ Constraints atualizados com sucesso!');
        console.log('✅ Agora "Pastor" com P maiúsculo funcionará corretamente.');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar constraints:', error);
    } finally {
        process.exit(0);
    }
}

updateConstraints();
