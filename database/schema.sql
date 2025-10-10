-- Schema para o Sistema de Gestão de Membros CEPPEMBU
-- Criar banco de dados (executar no Neon)

-- Tabela de membros
CREATE TABLE IF NOT EXISTS membros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE,
    data_batismo DATE,
    endereco TEXT,
    cidade VARCHAR(100),
    tipo_membro VARCHAR(50) NOT NULL CHECK (tipo_membro IN ('membro', 'visitante', 'novo-convertido')),
    ministerio VARCHAR(50) CHECK (ministerio IN ('pastor', 'louvor', 'infantil', 'jovens', 'senhores', 'senhoras', 'evangelismo', 'diaconia', 'outros')),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_membros_tipo ON membros(tipo_membro);
CREATE INDEX IF NOT EXISTS idx_membros_ministerio ON membros(ministerio);
CREATE INDEX IF NOT EXISTS idx_membros_ativo ON membros(ativo);
CREATE INDEX IF NOT EXISTS idx_membros_data_nascimento ON membros(data_nascimento);
CREATE INDEX IF NOT EXISTS idx_membros_email ON membros(email);
CREATE INDEX IF NOT EXISTS idx_membros_telefone ON membros(telefone);

-- Trigger para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_membros_updated_at 
    BEFORE UPDATE ON membros 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela para logs de atividades (opcional)
CREATE TABLE IF NOT EXISTS logs_atividade (
    id SERIAL PRIMARY KEY,
    membro_id INTEGER REFERENCES membros(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    detalhes JSONB,
    usuario VARCHAR(100),
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO membros (nome, email, telefone, data_nascimento, tipo_membro, ministerio, endereco, cidade) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', '1985-05-15', 'membro', 'louvor', 'Rua das Flores, 123', 'São Paulo'),
('Maria Santos', 'maria@email.com', '(11) 88888-8888', '1990-08-22', 'membro', 'infantil', 'Av. Principal, 456', 'São Paulo'),
('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', '1988-12-10', 'visitante', NULL, 'Rua Central, 789', 'São Paulo')
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE membros IS 'Tabela principal para armazenar dados dos membros da igreja';
COMMENT ON COLUMN membros.tipo_membro IS 'Tipo: membro, visitante, novo-convertido';
COMMENT ON COLUMN membros.ministerio IS 'Ministério: Pastor, louvor, infantil, jovens, senhores, senhoras, evangelismo, diaconia, outros';
COMMENT ON COLUMN membros.ativo IS 'Se o membro está ativo (true) ou inativo (false)';
