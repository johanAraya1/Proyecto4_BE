import { Request, Response } from 'express';
import { friendService } from '../services/friendService';
import { telemetryService } from '../services/telemetryService';

// Helper function to get user ID from request (similar to login pattern)
const getUserIdFromRequest = (req: Request): number | null => {
  // Debug para ver todos los headers
  console.log('🔧 DEBUG getUserIdFromRequest:', {
    allHeaders: req.headers,
    xUserId: req.headers['x-user-id'],
    XUserId: req.headers['X-User-Id'], // Try uppercase
    userAgent: req.headers['user-agent']
  });

  // Buscar el header de diferentes formas
  const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-Id'] || req.headers['X-USER-ID'];
  
  if (userIdHeader && typeof userIdHeader === 'string') {
    const userId = parseInt(userIdHeader);
    console.log('🔧 Parsed userId:', { userIdHeader, userId, isValid: !isNaN(userId) });
    return isNaN(userId) ? 1 : userId; // Default to 1 if invalid
  }
  
  console.log('🔧 No valid userId header found, using default: 1');
  return 1; // Usuario por defecto para testing
};

// POST /friends/search - Buscar usuarios por nombre o email
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    const userId = getUserIdFromRequest(req);

    // Debug logging para ver qué está enviando el frontend
    console.log('🔍 DEBUG searchUsers:', {
      body: req.body,
      query: query,
      queryType: typeof query,
      queryLength: query ? query.length : 0,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'content-type': req.headers['content-type']
      },
      userId: userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!query || query.trim().length < 2) {
      console.log('❌ Error: Query inválido:', { query, length: query ? query.length : 0 });
      res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
      return;
    }

    const users = await friendService.searchUsers(query.trim(), userId);
    
    telemetryService.incrementEvent('friends_search_success');
    res.status(200).json({ users });
  } catch (error: any) {
    telemetryService.incrementEvent('friends_search_failed');
    res.status(500).json({ error: error.message });
  }
};

// POST /friends/request - Enviar solicitud de amistad
export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { toUserId } = req.body;
    const fromUserId = getUserIdFromRequest(req);

    // Debug logging para envío de solicitudes
    console.log('📤 DEBUG sendFriendRequest:', {
      body: req.body,
      toUserId: toUserId,
      toUserIdType: typeof toUserId,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'content-type': req.headers['content-type']
      },
      fromUserId: fromUserId
    });

    if (!fromUserId) {
      console.log('❌ Error: Usuario no autenticado en sendFriendRequest');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!toUserId) {
      console.log('❌ Error: toUserId faltante:', { toUserId, body: req.body });
      res.status(400).json({ error: 'ID del usuario destinatario es requerido' });
      return;
    }

    // Convertir toUserId a número si viene como string
    const toUserIdNumber = typeof toUserId === 'string' ? parseInt(toUserId) : toUserId;
    if (isNaN(toUserIdNumber)) {
      res.status(400).json({ error: 'ID del usuario destinatario debe ser un número válido' });
      return;
    }

    const request = await friendService.sendFriendRequest(fromUserId, toUserIdNumber);
    
    telemetryService.incrementEvent('friend_request_sent');
    res.status(201).json({ 
      message: 'Solicitud de amistad enviada',
      request 
    });
  } catch (error: any) {
    telemetryService.incrementEvent('friend_request_send_failed');
    res.status(400).json({ error: error.message });
  }
};

// GET /friends/requests - Obtener solicitudes de amistad recibidas
export const getReceivedRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);

    // Debug logging para ver solicitudes
    console.log('📥 DEBUG getReceivedRequests:', {
      headers: {
        'x-user-id': req.headers['x-user-id']
      },
      userId: userId,
      userIdType: typeof userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado en getReceivedRequests');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const requests = await friendService.getReceivedFriendRequests(userId);
    
    console.log('📥 DEBUG requests found:', {
      userId: userId,
      requestsCount: requests.length,
      requests: requests
    });
    
    telemetryService.incrementEvent('friend_requests_retrieved');
    res.status(200).json({ requests });
  } catch (error: any) {
    console.log('❌ Error en getReceivedRequests:', error.message);
    telemetryService.incrementEvent('friend_requests_retrieval_failed');
    res.status(500).json({ error: error.message });
  }
};

// POST /friends/request/accept - Aceptar solicitud de amistad
export const acceptFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!requestId) {
      res.status(400).json({ error: 'ID de la solicitud es requerido' });
      return;
    }

    // Convertir requestId a número si viene como string
    const requestIdNumber = typeof requestId === 'string' ? parseInt(requestId) : requestId;
    if (isNaN(requestIdNumber)) {
      res.status(400).json({ error: 'ID de la solicitud debe ser un número válido' });
      return;
    }

    const friendship = await friendService.acceptFriendRequest(requestIdNumber, userId);
    
    telemetryService.incrementEvent('friend_request_accepted');
    res.status(200).json({ 
      message: 'Solicitud de amistad aceptada',
      friendship 
    });
  } catch (error: any) {
    telemetryService.incrementEvent('friend_request_accept_failed');
    res.status(400).json({ error: error.message });
  }
};

// POST /friends/request/reject - Rechazar solicitud de amistad
export const rejectFriendRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.body;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!requestId) {
      res.status(400).json({ error: 'ID de la solicitud es requerido' });
      return;
    }

    // Convertir requestId a número si viene como string
    const requestIdNumber = typeof requestId === 'string' ? parseInt(requestId) : requestId;
    if (isNaN(requestIdNumber)) {
      res.status(400).json({ error: 'ID de la solicitud debe ser un número válido' });
      return;
    }

    await friendService.rejectFriendRequest(requestIdNumber, userId);
    
    telemetryService.incrementEvent('friend_request_rejected');
    res.status(200).json({ message: 'Solicitud de amistad rechazada' });
  } catch (error: any) {
    telemetryService.incrementEvent('friend_request_reject_failed');
    res.status(400).json({ error: error.message });
  }
};

// GET /friends - Listar amigos del usuario
export const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const friends = await friendService.getFriends(userId);
    
    telemetryService.incrementEvent('friends_list_retrieved');
    res.status(200).json({ friends });
  } catch (error: any) {
    telemetryService.incrementEvent('friends_list_retrieval_failed');
    res.status(500).json({ error: error.message });
  }
};

// DELETE /friends/:friendId - Eliminar amistad
export const removeFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!friendId) {
      res.status(400).json({ error: 'ID del amigo es requerido' });
      return;
    }

    // Convertir friendId a número
    const friendIdNumber = parseInt(friendId);
    if (isNaN(friendIdNumber)) {
      res.status(400).json({ error: 'ID del amigo debe ser un número válido' });
      return;
    }

    await friendService.removeFriend(userId, friendIdNumber);
    
    telemetryService.incrementEvent('friend_removed');
    res.status(200).json({ message: 'Amistad eliminada' });
  } catch (error: any) {
    telemetryService.incrementEvent('friend_removal_failed');
    res.status(400).json({ error: error.message });
  }
};