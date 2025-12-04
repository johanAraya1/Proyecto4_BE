import { Router } from 'express';
import { 
  searchUsers, 
  sendFriendRequest, 
  getReceivedRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getFriends, 
  removeFriend 
} from '../controllers/friendController';

// Friend management routes - following the same pattern as authRoutes
const router = Router();

// POST /friends/find - Buscar usuarios (ruta que espera el frontend)
router.post('/friends/find', searchUsers);

// POST /friends/search - Buscar usuarios (ruta alternativa)
router.post('/friends/search', searchUsers);

// POST /friends/request - Enviar solicitud de amistad
router.post('/friends/request', sendFriendRequest);

// GET /friends/requests - Obtener solicitudes de amistad recibidas
router.get('/friends/requests', getReceivedRequests);

// POST /friends/request/accept - Aceptar solicitud de amistad
router.post('/friends/request/accept', acceptFriendRequest);

// POST /friends/request/reject - Rechazar solicitud de amistad
router.post('/friends/request/reject', rejectFriendRequest);

// GET /friends/list - Listar amigos del usuario (ruta que espera el frontend)
router.get('/friends/list', getFriends);

// GET /friends - Listar amigos del usuario (ruta alternativa)
router.get('/friends', getFriends);

// DELETE /friends/:friendId - Eliminar amistad
router.delete('/friends/:friendId', removeFriend);

export default router;