// src/modules/products/types/index.ts

export interface Product {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
