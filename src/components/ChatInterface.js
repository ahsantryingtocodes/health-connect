'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

/**
 * ChatInterface Component
 * Real-time chat interface for ongoing appointments
 * 
 * @param {Object} props
 * @param {Object} props.appointment - The appointment object with roomId
 * @param {Object} props.user - The current user object (patient or doctor)
 * @param {Function} props.onClose - Callback to close the chat interface
 */
export default function ChatInterface({ appointment, user, onClose }) {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        setSocket(newSocket);

        // Connection successful
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);

            // Join the appointment room
            newSocket.emit('join-room', {
                roomId: appointment.roomId,
                userId: user.id,
                userRole: user.role,
                userName: user.name
            });
        });

        // Successfully joined room
        newSocket.on('joined-room', ({ roomId, message }) => {
            console.log(message);
            setMessages(prev => [...prev, {
                type: 'system',
                message: 'Connected to chat',
                timestamp: new Date().toISOString()
            }]);
        });

        // Another user joined
        newSocket.on('user-joined', ({ userName, userRole }) => {
            setMessages(prev => [...prev, {
                type: 'system',
                message: `${userName} (${userRole}) joined the chat`,
                timestamp: new Date().toISOString()
            }]);
        });

        // Receive message
        newSocket.on('receive-message', ({ message, senderName, senderRole, timestamp, senderId }) => {
            setMessages(prev => [...prev, {
                type: 'message',
                message,
                senderName,
                senderRole,
                timestamp,
                isOwn: senderId === user.id
            }]);
        });

        // User left
        newSocket.on('user-left', ({ userName, userRole }) => {
            setMessages(prev => [...prev, {
                type: 'system',
                message: `${userName} (${userRole}) left the chat`,
                timestamp: new Date().toISOString()
            }]);
        });

        // Error handling
        newSocket.on('error', ({ message }) => {
            setError(message);
            console.error('Socket error:', message);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        // Cleanup on unmount
        return () => {
            if (newSocket) {
                newSocket.emit('leave-room', { roomId: appointment.roomId });
                newSocket.disconnect();
            }
        };
    }, [appointment.roomId, user.id, user.name, user.role]);

    const sendMessage = () => {
        if (!inputMessage.trim() || !socket || !isConnected) return;

        socket.emit('send-message', {
            roomId: appointment.roomId,
            message: inputMessage.trim(),
            senderName: user.name,
            senderRole: user.role
        });

        setInputMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#739AF0] to-[#5a7bc0] p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">Chat</h2>
                            <p className="text-sm opacity-90 mt-1">
                                {user.role === 'PATIENT'
                                    ? `Dr. ${appointment.doctor.user.name}`
                                    : appointment.patient.name
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
                        <p className="text-red-700 font-semibold">{error}</p>
                    </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F0F7FF]">
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {msg.type === 'system' ? (
                                    <div className="text-center">
                                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                                            {msg.message}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                                            {!msg.isOwn && (
                                                <p className="text-xs text-gray-600 mb-1 px-2">
                                                    {msg.senderName} ({msg.senderRole})
                                                </p>
                                            )}
                                            <div
                                                className={`rounded-[20px] px-4 py-3 ${msg.isOwn
                                                    ? 'bg-[#739AF0] text-white'
                                                    : 'bg-white text-[#0F2D52] border-2 border-gray-200'
                                                    }`}
                                            >
                                                <p className="text-sm break-words">{msg.message}</p>
                                                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t-2 border-gray-200">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={!isConnected}
                            className="flex-1 px-4 py-3 rounded-[20px] border-2 border-gray-300 focus:border-[#739AF0] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || !isConnected}
                            className="px-6 py-3 bg-[#739AF0] text-white rounded-[20px] font-semibold hover:bg-[#5a7bc0] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
