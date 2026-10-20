import { listFieldSuggestions } from '../repositories/fieldSuggestionsRepository.js';

export function getFieldSuggestions(req, res) {
  res.json({ suggestions: listFieldSuggestions() });
}
