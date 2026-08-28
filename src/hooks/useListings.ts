import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ListingWithDetails } from '../types/database';

const LISTING_SELECT = `
  *,
  listing_images ( id, listing_id, url, position ),
  categories ( id, name, slug, icon ),
  profiles!listings_seller_id_fkey ( id, full_name, avatar_url, location )
`;

interface UseListingsOptions {
  categoryId?: number | null;
  search?: string;
  sellerId?: string;
}

export function useListings({ categoryId, search, sellerId }: UseListingsOptions = {}) {
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      let query = supabase
        .from('listings')
        .select(LISTING_SELECT)
        .order('created_at', { ascending: false });

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      } else {
        query = query.eq('status', 'active');
      }
      if (categoryId) query = query.eq('category_id', categoryId);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data, error: err } = await query;
      if (err) setError(err.message);
      else {
        setListings((data as unknown as ListingWithDetails[]) ?? []);
        setError(null);
      }
      isRefresh ? setRefreshing(false) : setLoading(false);
    },
    [categoryId, search, sellerId]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, refreshing, error, refresh: () => fetchListings(true) };
}

export async function fetchListing(id: string) {
  const { data, error } = await supabase.from('listings').select(LISTING_SELECT).eq('id', id).single();
  if (error) throw error;
  return data as unknown as ListingWithDetails;
}
