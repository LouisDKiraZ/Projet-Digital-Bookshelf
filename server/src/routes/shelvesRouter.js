import { Router } from 'express';
import { shelfIconUpload } from '../middleware/shelfIconUpload.js';
import { postShelf, getShelf, getMembers } from '../controllers/shelvesController.js';
import { itemsRouter } from './itemsRouter.js';

export const shelvesRouter = Router();

shelvesRouter.post('/', shelfIconUpload.single('iconImage'), postShelf);
shelvesRouter.get('/:id', getShelf);
shelvesRouter.get('/:id/members', getMembers);
shelvesRouter.use('/:shelfId/items', itemsRouter);
