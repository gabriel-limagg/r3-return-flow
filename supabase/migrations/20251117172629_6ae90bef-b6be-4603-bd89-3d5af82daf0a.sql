-- Permitir valores NULL em portador_id e cliente_id
ALTER TABLE public.pedidos_devolucao 
ALTER COLUMN portador_id DROP NOT NULL;

ALTER TABLE public.pedidos_devolucao 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Comentário: Agora pedidos podem ser cadastrados mesmo sem portador ou cliente associado