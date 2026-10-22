import { getFieldSuggestions } from '../lib/localStore';
import type { FieldSuggestion } from '../types/shelf';

export async function fetchFieldSuggestions(): Promise<FieldSuggestion[]> {
  return getFieldSuggestions();
}
