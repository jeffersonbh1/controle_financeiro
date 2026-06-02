-- ====================================================================
-- SCRIPT DE MIGRAÇÃO SUPABASE
-- --------------------------------------------------------------------
-- 1. Remoção da funcionalidade obsoleta do Grupo Familiar
-- 2. Criação da nova infraestrutura de Metas / Objetivos de Gastos
-- ====================================================================

-- --------------------------------------------------------------------
-- ETAPA 1: Deleção da Funcionalidade de Grupo Familiar
-- --------------------------------------------------------------------

-- Remover a coluna de chave estrangeira que associava os usuários a um grupo familiar
ALTER TABLE IF EXISTS users 
  DROP COLUMN IF EXISTS family_group_id;

-- Excluir a tabela de grupos familiares obsoleta
DROP TABLE IF EXISTS family_groups CASCADE;


-- --------------------------------------------------------------------
-- ETAPA 2: Criação da Tabela de Metas / Objetivos de Gastos (Category Budgets)
-- --------------------------------------------------------------------

-- Criar tabela de metas vinculada de forma única a cada categoria
CREATE TABLE IF NOT EXISTS category_budgets (
  category_id TEXT PRIMARY KEY,
  limit_value NUMERIC NOT NULL CHECK (limit_value > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relacionamento de integridade referencial com cascata
  CONSTRAINT fk_category_budgets_category 
    FOREIGN KEY (category_id) 
    REFERENCES categories(id) 
    ON DELETE CASCADE
);

-- Habilitar Row Level Security (RLS) na tabela de metas para conformidade com o Supabase
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Criar políticas flexíveis para permitir operações no protótipo / compartilhando o banco
CREATE POLICY "Permitir leitura para todos os usuários autenticados e anônimos" 
  ON category_budgets FOR SELECT 
  USING (true);

CREATE POLICY "Permitir inserção de metas para todos os usuários" 
  ON category_budgets FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de metas para todos os usuários" 
  ON category_budgets FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de metas para todos os de usuários" 
  ON category_budgets FOR DELETE 
  USING (true);

-- Criar trigger de atualização de data (updated_at)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_category_budgets ON category_budgets;

CREATE TRIGGER set_timestamp_category_budgets
BEFORE UPDATE ON category_budgets
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
