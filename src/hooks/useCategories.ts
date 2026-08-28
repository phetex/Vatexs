import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from('categories')
      .select('*')
      .order('id')
      .then(({ data }) => {
        if (active) {
          setCategories((data as Category[]) ?? []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
