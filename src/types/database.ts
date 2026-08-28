export type Condition = 'new' | 'like_new' | 'used' | 'fair';
export type ListingStatus = 'active' | 'sold' | 'hidden';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: Condition;
  location: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  position: number;
}

export interface ListingWithDetails extends Listing {
  listing_images: ListingImage[];
  categories: Category | null;
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'location'> | null;
}

export interface Favorite {
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationWithDetails extends Conversation {
  listings: Pick<Listing, 'id' | 'title' | 'price' | 'currency'> | null;
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  seller: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  messages: Pick<Message, 'body' | 'created_at' | 'sender_id'>[];
}

