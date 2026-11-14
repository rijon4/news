import { useState } from 'react';
import { subscribersAPI } from '../api';

export default function Unsubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');
    try {
      await subscribersAPI.unsubscribe(email);
      setStatus('success');
      setMessage('You have been unsubscribed successfully.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Unsubscribe failed');
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Unsubscribe</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="w-full py-2 text-white bg-red-600 rounded-md hover:bg-red-700 font-medium">
            Unsubscribe
          </button>
        </form>
        {status === 'success' && (
          <div className="mt-4 p-3 rounded bg-green-50 text-green-700 text-sm border border-green-100">{message}</div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-100">{message}</div>
        )}
      </div>
    </div>
  );
}
