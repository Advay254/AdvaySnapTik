import { Router } from 'express';
import { requireApiKey }         from '../../middleware/auth.js';
import { apiRateLimiter }        from '../../middleware/rateLimiter.js';
import { validateUrlMiddleware } from '../../middleware/validator.js';
import { extract }               from '../../services/extractor.js';

const router = Router();
router.get('/', apiRateLimiter, requireApiKey, validateUrlMiddleware, async (req, res) => {
  try   { res.json({ success: true, data: await extract(req.tiktokUrl) }); }
  catch (e) { res.status(422).json({ success: false, error: e.message }); }
});
export default router;
