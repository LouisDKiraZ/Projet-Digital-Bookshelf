import { apiGet } from './httpClient';
import type { FieldSuggestion } from '../types/shelf';

export async function fetchFieldSuggestions(): Promise<FieldSuggestion[]> {
  const { suggestions } = await apiGet<{ suggestions: FieldSuggestion[] }>(
    '/api/field-suggestions',
  );
  return suggestions;
}
