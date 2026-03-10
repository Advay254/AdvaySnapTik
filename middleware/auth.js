// Accepts: X-RapidAPI-Proxy-Secret | X-API-Key | Authorization: Bearer
const RAPIDAPI_SECRET = process.env.RAPIDAPI_SECRET || '';
const OWNER_API_KEY   = process.env.OWNER_API_KEY   || '';

export function requireApiKey(req, res, next) {
  const key =
    req.headers['x-rapidapi-proxy-secret'] ||
    req.headers['x-api-key']               ||
    (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');

  if (!key)
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing API key.' });

  const valid =
    (RAPIDAPI_SECRET && key === RAPIDAPI_SECRET) ||
    (OWNER_API_KEY   && key === OWNER_API_KEY);

  if (!valid)
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid API key.' });

  req.apiKeyType = (OWNER_API_KEY && key === OWNER_API_KEY) ? 'owner' : 'rapidapi';
  next();
}
