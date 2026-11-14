import { useState, useEffect } from 'react';
import { subscribersAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { DangerButton } from '../components/Button';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    subscribersAPI.list()
      .then((res) => setSubscribers(res.data.subscribers || []))
      .finally(() => setLoading(false));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await subscribersAPI.create({ email, name });
      setEmail('');
      setName('');
      load();
      setMessage('Subscriber added.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add subscriber');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await subscribersAPI.update(id, { status: currentStatus === 'active' ? 'unsubscribed' : 'active' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update subscriber');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this subscriber?')) return;
    try {
      await subscribersAPI.remove(id);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to remove subscriber');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImporting(true);
    setMessage('');
    try {
      const emails = bulkEmails
        .split(/[\s,]+/)
        .map((e) => e.trim())
        .filter(Boolean);
      const res = await subscribersAPI.import(emails);
      setBulkEmails('');
      load();
      setMessage(`Imported ${res.data.imported} subscribers. Total active: ${res.data.totalActive}.`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeCount = subscribers.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-gray-600">{activeCount} active of {subscribers.length} total.</p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded bg-blue-50 text-blue-700 text-sm border border-blue-100">{message}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-3">Add single subscriber</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" className="w-full py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700 font-medium">
              Add
            </button>
          </form>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-3">Bulk import</h3>
          <p className="text-xs text-gray-500 mb-3">Paste emails separated by spaces, commas, or newlines.</p>
          <textarea
            value={bulkEmails}
            onChange={(e) => setBulkEmails(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full mt-3 py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-60 font-medium"
          >
            Import
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Subscribed</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4">{s.email}</td>
                  <td className="px-6 py-4 text-gray-700">{s.name || '—'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(s.id, s.status)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                        s.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s.status === 'active' ? 'Active' : 'Unsubscribed'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {new Date(s.subscribed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DangerButton onClick={() => handleRemove(s.id)} size="sm">Remove</DangerButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
