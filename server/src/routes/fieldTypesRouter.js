import { Router } from 'express';
import { FIELD_TYPES } from '../constants/fieldTypes.js';

export const fieldTypesRouter = Router();

// The client fetches this instead of hardcoding its own copy of
// FIELD_TYPES, so the two sides can never drift out of sync.
fieldTypesRouter.get('/', (req, res) => {
  res.json({ fieldTypes: FIELD_TYPES });
});
