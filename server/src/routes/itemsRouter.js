import { Router } from 'express';
import { itemPhotoUpload } from '../middleware/itemPhotoUpload.js';
import {
  getItems,
  postItem,
  patchItem,
  deleteItem,
  getHistory,
} from '../controllers/itemsController.js';

// Mounted at /api/shelves/:shelfId/items — mergeParams so handlers can
// read shelfId alongside their own :itemId.
export const itemsRouter = Router({ mergeParams: true });

itemsRouter.get('/', getItems);
itemsRouter.post('/', itemPhotoUpload, postItem);
itemsRouter.patch('/:itemId', itemPhotoUpload, patchItem);
itemsRouter.delete('/:itemId', deleteItem);
itemsRouter.get('/:itemId/history', getHistory);
