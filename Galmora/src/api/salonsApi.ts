/**
 * Salons API - MongoDB & Backend API
 * High-performance backend API integration
 */
import { Salon } from '../types';
import { SALONS } from '../constants/mockData';
import { fetchSalonsFromBackend } from './mongoApi';

export interface SalonFilterOptions {
  query?: string;
  category?: string;
  maxDistanceKm?: number;
  priceLevel?: string;
  minRating?: number;
  openOnly?: boolean;
}

export async function fetchSalons(filters?: SalonFilterOptions): Promise<Salon[]> {
  let list: Salon[] = [];
  const isMockAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK === 'true';

  try {
    const backendSalons = await fetchSalonsFromBackend({
      query: filters?.query,
      category: filters?.category,
    });
    if (backendSalons && backendSalons.length > 0) {
      list = backendSalons;
    } else if (isMockAllowed) {
      list = [...SALONS];
    } else {
      list = [];
    }
  } catch (e) {
    console.warn('Backend fetchSalons note:', e);
    list = isMockAllowed ? [...SALONS] : [];
  }

  // Apply filters
  if (!filters) return list;

  return list.filter((salon) => {
    if (filters.query && filters.query.trim().length > 0) {
      const q = filters.query.toLowerCase().trim();
      const matchName = salon.name.toLowerCase().includes(q);
      const matchArea = (salon.area || salon.address || '').toLowerCase().includes(q);
      const matchCategory = salon.categories?.some((c) => c.toLowerCase().includes(q));
      const matchService = salon.services?.some((s) => s.name.toLowerCase().includes(q));
      if (!matchName && !matchArea && !matchCategory && !matchService) {
        return false;
      }
    }

    if (filters.category && filters.category !== 'all' && filters.category !== 'All') {
      const matchCategory = salon.categories?.some(
        (c) => c.toLowerCase().includes(filters.category!.toLowerCase())
      );
      if (!matchCategory) return false;
    }

    if (filters.maxDistanceKm && salon.distanceKm !== undefined) {
      if (salon.distanceKm > filters.maxDistanceKm) return false;
    }

    if (filters.priceLevel && salon.priceLevel !== filters.priceLevel) {
      return false;
    }

    if (filters.minRating && salon.rating < filters.minRating) {
      return false;
    }

    if (filters.openOnly && !salon.isOpenNow) {
      return false;
    }

    return true;
  });
}

export async function fetchSalonById(id: string): Promise<Salon | null> {
  try {
    const salons = await fetchSalons();
    const found = salons.find((s) => s.id === id);
    if (found) return found;
  } catch (e) {
    console.warn('Error fetching salon by id:', e);
  }

  const isMockAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK === 'true';
  if (isMockAllowed) {
    return SALONS.find((s) => s.id === id) || null;
  }
  return null;
}
