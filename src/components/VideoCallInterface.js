'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';

/**
 * VideoCallInterface Component
 * WebRTC-based video calling for ongoing appointments
 * 
 * @param {Object} props
 * @param {Object} props.appointment - The appointment object with roomId
 * @param {Object} props.user - The current user object (patient or doctor)
 * @param {Function} props.onClose - Callback to close the video call interface
 */
export default function VideoCallInterface({ appointment, user, onClose }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState(null);
    const [callStatus, setCallStatus] = useState('Connecting...');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);

    // WebRTC configuration with Google's public STUN server
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Initialize media stream
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                setCallStatus('Waiting for other participant...');
            } catch (err) {
                console.error('Error accessing media devices:', err);
                setError('Failed to access camera/microphone. Please grant permissions.');
                setCallStatus('Error');
            }
        };

        initializeMedia();

        return () => {
            // Cleanup media streams
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Initialize socket and WebRTC
    useEffect(() => {
        if (!localStream) return;

        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            reconnection: true
        });

        setSocket(newSocket);

        // Create peer connection
        const createPeerConnection = () => {
            const peerConnection = new RTCPeerConnection(rtcConfig);

            // Add local stream tracks to peer connection
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Handle incoming remote stream
            peerConnection.ontrack = (event) => {
                console.log('Received remote track');
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setCallStatus('Connected');
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && newSocket) {
                    newSocket.emit('webrtc-ice-candidate', {
                        roomId: appointment.roomId,
                        candidate: event.candidate
                    });
                }
            };

            // Connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', peerConnection.connectionState);
                if (peerConnection.connectionState === 'connected') {
                    setCallStatus('Connected');
                } else if (peerConnection.connectionState === 'disconnected') {
                    setCallStatus('Disconnected');
                } else if (peerConnection.connectionState === 'failed') {
                    setCallStatus('Connection failed');
                    setError('Failed to establish peer connection');
                }
            };

            peerConnectionRef.current = peerConnection;
            return peerConnection;
        };

        // Create and send offer
        const createOffer = async () => {
            try {
                const peerConnection = createPeerConnection();
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                newSocket.emit('webrtc-offer', {
                    roomId: appointment.roomId,
                    offer: offer
                });

                console.log('Offer sent');
            } catch (err) {
                console.error('Error creating offer:', err);
                setError('Failed to create call offer');
            }
        };

        // Handle incoming offer and send answer
        const handleOffer = async (offer) => {
            try {
                const peerConnection = createPeerConnection();
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                newSocket.emit('webrtc-answer', {
                    roomId: appointment.roomId,
                    answer: answer
                });

                console.log('Answer sent');
            } catch (err) {
                console.error('Error handling offer:', err);
                setError('Failed to answer call');
            }
        };

        // Handle incoming answer
        const handleAnswer = async (answer) => {
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Answer processed');
                }
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        };

        // Connection successful
        newSocket.on('connect', () => {
            console.log('Socket connected for video call:', newSocket.id);
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
        newSocket.on('joined-room', () => {
            console.log('Joined video call room');
        });

        // Room already has users - create offer immediately
        newSocket.on('user-already-in-room', async () => {
            console.log('Other users already in room, creating offer');
            await createOffer();
        });

        // Another user joined - initiate call
        newSocket.on('user-joined', async ({ socketId }) => {
            console.log('Other user joined, creating offer');
            await createOffer();
        });

        // Receive WebRTC offer
        newSocket.on('webrtc-offer', async ({ offer, senderSocketId }) => {
            console.log('Received WebRTC offer');
            await handleOffer(offer);
        });

        // Receive WebRTC answer
        newSocket.on('webrtc-answer', async ({ answer }) => {
            console.log('Received WebRTC answer');
            await handleAnswer(answer);
        });

        // Receive ICE candidate
        newSocket.on('webrtc-ice-candidate', async ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        });

        // User left
        newSocket.on('user-left', () => {
            setCallStatus('Other participant left the call');
            setRemoteStream(null);
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
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [localStream, appointment.roomId, user.id, user.name, user.role]);

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    // Leave call
    const leaveCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socket) {
            socket.emit('leave-room', { roomId: appointment.roomId });
            socket.disconnect();
        }
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
        >
            <div className="w-full h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#739AF0] to-[#5a7bc0] p-4 text-white">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div>
                            <h2 className="text-xl font-bold">Video Call</h2>
                            <p className="text-sm opacity-90">
                                {user.role === 'PATIENT'
                                    ? `Dr. ${appointment.doctor.user.name}`
                                    : appointment.patient.name
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm">{callStatus}</span>
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500 text-white p-4 text-center">
                        <p className="font-semibold">{error}</p>
                    </div>
                )}

                {/* Video Containers */}
                <div className="flex-1 relative bg-gray-900">
                    {/* Remote Video (Main) */}
                    <div className="w-full h-full flex items-center justify-center">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-white text-center">
                                <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-lg font-semibold">Waiting for other participant...</p>
                            </div>
                        )}
                    </div>

                    {/* Local Video (Picture-in-Picture) */}
                    <div className="absolute bottom-24 right-6 w-64 h-48 bg-gray-800 rounded-[20px] overflow-hidden shadow-2xl border-4 border-white">
                        {localStream && !isVideoOff ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm">Camera Off</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                            You
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 p-6">
                    <div className="flex justify-center items-center gap-4 max-w-2xl mx-auto">
                        {/* Mute Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleMute}
                            className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'
                                } text-white hover:bg-opacity-80 transition-colors`}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </motion.button>

                        {/* Video Toggle Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleVideo}
                            className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'
                                } text-white hover:bg-opacity-80 transition-colors`}
                        >
                            {isVideoOff ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </motion.button>

                        {/* Leave Call Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={leaveCall}
                            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </motion.div>
    );
}
