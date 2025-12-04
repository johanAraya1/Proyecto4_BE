const request = require('supertest');
const express = require('express');
// import routes directly and mount them on a fresh app so Supertest can use it reliably
const authRoutes = require('../../CenfoCoffee/backend/routes/authRoutes').default;
const roomRoutes = require('../../CenfoCoffee/backend/routes/roomRoutes').default;
const baseRoutes = require('../../CenfoCoffee/backend/routes/baseRoutes').default;
const telemetryRoutes = require('../../CenfoCoffee/backend/routes/telemetryRoutes').default;

const app = express();
app.use(express.json());
app.use('/', baseRoutes);
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/telemetry', telemetryRoutes);

// E2E flow: use the Express app directly with Supertest: register a user -> create a room -> fetch the room
describe('E2E flow tests', () => {
  beforeAll(() => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Skipping E2E tests: SUPABASE_URL or SUPABASE_KEY not set');
    }
  });

  test('register -> create room -> get room', async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) return;

    const email = `e2e+${Date.now()}@example.com`;
    const password = 'pass1234';
    const name = 'E2E User';

    // Register
    const registerRes = await request(app).post('/auth/register').send({ email, password, name });
    expect([200, 201]).toContain(registerRes.status);
    const userId = registerRes.body?.id || registerRes.body?.user?.id;
    expect(userId).toBeDefined();

    // Create a room
  // controller expects `user_id` field
  const roomPayload = { name: 'Test Room', maxPlayers: 4, user_id: userId };
  const createRoomRes = await request(app).post('/rooms').send(roomPayload);
  expect([200, 201]).toContain(createRoomRes.status);
  const roomId = createRoomRes.body?.room?.id;
  expect(roomId).toBeDefined();

  // Fetch room
  const getRoomRes = await request(app).get(`/rooms/${roomId}`);
  expect(getRoomRes.status).toBe(200);
  expect(getRoomRes.body?.room?.id).toBe(roomId);
  });
});
