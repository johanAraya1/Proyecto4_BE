import { Router } from 'express';
import {
  sendRoomInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation
} from '../controllers/roomInvitationController';

// Room invitation management routes
const router = Router();

// POST /room-invitations/send - Enviar invitación a sala
router.post('/room-invitations/send', sendRoomInvitation);

// GET /room-invitations/received - Obtener invitaciones recibidas
router.get('/room-invitations/received', getReceivedInvitations);

// GET /room-invitations/sent - Obtener invitaciones enviadas
router.get('/room-invitations/sent', getSentInvitations);

// POST /room-invitations/accept - Aceptar invitación
router.post('/room-invitations/accept', acceptInvitation);

// POST /room-invitations/reject - Rechazar invitación
router.post('/room-invitations/reject', rejectInvitation);

// DELETE /room-invitations/:invitationId - Cancelar invitación
router.delete('/room-invitations/:invitationId', cancelInvitation);

export default router;
