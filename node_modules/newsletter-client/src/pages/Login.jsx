import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { SecondaryButton, PrimaryButton } from '../components/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Sign in</h2>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-60 font-medium">
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <a href="/register" className="text-brand-600 hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
