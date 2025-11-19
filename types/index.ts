export type Category = 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  created_at: number;
  updated_at: number;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  category: Category;
  subcategory?: string;
  color?: string;
  brand?: string;
  season?: Season;
  original_image_url: string;
  thumbnail_url: string;
  background_removed_url?: string;
  tags?: string[];
  favorite: boolean;
  times_worn: number;
  last_worn_date?: number;
  created_at: number;
  updated_at: number;
}

export interface Outfit {
  id: string;
  user_id: string;
  name?: string;
  item_ids: string[];
  occasion?: string;
  favorite: boolean;
  created_at: number;
  updated_at: number;
}

export interface WearHistory {
  id: string;
  user_id: string;
  item_id: string;
  outfit_id?: string;
  worn_date: number;
}

export interface Env {
  DB: any; // D1Database
  CLOSET_IMAGES: any; // R2Bucket
  AI: any; // Cloudflare AI
}

export interface OutfitCombination {
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  outerwear?: ClothingItem;
  accessories?: ClothingItem;
}
