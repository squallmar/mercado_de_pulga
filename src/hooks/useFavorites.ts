'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const { data: session } = useSession();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!session) {
      setFavoriteIds(new Set());
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set((data.products || []).map((p: any) => p.id));
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = (productId: string) => favoriteIds.has(productId);

  const toggleFavorite = async (productId: string) => {
    if (!session) return false;
    
    const wasFavorite = favoriteIds.has(productId);
    
    // Optimistic update
    const newFavorites = new Set(favoriteIds);
    if (wasFavorite) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavoriteIds(newFavorites);

    try {
      if (wasFavorite) {
        const res = await fetch(`/api/favorites?product_id=${encodeURIComponent(productId)}`, { 
          method: 'DELETE' 
        });
        if (!res.ok) throw new Error('Failed to remove favorite');
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId })
        });
        if (!res.ok) throw new Error('Failed to add favorite');
      }
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rollback optimistic update
      setFavoriteIds(favoriteIds);
      return false;
    }
  };

  return {
    favoriteIds,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
}