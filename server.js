const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const io = new Server(3001, {
    cors: {
        origin: 'http://localhost:1121',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

console.log('🚀 Socket.IO server running on port 3001');

// Store active connections: { socketId: { userId, userRole, roomId } }
const activeConnections = new Map();

/**
 * Validate if a user has access to a specific appointment room
 * @param {number} userId - The user's ID
 * @param {string} userRole - The user's role (PATIENT or DOCTOR)
 * @param {string} roomId - The appointment room ID
 * @returns {Promise<boolean>} - True if user has access, false otherwise
 */
async function validateRoomAccess(userId, userRole, roomId) {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { roomId },
            include: {
                patient: true,
                doctor: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!appointment) {
            return false;
        }

        // Check if appointment is ongoing (status is CONFIRMED and within time window)
        const now = new Date();
        const appointmentTime = new Date(appointment.date);
        const oneHourAfter = new Date(appointmentTime.getTime() + 60 * 60 * 1000);

        if (appointment.status !== 'CONFIRMED' || now < appointmentTime || now > oneHourAfter) {
            return false;
        }

        // Validate user access
        if (userRole === 'PATIENT' && appointment.patientId === userId) {
            return true;
        }

        if (userRole === 'DOCTOR' && appointment.doctor.userId === userId) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating room access:', error);
        return false;
    }
}

io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} `);

    /**
     * Join a room for chat or video call
     * Payload: { roomId, userId, userRole, userName }
     */
    socket.on('join-room', async ({ roomId, userId, userRole, userName }) => {
        try {
            // Validate access
            const hasAccess = await validateRoomAccess(userId, userRole, roomId);

            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to this room' });
                return;
            }

            // Check if there are already users in the room
            const roomSockets = await io.in(roomId).fetchSockets();
            const otherUsersInRoom = roomSockets.length > 0;

            // Join the room
            socket.join(roomId);

            // Store connection info
            activeConnections.set(socket.id, { userId, userRole, roomId, userName });

            console.log(`👤 ${userName} (${userRole}) joined room: ${roomId}`);

            // If there are other users, notify them AND notify this user about them
            if (otherUsersInRoom) {
                console.log(`🔔 Notifying existing users in room ${roomId}`);
                // Notify others that this user joined
                socket.to(roomId).emit('user-joined', {
                    userId,
                    userRole,
                    userName,
                    socketId: socket.id
                });

                // Notify this user that others are already here (trigger them to create offer)
                socket.emit('user-already-in-room', {
                    message: 'Other users are in the room'
                });
            } else {
                console.log(`📭 First user in room ${roomId}`);
            }

            socket.emit('joined-room', { roomId, message: 'Successfully joined room' });
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    /**
     * Send a chat message
     * Payload: { roomId, message, senderName, senderRole }
     */
    socket.on('send-message', ({ roomId, message, senderName, senderRole }) => {
        const connectionInfo = activeConnections.get(socket.id);

        if (!connectionInfo || connectionInfo.roomId !== roomId) {
            socket.emit('error', { message: 'Not authorized to send messages in this room' });
            return;
        }

        // Broadcast message to everyone in the room (including sender for confirmation)
        io.to(roomId).emit('receive-message', {
            message,
            senderName,
            senderRole,
            timestamp: new Date().toISOString(),
            senderId: connectionInfo.userId
        });

        console.log(`💬 Message in room ${roomId} from ${senderName}: ${message} `);
    });

    /**
     * WebRTC Signaling: Send offer
     * Payload: { roomId, offer }
     */
    socket.on('webrtc-offer', ({ roomId, offer }) => {
        const connectionInfo = activeConnections.get(socket.id);

        if (!connectionInfo || connectionInfo.roomId !== roomId) {
            socket.emit('error', { message: 'Not authorized for WebRTC in this room' });
            return;
        }

        // Send offer to other participants in the room
        socket.to(roomId).emit('webrtc-offer', {
            offer,
            senderId: connectionInfo.userId,
            senderSocketId: socket.id
        });

        console.log(`📹 WebRTC offer sent in room ${roomId} `);
    });

    /**
     * WebRTC Signaling: Send answer
     * Payload: { roomId, answer }
     */
    socket.on('webrtc-answer', ({ roomId, answer }) => {
        const connectionInfo = activeConnections.get(socket.id);

        if (!connectionInfo || connectionInfo.roomId !== roomId) {
            socket.emit('error', { message: 'Not authorized for WebRTC in this room' });
            return;
        }

        // Send answer to other participants in the room
        socket.to(roomId).emit('webrtc-answer', {
            answer,
            senderId: connectionInfo.userId,
            senderSocketId: socket.id
        });

        console.log(`📹 WebRTC answer sent in room ${roomId} `);
    });

    /**
     * WebRTC Signaling: Send ICE candidate
     * Payload: { roomId, candidate }
     */
    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
        const connectionInfo = activeConnections.get(socket.id);

        if (!connectionInfo || connectionInfo.roomId !== roomId) {
            socket.emit('error', { message: 'Not authorized for WebRTC in this room' });
            return;
        }

        // Send ICE candidate to other participants in the room
        socket.to(roomId).emit('webrtc-ice-candidate', {
            candidate,
            senderId: connectionInfo.userId,
            senderSocketId: socket.id
        });
    });

    /**
     * Leave a room
     * Payload: { roomId }
     */
    socket.on('leave-room', ({ roomId }) => {
        const connectionInfo = activeConnections.get(socket.id);

        if (connectionInfo && connectionInfo.roomId === roomId) {
            socket.leave(roomId);
            socket.to(roomId).emit('user-left', {
                userId: connectionInfo.userId,
                userName: connectionInfo.userName,
                userRole: connectionInfo.userRole
            });

            console.log(`👋 ${connectionInfo.userName} left room: ${roomId} `);
            activeConnections.delete(socket.id);
        }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
        const connectionInfo = activeConnections.get(socket.id);

        if (connectionInfo) {
            const { roomId, userName, userId, userRole } = connectionInfo;

            // Notify others in the room
            socket.to(roomId).emit('user-left', { userId, userName, userRole });

            console.log(`❌ ${userName} disconnected from room: ${roomId} `);
            activeConnections.delete(socket.id);
        }

        console.log(`❌ Client disconnected: ${socket.id} `);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Socket.IO server...');
    await prisma.$disconnect();
    io.close(() => {
        console.log('✅ Socket.IO server closed');
        process.exit(0);
    });
});
