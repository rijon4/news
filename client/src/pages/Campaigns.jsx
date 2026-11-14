import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignsAPI, newslettersAPI } from '../api';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    newsletter_id: '',
    subject: '',
    test_only: false,
    test_email: '',
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      campaignsAPI.list().then((res) => setCampaigns(res.data.campaigns || [])),
      newslettersAPI.list({ published: 'true' }).then((res) => setNewsletters(res.data.newsletters || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSending(true);
    try {
      const payload = {
        newsletter_id: Number(form.newsletter_id),
        subject: form.subject,
        test_only: form.test_only,
        test_email: form.test_email,
      };
      const res = await campaignsAPI.create(payload);
      setMessage(res.data.message || 'Campaign sent.');
      setForm({ newsletter_id: '', subject: '', test_only: false, test_email: '' });
      setCampaigns((prev) => [res.data.campaign, ...prev]);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await campaignsAPI.remove(id);
      setCampaigns(campaigns.filter((c) => c.id !== id));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete campaign');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-gray-600">Send newsletters to your subscribers.</p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded bg-blue-50 text-blue-700 text-sm border border-blue-100">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-4">Send a campaign</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Newsletter</label>
              <select
                required
                value={form.newsletter_id}
                onChange={handleChange('newsletter_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a published newsletter</option>
                {newsletters.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email subject</label>
              <input
                required
                value={form.subject}
                onChange={handleChange('subject')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="test_only"
                type="checkbox"
                checked={form.test_only}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, test_only: e.target.checked }))
                }
                className="rounded border-brand-600 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="test_only" className="text-sm font-medium text-gray-700">
                Test email only
              </label>
            </div>
            {form.test_only && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test email address</label>
                <input
                  type="email"
                  value={form.test_email}
                  onChange={handleChange('test_email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              Emails are sent via the configured transport. In development they are logged to the server console (no real email sent).
            </p>
            <button
              type="submit"
              disabled={sending || !form.newsletter_id || !form.subject}
              className="w-full py-3 text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-60 font-semibold"
            >
              {sending ? 'Sending…' : form.test_only ? 'Send test' : 'Send campaign'}
            </button>
          </form>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-3">Recent campaigns</h3>
          <ul className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500">No campaigns yet.</p>
            ) : (
              campaigns.map((c) => (
                <li key={c.id} className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{c.subject}</div>
                    <div className="text-xs text-gray-500">{c.newsletter_title}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${
                      c.status === 'sent' ? 'text-green-600' : c.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                    }`}>{c.status}</div>
                    <div className="text-xs text-gray-500">{c.sent_count}/{c.recipient_count}</div>
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
