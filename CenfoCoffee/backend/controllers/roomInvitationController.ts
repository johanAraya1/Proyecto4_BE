import { Request, Response } from 'express';
import { roomInvitationService } from '../services/roomInvitationService';
import { telemetryService } from '../services/telemetryService';

// Helper function para obtener userId del request
const getUserIdFromRequest = (req: Request): number | null => {
  console.log('🔧 DEBUG getUserIdFromRequest:', {
    allHeaders: req.headers,
    xUserId: req.headers['x-user-id']
  });

  const userIdHeader = req.headers['x-user-id'] || req.headers['X-User-Id'] || req.headers['X-USER-ID'];
  
  if (userIdHeader && typeof userIdHeader === 'string') {
    const userId = parseInt(userIdHeader);
    console.log('🔧 Parsed userId:', { userIdHeader, userId, isValid: !isNaN(userId) });
    return isNaN(userId) ? 1 : userId;
  }
  
  console.log('🔧 No valid userId header found, using default: 1');
  return 1;
};

// POST /room-invitations/send - Enviar invitación a sala
export const sendRoomInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { toUserId, roomId } = req.body;
    const fromUserId = getUserIdFromRequest(req);

    console.log('📤 DEBUG sendRoomInvitation:', {
      body: req.body,
      toUserId,
      roomId,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'content-type': req.headers['content-type']
      },
      fromUserId
    });

    if (!fromUserId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!toUserId) {
      console.log('❌ Error: toUserId faltante');
      res.status(400).json({ error: 'ID del usuario destinatario es requerido' });
      return;
    }

    if (!roomId) {
      console.log('❌ Error: roomId faltante');
      res.status(400).json({ error: 'ID de la sala es requerido' });
      return;
    }

    console.log('🔍 DEBUG roomId info:', {
      roomId,
      type: typeof roomId,
      length: typeof roomId === 'string' ? roomId.length : 'N/A',
      isValidUUID: typeof roomId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)
    });

    // Convertir toUserId a número si viene como string
    const toUserIdNumber = typeof toUserId === 'string' ? parseInt(toUserId) : toUserId;
    if (isNaN(toUserIdNumber)) {
      res.status(400).json({ error: 'ID del usuario destinatario debe ser un número válido' });
      return;
    }

    const invitation = await roomInvitationService.sendRoomInvitation(
      fromUserId, 
      toUserIdNumber, 
      roomId
    );
    
    telemetryService.incrementEvent('room_invitation_sent');
    res.status(201).json({ 
      message: 'Invitación a sala enviada',
      invitation 
    });
  } catch (error: any) {
    console.log('❌ Error en sendRoomInvitation:', error.message);
    telemetryService.incrementEvent('room_invitation_send_failed');
    res.status(400).json({ error: error.message });
  }
};

// GET /room-invitations/received - Obtener invitaciones recibidas
export const getReceivedInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);

    console.log('📥 DEBUG getReceivedInvitations:', {
      headers: {
        'x-user-id': req.headers['x-user-id']
      },
      userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const invitations = await roomInvitationService.getReceivedInvitations(userId);
    
    console.log('📥 DEBUG invitations found:', {
      userId,
      invitationsCount: invitations.length,
      invitations
    });
    
    telemetryService.incrementEvent('room_invitations_received_retrieved');
    res.status(200).json({ invitations });
  } catch (error: any) {
    console.log('❌ Error en getReceivedInvitations:', error.message);
    telemetryService.incrementEvent('room_invitations_received_retrieval_failed');
    res.status(500).json({ error: error.message });
  }
};

// GET /room-invitations/sent - Obtener invitaciones enviadas
export const getSentInvitations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);

    console.log('📤 DEBUG getSentInvitations:', {
      headers: {
        'x-user-id': req.headers['x-user-id']
      },
      userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const invitations = await roomInvitationService.getSentInvitations(userId);
    
    console.log('📤 DEBUG sent invitations found:', {
      userId,
      invitationsCount: invitations.length,
      invitations
    });
    
    telemetryService.incrementEvent('room_invitations_sent_retrieved');
    res.status(200).json({ invitations });
  } catch (error: any) {
    console.log('❌ Error en getSentInvitations:', error.message);
    telemetryService.incrementEvent('room_invitations_sent_retrieval_failed');
    res.status(500).json({ error: error.message });
  }
};

// POST /room-invitations/accept - Aceptar invitación a sala
export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.body;
    const userId = getUserIdFromRequest(req);

    console.log('✅ DEBUG acceptInvitation:', {
      body: req.body,
      invitationId,
      userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!invitationId) {
      console.log('❌ Error: invitationId faltante');
      res.status(400).json({ error: 'ID de la invitación es requerido' });
      return;
    }

    // Convertir invitationId a número si viene como string
    const invitationIdNumber = typeof invitationId === 'string' ? parseInt(invitationId) : invitationId;
    if (isNaN(invitationIdNumber)) {
      res.status(400).json({ error: 'ID de la invitación debe ser un número válido' });
      return;
    }

    const result = await roomInvitationService.acceptInvitation(invitationIdNumber, userId);
    
    telemetryService.incrementEvent('room_invitation_accepted');
    res.status(200).json({ 
      message: 'Invitación aceptada. Puedes unirte a la sala usando el código',
      roomCode: result.roomCode,
      invitation: result.invitation
    });
  } catch (error: any) {
    console.log('❌ Error en acceptInvitation:', error.message);
    telemetryService.incrementEvent('room_invitation_accept_failed');
    res.status(400).json({ error: error.message });
  }
};

// POST /room-invitations/reject - Rechazar invitación a sala
export const rejectInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.body;
    const userId = getUserIdFromRequest(req);

    console.log('❌ DEBUG rejectInvitation:', {
      body: req.body,
      invitationId,
      userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!invitationId) {
      console.log('❌ Error: invitationId faltante');
      res.status(400).json({ error: 'ID de la invitación es requerido' });
      return;
    }

    // Convertir invitationId a número si viene como string
    const invitationIdNumber = typeof invitationId === 'string' ? parseInt(invitationId) : invitationId;
    if (isNaN(invitationIdNumber)) {
      res.status(400).json({ error: 'ID de la invitación debe ser un número válido' });
      return;
    }

    await roomInvitationService.rejectInvitation(invitationIdNumber, userId);
    
    telemetryService.incrementEvent('room_invitation_rejected');
    res.status(200).json({ message: 'Invitación rechazada' });
  } catch (error: any) {
    console.log('❌ Error en rejectInvitation:', error.message);
    telemetryService.incrementEvent('room_invitation_reject_failed');
    res.status(400).json({ error: error.message });
  }
};

// DELETE /room-invitations/:invitationId - Cancelar invitación enviada
export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { invitationId } = req.params;
    const userId = getUserIdFromRequest(req);

    console.log('🗑️ DEBUG cancelInvitation:', {
      params: req.params,
      invitationId,
      userId
    });

    if (!userId) {
      console.log('❌ Error: Usuario no autenticado');
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!invitationId) {
      console.log('❌ Error: invitationId faltante');
      res.status(400).json({ error: 'ID de la invitación es requerido' });
      return;
    }

    // Convertir invitationId a número
    const invitationIdNumber = parseInt(invitationId);
    if (isNaN(invitationIdNumber)) {
      res.status(400).json({ error: 'ID de la invitación debe ser un número válido' });
      return;
    }

    await roomInvitationService.cancelInvitation(invitationIdNumber, userId);
    
    telemetryService.incrementEvent('room_invitation_cancelled');
    res.status(200).json({ message: 'Invitación cancelada' });
  } catch (error: any) {
    console.log('❌ Error en cancelInvitation:', error.message);
    telemetryService.incrementEvent('room_invitation_cancel_failed');
    res.status(400).json({ error: error.message });
  }
};
