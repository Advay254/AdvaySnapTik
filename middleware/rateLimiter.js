import rateLimit from 'express-rate-limit';

const msg = { error: 'Too Many Requests', message: 'Slow down — too many requests.' };

export const webRateLimiter = rateLimit({ windowMs: 60_000, max: 30,  standardHeaders: true, legacyHeaders: false, message: msg });
export const apiRateLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false, message: msg });
