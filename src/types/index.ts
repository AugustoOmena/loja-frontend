export interface Product {
  id?: number;
  name: string;
  price: number;
  size: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string; // UUID é string
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}