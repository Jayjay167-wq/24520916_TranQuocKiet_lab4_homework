import { useSearchParams } from 'react-router';
import { toCategorySlug } from './photos.js';

/**
 * The active category, read straight from `?category=` on every render.
 * The URL is the only store: nothing is copied into component state.
 * @returns {import('./photos.js').CategorySlug | null} null = show all
 */
export function useCategoryParam() {
  const [searchParams] = useSearchParams();
  return toCategorySlug(searchParams.get('category'));
}
