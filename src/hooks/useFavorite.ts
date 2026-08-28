import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useFavorite(listingId: string) {
  const { session } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    supabase
      .from('favorites')
      .select('listing_id')
      .eq('listing_id', listingId)
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsFavorite(!!data);
        setLoading(false);
      });
  }, [listingId, session]);

  const toggle = async () => {
    if (!session) return;
    if (isFavorite) {
      setIsFavorite(false);
      await supabase.from('favorites').delete().eq('listing_id', listingId).eq('user_id', session.user.id);
    } else {
      setIsFavorite(true);
      await supabase.from('favorites').insert({ listing_id: listingId, user_id: session.user.id });
    }
  };

  return { isFavorite, loading, toggle };
}
