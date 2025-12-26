'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function GeminiTestPage() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();

            if (res.ok) {
                setResponse(data.response);
            } else {
                setError(data.message || 'Failed to get response');
            }
        } catch (err) {
            setError('Error connecting to API');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] py-8 px-4 pt-24">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="bg-white rounded-[24px] card-shadow p-8"
                >
                    <h1 className="text-4xl font-bold text-[#0F2D52] mb-2">Gemini AI Test</h1>
                    <p className="text-[#4a5568] mb-8">Test the Gemini AI integration</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-[#0F2D52] mb-2">
                                Enter your prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., What are the symptoms of flu?"
                                className="w-full p-4 border-2 border-[#F0F7FF] rounded-[20px] focus:ring-2 focus:ring-[#739AF0] focus:border-[#739AF0] text-[#0F2D52] transition-all duration-300 min-h-[120px]"
                                required
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full bg-[#739AF0] text-white py-4 rounded-[20px] hover:bg-[#5a7dd0] transition-colors duration-300 disabled:bg-[#a0b5f0] disabled:cursor-not-allowed font-semibold shadow-lg"
                        >
                            {loading ? 'Generating...' : 'Generate Response'}
                        </motion.button>
                    </form>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-[20px] text-red-700"
                        >
                            {error}
                        </motion.div>
                    )}

                    {response && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <h2 className="text-xl font-bold text-[#0F2D52] mb-3">Response:</h2>
                            <div className="bg-[#F0F7FF] border-2 border-[#739AF0] rounded-[20px] p-6">
                                <p className="text-[#0F2D52] whitespace-pre-wrap">{response}</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
