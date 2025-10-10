const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/relatorios/tipo-membro - Relatório por tipo de membro
router.get('/tipo-membro', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        tipo_membro,
        COUNT(*) as total,
        COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
      FROM membros 
      GROUP BY tipo_membro
      ORDER BY total DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório por tipo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/ministerio - Relatório por ministério
router.get('/ministerio', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COALESCE(ministerio, 'Sem Ministério') as ministerio,
        COUNT(*) as total,
        COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
      FROM membros 
      GROUP BY ministerio
      ORDER BY total DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório por ministério:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/cadastros-por-mes - Cadastros por mês
router.get('/cadastros-por-mes', async (req, res) => {
  try {
    const { ano } = req.query;
    const anoAtual = ano || new Date().getFullYear();
    
    const result = await query(`
      SELECT 
        EXTRACT(MONTH FROM data_cadastro) as mes,
        COUNT(*) as total_cadastros
      FROM membros 
      WHERE EXTRACT(YEAR FROM data_cadastro) = $1
      GROUP BY EXTRACT(MONTH FROM data_cadastro)
      ORDER BY mes ASC
    `, [anoAtual]);
    
    // Mapear números dos meses para nomes
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const relatorio = result.rows.map(row => ({
      mes: meses[parseInt(row.mes) - 1],
      mes_numero: parseInt(row.mes),
      total: parseInt(row.total_cadastros)
    }));
    
    res.json({
      success: true,
      data: relatorio,
      ano: anoAtual
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório de cadastros:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/idade - Relatório por faixa etária
router.get('/idade', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        CASE 
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '18 years' THEN '0-17 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '30 years' THEN '18-29 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '50 years' THEN '30-49 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '65 years' THEN '50-64 anos'
          ELSE '65+ anos'
        END as faixa_etaria,
        COUNT(*) as total
      FROM membros 
      WHERE 
        data_nascimento IS NOT NULL 
        AND ativo = true
      GROUP BY 
        CASE 
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '18 years' THEN '0-17 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '30 years' THEN '18-29 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '50 years' THEN '30-49 anos'
          WHEN AGE(CURRENT_DATE, data_nascimento) < INTERVAL '65 years' THEN '50-64 anos'
          ELSE '65+ anos'
        END
      ORDER BY MIN(EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)))
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório por idade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/cidade - Relatório por cidade
router.get('/cidade', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COALESCE(cidade, 'Não informado') as cidade,
        COUNT(*) as total,
        COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
      FROM membros 
      GROUP BY cidade
      ORDER BY total DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório por cidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/exportar - Exportar dados para CSV
router.get('/exportar', async (req, res) => {
  try {
    const { formato = 'csv' } = req.query;
    
    const result = await query(`
      SELECT 
        id, nome, email, telefone, data_nascimento, data_batismo,
        endereco, cidade, tipo_membro, ministerio, observacoes,
        ativo, data_cadastro, data_atualizacao
      FROM membros 
      WHERE ativo = true
      ORDER BY nome ASC
    `);
    
    if (formato === 'csv') {
      // Converter para CSV
      const headers = [
        'ID', 'Nome', 'Email', 'Telefone', 'Data Nascimento', 'Data Batismo',
        'Endereço', 'Cidade', 'Tipo Membro', 'Ministério', 'Observações',
        'Data Cadastro', 'Data Atualização'
      ];
      
      const csvContent = [
        headers.join(','),
        ...result.rows.map(row => [
          row.id,
          `"${row.nome || ''}"`,
          `"${row.email || ''}"`,
          `"${row.telefone || ''}"`,
          row.data_nascimento || '',
          row.data_batismo || '',
          `"${row.endereco || ''}"`,
          `"${row.cidade || ''}"`,
          `"${row.tipo_membro || ''}"`,
          `"${row.ministerio || ''}"`,
          `"${row.observacoes || ''}"`,
          row.data_cadastro || '',
          row.data_atualizacao || ''
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="membros_ceppembu_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
    } else {
      res.json({
        success: true,
        data: result.rows,
        total: result.rowCount
      });
    }
    
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/relatorios/geral - Resumo geral
router.get('/geral', async (req, res) => {
  try {
    const [stats, tipos, ministerios, cadastrosMes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_membros,
          COUNT(CASE WHEN ativo = true THEN 1 END) as membros_ativos,
          COUNT(CASE WHEN tipo_membro = 'visitante' THEN 1 END) as visitantes,
          COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento
        FROM membros
      `),
      query(`
        SELECT tipo_membro, COUNT(*) as total
        FROM membros 
        WHERE ativo = true
        GROUP BY tipo_membro
      `),
      query(`
        SELECT ministerio, COUNT(*) as total
        FROM membros 
        WHERE ativo = true AND ministerio IS NOT NULL
        GROUP BY ministerio
        ORDER BY total DESC
        LIMIT 5
      `),
      query(`
        SELECT 
          EXTRACT(MONTH FROM data_cadastro) as mes,
          COUNT(*) as total
        FROM membros 
        WHERE EXTRACT(YEAR FROM data_cadastro) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY EXTRACT(MONTH FROM data_cadastro)
        ORDER BY mes DESC
        LIMIT 6
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        estatisticas: stats.rows[0],
        tipos_membro: tipos.rows,
        ministerios: ministerios.rows,
        cadastros_por_mes: cadastrosMes.rows
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar relatório geral:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
