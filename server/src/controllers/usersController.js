import { findOrCreateUser } from '../repositories/usersRepository.js';

export function identifyUser(req, res) {
  const displayName = String(req.body?.displayName ?? '').trim();
  if (!displayName) {
    res.status(400).json({ error: 'displayName is required.' });
    return;
  }
  if (displayName.length > 40) {
    res.status(400).json({ error: 'displayName must be 40 characters or fewer.' });
    return;
  }

  const user = findOrCreateUser(displayName);
  res.json({ id: user.id, displayName: user.display_name });
}
