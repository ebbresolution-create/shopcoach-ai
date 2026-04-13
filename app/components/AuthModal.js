'use client';

import { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuth }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = activeTab === 'signin' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        return;
      }

      onAuth(data.user);
      setEmail('');
      setPassword('');
      setError('');
      onClose();
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-lg shadow-xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl">&times;</button>

        <div className="flex gap-4 mb-6 border-b border-[#1e2a3a]">
          <button onClick={() => { setActiveTab('signin'); setError(''); }}
            className={`pb-3 font-semibold transition-colors ${activeTab === 'signin' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-300'}`}>
            Sign In
          </button>
          <button onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`pb-3 font-semibold transition-colors ${activeTab === 'signup' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-gray-300'}`}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#161b22] border border-[#1e2a3a] rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              placeholder="you@example.com" disabled={loading} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-[#161b22] border border-[#1e2a3a] rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              placeholder="********" disabled={loading} />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 rounded transition-all">
            {loading ? 'Loading...' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          {activeTab === 'signin' ? "Don't have an account? Switch to Sign Up above." : 'Already have an account? Switch to Sign In above.'}
        </p>
      </div>
    </div>
  );
}
