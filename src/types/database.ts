export type Condition = 'new' | 'like_new' | 'used' | 'fair';
export type ListingStatus = 'active' | 'sold' | 'hidden';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  is_admin: boolean;
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

export type OrderStatus = 'pending' | 'paid' | 'released' | 'refunded' | 'cancelled';

export interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  commission_amount: number;
  payout_amount: number;
  paystack_reference: string;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  released_at: string | null;
}

export interface OrderWithDetails extends Order {
  listings: Pick<Listing, 'id' | 'title'> & { listing_images: Pick<ListingImage, 'url'>[] };
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  seller: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface SellerPayoutAccount {
  seller_id: string;
  paystack_recipient_code: string;
  bank_name: string;
  account_name: string;
  account_number_last4: string;
  created_at: string;
  updated_at: string;
}

export type TicketCategory = 'item_not_received' | 'item_not_as_described' | 'payment_issue' | 'account' | 'other';
export type TicketStatus = 'open' | 'in_review' | 'resolved' | 'refunded' | 'closed';

export interface SupportTicket {
  id: string;
  order_id: string | null;
  reporter_id: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupportTicketWithDetails extends SupportTicket {
  reporter: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  orders: Pick<Order, 'id' | 'amount' | 'currency' | 'status' | 'paystack_reference'> | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin_reply: boolean;
  body: string;
  created_at: string;
}

