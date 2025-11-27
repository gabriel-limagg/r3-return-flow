-- Adicionar campo observacao na tabela pedidos_devolucao
ALTER TABLE pedidos_devolucao
ADD COLUMN observacao TEXT DEFAULT NULL;