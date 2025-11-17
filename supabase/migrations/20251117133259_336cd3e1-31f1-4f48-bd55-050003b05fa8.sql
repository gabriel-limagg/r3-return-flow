-- Criar tabela de portadores
CREATE TABLE public.portadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  base TEXT NOT NULL CHECK (base IN ('SP', 'RJ', 'MG')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos de devolução
CREATE TABLE public.pedidos_devolucao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_codigo TEXT NOT NULL,
  romaneio TEXT NOT NULL,
  portador_id UUID NOT NULL REFERENCES public.portadores(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  colaborador TEXT NOT NULL,
  base TEXT NOT NULL CHECK (base IN ('SP', 'RJ', 'MG')),
  status TEXT NOT NULL DEFAULT 'A Devolver' CHECK (status IN ('A Devolver', 'Em processo de devolução', 'Devolvido')),
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.portadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_devolucao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para portadores (usuários autenticados podem ler e escrever)
CREATE POLICY "Usuários autenticados podem visualizar portadores"
  ON public.portadores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir portadores"
  ON public.portadores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar portadores"
  ON public.portadores
  FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas RLS para clientes (usuários autenticados podem ler e escrever)
CREATE POLICY "Usuários autenticados podem visualizar clientes"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir clientes"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas RLS para pedidos_devolucao (usuários autenticados podem ler e escrever)
CREATE POLICY "Usuários autenticados podem visualizar pedidos"
  ON public.pedidos_devolucao
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir pedidos"
  ON public.pedidos_devolucao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pedidos"
  ON public.pedidos_devolucao
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar pedidos"
  ON public.pedidos_devolucao
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pedidos_devolucao_updated_at
  BEFORE UPDATE ON public.pedidos_devolucao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhorar performance das consultas
CREATE INDEX idx_portadores_ativo ON public.portadores(ativo);
CREATE INDEX idx_clientes_ativo ON public.clientes(ativo);
CREATE INDEX idx_pedidos_data_cadastro ON public.pedidos_devolucao(data_cadastro DESC);
CREATE INDEX idx_pedidos_status ON public.pedidos_devolucao(status);
CREATE INDEX idx_pedidos_base ON public.pedidos_devolucao(base);