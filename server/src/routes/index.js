import { Router } from 'express';
import { usersRouter } from './usersRouter.js';
import { shelvesRouter } from './shelvesRouter.js';
import { fieldSuggestionsRouter } from './fieldSuggestionsRouter.js';
import { fieldTypesRouter } from './fieldTypesRouter.js';

export const apiRouter = Router();

apiRouter.use('/users', usersRouter);
apiRouter.use('/shelves', shelvesRouter);
apiRouter.use('/field-suggestions', fieldSuggestionsRouter);
apiRouter.use('/field-types', fieldTypesRouter);
