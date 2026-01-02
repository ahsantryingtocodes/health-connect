'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    StreamVideoClient,
    StreamCall,
    StreamVideo,
    StreamTheme,
    ParticipantView,
    useCallStateHooks,
    useCall
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

/**
 * VideoCallInterface Component
 * Stream.io video calling interface for ongoing appointments
 * 
 * @param {Object} props
 * @param {Object} props.appointment - The appointment object with id
 * @param {Object} props.user - The current user object (patient or doctor)
 * @param {Function} props.onClose - Callback to close and redirect
 */
export default function VideoCallInterface({ appointment, user, onClose }) {
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasLeftRef = useRef(false);

    // Refs to hold instances for cleanup
    const clientRef = useRef(null);
    const callRef = useRef(null);

    useEffect(() => {
        const initializeCall = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch video token from API
                const response = await fetch('/api/video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id.toString(),
                        userName: user.name,
                        appointmentId: appointment.id.toString()
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch video token');
                }

                const { token, apiKey, callId } = await response.json();

                // Initialize Stream Video client
                const videoClient = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.id.toString(),
                        name: user.name
                    },
                    token
                });

                setClient(videoClient);
                clientRef.current = videoClient;

                // Create/join call
                const videoCall = videoClient.call('default', callId);
                await videoCall.join({ create: true });

                setCall(videoCall);
                callRef.current = videoCall;
                setLoading(false);
            } catch (err) {
                console.error('Video call initialization error:', err);
                setError(err.message || 'Failed to initialize video call');
                setLoading(false);
            }
        };

        initializeCall();

        // Cleanup on unmount
        return () => {
            if (!hasLeftRef.current) {
                hasLeftRef.current = true;

                const activeCall = callRef.current;
                const activeClient = clientRef.current;

                if (activeCall) {
                    // Explicitly stop tracks to turn off camera light
                    try {
                        activeCall.camera.disable();
                        activeCall.microphone.disable();
                    } catch (e) {
                        console.warn('Error disabling devices on cleanup:', e);
                    }
                    activeCall.leave().catch(console.error);
                }
                if (activeClient) {
                    activeClient.disconnectUser().catch(console.error);
                }
            }
        };
    }, [appointment.id, user.id, user.name]);

    const handleLeaveCall = async () => {
        if (hasLeftRef.current) {
            onClose();
            return;
        }

        hasLeftRef.current = true;

        try {
            if (call) {
                // Explicitly stop tracks to turn off camera light
                try {
                    await call.camera.disable();
                    await call.microphone.disable();
                } catch (e) {
                    console.warn('Error disabling devices on leave:', e);
                }
                await call.leave();
            }
        } catch (err) {
            console.error('Error leaving call:', err);
        }

        try {
            if (client) {
                await client.disconnectUser();
            }
        } catch (err) {
            console.error('Error disconnecting client:', err);
        }

        // Always close, even if there were errors
        onClose();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
                    <p className="text-xl font-semibold">Connecting to video call...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[24px] p-8 max-w-md w-full text-center"
                >
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-[#0F2D52] mb-4">Connection Error</h2>
                    <p className="text-[#4a5568] mb-6">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="px-6 py-3 bg-[#739AF0] text-white rounded-[20px] font-semibold hover:bg-[#5a7bc0]"
                    >
                        Go Back
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (!client || !call) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black z-50">
            <StreamVideo client={client}>
                <StreamCall call={call}>
                    <StreamTheme>
                        <VideoCallUI
                            user={user}
                            appointment={appointment}
                            onLeave={handleLeaveCall}
                        />
                    </StreamTheme>
                </StreamCall>
            </StreamVideo>
        </div>
    );
}

/**
 * VideoCallUI Component - Renders the actual video interface
 * Separated to use Stream hooks properly
 */
function VideoCallUI({ user, appointment, onLeave }) {
    // Get the call instance directly
    const call = useCall();
    const { useParticipants, useLocalParticipant, useCameraState, useMicrophoneState } = useCallStateHooks();

    const participants = useParticipants();
    const localParticipant = useLocalParticipant();

    // We still use these for STATE (to know if red/gray)
    const { isMute: isCameraMuted } = useCameraState();
    const { isMute: isMicMuted } = useMicrophoneState();

    const [showLeftMessage, setShowLeftMessage] = useState(false);
    const hadRemoteParticipantRef = useRef(false);

    // Get remote participant (the other person in the call)
    // Filter out local user and look for anyone else
    const remoteParticipant = participants.find(p => p.sessionId !== localParticipant?.sessionId);

    // Track if we ever had a remote participant
    useEffect(() => {
        if (remoteParticipant) {
            hadRemoteParticipantRef.current = true;
        }
    }, [remoteParticipant]);

    // Detect when remote participant leaves
    useEffect(() => {
        if (hadRemoteParticipantRef.current && !remoteParticipant) {
            setShowLeftMessage(true);
            const timer = setTimeout(() => {
                onLeave();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [remoteParticipant, onLeave]);

    const toggleCamera = async () => {
        try {
            if (call) {
                // Use the call object directly for reliable control
                if (isCameraMuted) {
                    await call.camera.enable();
                } else {
                    await call.camera.disable();
                }
            }
        } catch (err) {
            console.error('Error toggling camera:', err);
        }
    };

    const toggleMic = async () => {
        try {
            if (call) {
                // Use the call object directly for reliable control
                if (isMicMuted) {
                    await call.microphone.enable();
                } else {
                    await call.microphone.disable();
                }
            }
        } catch (err) {
            console.error('Error toggling mic:', err);
        }
    };

    // Show message when other participant left
    if (showLeftMessage) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center text-white"
                >
                    <div className="text-6xl mb-4">👋</div>
                    <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
                    <p className="text-lg opacity-90 mb-4">
                        {user.role === 'PATIENT'
                            ? 'The doctor has left the call'
                            : 'The patient has left the call'}
                    </p>
                    <p className="text-sm opacity-75">Returning to dashboard...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#739AF0] to-[#5a7bc0] p-4 text-white flex justify-between items-center z-10">
                <div>
                    <h2 className="text-xl font-bold">Video Consultation</h2>
                    <p className="text-sm opacity-90">
                        {user.role === 'PATIENT'
                            ? `Dr. ${appointment.doctor.user.name}`
                            : appointment.patient.name
                        }
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLeave}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-[20px] font-semibold transition-colors"
                >
                    Leave Call
                </motion.button>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative bg-gray-900">
                {/* Remote Participant (Main Video - Large) */}
                {remoteParticipant ? (
                    <div className="w-full h-full">
                        <ParticipantView
                            participant={remoteParticipant}
                            ParticipantViewUI={null}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⏳</div>
                            <p className="text-xl">Waiting for the other participant to join...</p>
                        </div>
                    </div>
                )}

                {/* Local Participant (Small Video - Picture in Picture) */}
                {localParticipant && (
                    <div className="absolute bottom-20 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
                        <ParticipantView
                            participant={localParticipant}
                            ParticipantViewUI={null}
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-900 p-6 flex justify-center items-center gap-4">
                {/* Camera Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleCamera}
                    className={`p-4 rounded-full ${!isCameraMuted ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {!isCameraMuted ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        )}
                    </svg>
                </motion.button>

                {/* Mic Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMic}
                    className={`p-4 rounded-full ${!isMicMuted ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {!isMicMuted ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                    </svg>
                </motion.button>

                {/* Leave Call */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onLeave}
                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
}