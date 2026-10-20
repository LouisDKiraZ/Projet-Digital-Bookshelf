import { Router } from 'express';
import { getFieldSuggestions } from '../controllers/fieldSuggestionsController.js';

export const fieldSuggestionsRouter = Router();

fieldSuggestionsRouter.get('/', getFieldSuggestions);
