import { Review } from '../../types';
import { normalizeScore } from './rating';

export interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string }[];
}

export function validateReviewInput(data: Partial<Review>): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required.' });
  }

  if (!data.type || !['Movie', 'Series', 'Anime', 'Documentary', 'Mini Series', 'Special'].includes(data.type)) {
    errors.push({ field: 'type', message: 'Valid media type is required.' });
  }

  if (!data.releaseYear || typeof data.releaseYear !== 'number' || data.releaseYear < 1888 || data.releaseYear > 2100) {
    errors.push({ field: 'releaseYear', message: 'Valid release year is required.' });
  }

  if (typeof data.abstractScore !== 'number' || isNaN(data.abstractScore)) {
    errors.push({ field: 'abstractScore', message: 'Abstract Score (1–10) is required.' });
  }

  if (!data.myTake || typeof data.myTake !== 'string' || data.myTake.trim().length < 5) {
    errors.push({ field: 'myTake', message: 'Creator thesis ("My Take") is required (min 5 characters).' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
