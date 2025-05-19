
export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  cargo: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Session = {
  user: {
    id: string;
    email: string;
  };
  expires_at: number;
};

// Tipos para dados do Supabase
export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  categoria_id: string | null;
  disponivel: boolean;
  destaque: boolean;
  created_at: string;
  updated_at: string;
};

export type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

export type EstoqueItem = {
  id: string;
  produto_id: string | null;
  quantidade: number;
  unidade: string;
  estoque_minimo: number | null;
  preco_compra: number | null;
  ultima_atualizacao: string;
};

export type Pedido = {
  id: string;
  cliente_nome: string | null;
  mesa: string | null;
  status: string;
  valor_total: number;
  metodo_pagamento: string | null;
  pago: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemPedido = {
  id: string;
  pedido_id: string | null;
  produto_id: string | null;
  quantidade: number;
  preco_unitario: number;
  observacoes: string | null;
  created_at: string;
};
