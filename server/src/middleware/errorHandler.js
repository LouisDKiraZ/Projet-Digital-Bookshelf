// Catches multer errors (bad file type, file too large) and anything
// unexpected, so the API always answers with JSON instead of crashing
// the request or leaking a stack trace.

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err?.name === 'MulterError' || /image files/.test(err?.message ?? '')) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
}
