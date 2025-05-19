
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
