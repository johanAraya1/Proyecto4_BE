import { Router } from 'express';

// Base API route - health check and status endpoint
const router = Router();

router.get('/', (req, res) => {    // GET / - API status check
  res.json({ message: 'Backend ready' });
});

export default router;
