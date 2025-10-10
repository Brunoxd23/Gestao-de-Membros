const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/aniversarios/hoje - Aniversariantes do dia
router.get('/hoje', async (req, res) => {
  try {
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1; // JavaScript usa 0-11, PostgreSQL usa 1-12
    
    const result = await query(`
      SELECT 
        id, nome, email, telefone, data_nascimento, ministerio
      FROM membros 
      WHERE 
        EXTRACT(DAY FROM data_nascimento) = $1 
        AND EXTRACT(MONTH FROM data_nascimento) = $2
        AND ativo = true
        AND data_nascimento IS NOT NULL
      ORDER BY nome ASC
    `, [dia, mes]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao buscar aniversariantes do dia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/aniversarios/mes/:mes - Aniversariantes do mês
router.get('/mes/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const mesNumero = parseInt(mes);
    
    if (mesNumero < 1 || mesNumero > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mês inválido (deve ser entre 1 e 12)'
      });
    }
    
    const result = await query(`
      SELECT 
        id, nome, email, telefone, data_nascimento, ministerio,
        EXTRACT(DAY FROM data_nascimento) as dia_nascimento
      FROM membros 
      WHERE 
        EXTRACT(MONTH FROM data_nascimento) = $1
        AND ativo = true
        AND data_nascimento IS NOT NULL
      ORDER BY EXTRACT(DAY FROM data_nascimento) ASC, nome ASC
    `, [mesNumero]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao buscar aniversariantes do mês:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/aniversarios/proximos/:dias - Próximos aniversários
router.get('/proximos/:dias', async (req, res) => {
  try {
    const { dias } = req.params;
    const diasNumero = parseInt(dias) || 7;
    
    const result = await query(`
      SELECT 
        id, nome, email, telefone, data_nascimento, ministerio,
        EXTRACT(DAY FROM data_nascimento) as dia_nascimento,
        EXTRACT(MONTH FROM data_nascimento) as mes_nascimento,
        CASE 
          WHEN EXTRACT(DOY FROM data_nascimento) >= EXTRACT(DOY FROM CURRENT_DATE) 
          THEN EXTRACT(DOY FROM data_nascimento) - EXTRACT(DOY FROM CURRENT_DATE)
          ELSE EXTRACT(DOY FROM data_nascimento) + (365 - EXTRACT(DOY FROM CURRENT_DATE))
        END as dias_para_aniversario
      FROM membros 
      WHERE 
        ativo = true
        AND data_nascimento IS NOT NULL
      HAVING dias_para_aniversario <= $1
      ORDER BY dias_para_aniversario ASC, nome ASC
    `, [diasNumero]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    console.error('Erro ao buscar próximos aniversários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/aniversarios/estatisticas - Estatísticas de aniversários
router.get('/estatisticas', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        EXTRACT(MONTH FROM data_nascimento) as mes,
        COUNT(*) as total_aniversariantes
      FROM membros 
      WHERE 
        ativo = true
        AND data_nascimento IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM data_nascimento)
      ORDER BY mes ASC
    `);
    
    // Mapear números dos meses para nomes
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const estatisticas = result.rows.map(row => ({
      mes: meses[parseInt(row.mes) - 1],
      mes_numero: parseInt(row.mes),
      total: parseInt(row.total_aniversariantes)
    }));
    
    res.json({
      success: true,
      data: estatisticas
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de aniversários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/aniversarios/enviar-parabens - Enviar parabéns (log)
router.post('/enviar-parabens', async (req, res) => {
  try {
    const { membro_id, tipo_envio, sucesso } = req.body;
    
    if (!membro_id || !tipo_envio) {
      return res.status(400).json({
        success: false,
        error: 'ID do membro e tipo de envio são obrigatórios'
      });
    }
    
    // Log da atividade
    await query(`
      INSERT INTO logs_atividade (membro_id, acao, detalhes)
      VALUES ($1, 'envio_parabens', $2)
    `, [
      membro_id,
      JSON.stringify({
        tipo_envio,
        sucesso: sucesso || false,
        data_envio: new Date().toISOString()
      })
    ]);
    
    res.json({
      success: true,
      message: 'Log de envio registrado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao registrar envio de parabéns:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
