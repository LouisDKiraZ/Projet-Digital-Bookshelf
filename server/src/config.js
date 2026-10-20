// Single source of truth for every environment-driven constant. Nothing else
// in the server should read `process.env` directly.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const dataDir = path.join(serverRoot, 'data');

export const config = {
  port: Number(process.env.PORT ?? 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  dataDir,
  dbPath: path.join(dataDir, 'bookshelf.sqlite'),
  shelfIconsDir: path.join(dataDir, 'uploads', 'shelf-icons'),
  itemPhotosDir: path.join(dataDir, 'uploads', 'item-photos'),
  uploadsUrlPrefix: '/uploads',
};
