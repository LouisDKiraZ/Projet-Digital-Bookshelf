import { Router } from 'express';
import { identifyUser } from '../controllers/usersController.js';

export const usersRouter = Router();

usersRouter.post('/identify', identifyUser);
