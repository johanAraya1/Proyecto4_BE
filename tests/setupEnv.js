const path = require('path');
const dotenv = require('dotenv');

// Prefer .env.test at project root or backend .env
const candidates = [
  path.resolve(process.cwd(), 'CenfoCoffee/backend/.env'),
  path.resolve(process.cwd(), '.env.test'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of candidates) {
  try {
    const res = dotenv.config({ path: p });
    if (res.parsed) {
      console.log('Loaded env from', p);
      break;
    }
  } catch (e) {
    // continue
  }
}
