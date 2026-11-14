import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { newslettersAPI } from '../api';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/Button';
import RichTextEditor from '../components/RichTextEditor';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsletterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    cover_image: '',
    published: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      newslettersAPI.get(id)
        .then((res) => {
          const n = res.data.newsletter;
          setForm({
            title: n.title,
            summary: n.summary || '',
            content: n.content || '',
            cover_image: n.cover_image || '',
            published: Boolean(n.published),
          });
        })
        .catch(() => setError('Failed to load newsletter'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isEdit, id]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await newslettersAPI.update(id, form);
      } else {
        await newslettersAPI.create(form);
      }
      navigate('/newsletters');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Newsletter' : 'New Newsletter'}</h1>
        <Link to="/newsletters" className="text-sm text-gray-600 hover:underline">← Back to list</Link>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={form.title}
            onChange={handleChange('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Summary (optional)</label>
          <input
            value={form.summary}
            onChange={handleChange('summary')}
            placeholder="A short summary shown in archives and emails"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL (optional)</label>
          <input
            value={form.cover_image}
            onChange={handleChange('cover_image')}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <RichTextEditor value={form.content} onChange={handleChange('content')} />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
            className="rounded border-brand-600 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700">
            Publish immediately
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="submit" disabled={saving} className="flex-1 py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-60 font-medium">
            {isEdit ? 'Update' : 'Create'}
          </button>
          <SecondaryButton onClick={() => navigate('/newsletters')}>Cancel</SecondaryButton>
          {isEdit && (
            <DangerButton
              onClick={() => {
                if (window.confirm('Delete this newsletter?')) {
                  newslettersAPI.remove(id).then(() => navigate('/newsletters'));
                }
              }}
            >
              Delete
            </DangerButton>
          )}
        </div>
      </form>
    </div>
  );
}
