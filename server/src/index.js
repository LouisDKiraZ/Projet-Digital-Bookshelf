// Entry point: sets up Express, mounts the API and static uploads, starts
// listening. Importing `./db/connection.js` (transitively, via the routes)
// is what creates the SQLite file and tables on first run.

import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use(config.uploadsUrlPrefix, express.static(path.join(config.dataDir, 'uploads')));

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Digital Bookshelf API listening on http://localhost:${config.port}`);
});
