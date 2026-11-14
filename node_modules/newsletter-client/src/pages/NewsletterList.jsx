import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newslettersAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsletterList({ params }) {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    newslettersAPI.list({ published: filter === 'published' ? 'true' : filter === 'draft' ? 'false' : undefined })
      .then((res) => setNewsletters(res.data.newsletters || []))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Newsletters</h1>
          <p className="text-gray-600">Create, edit, and publish your newsletters.</p>
        </div>
        <Link to="/newsletters/new" className="px-4 py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700 font-medium">
          + New Newsletter
        </Link>
      </div>

      <div className="flex gap-2">
        {['all', 'published', 'draft'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded-md border text-sm font-medium transition ${
              filter === f
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Author</th>
              <th className="px-6 py-3 text-right">Updated</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newsletters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No newsletters found.
                </td>
              </tr>
            ) : (
              newsletters.map((n) => (
                <tr key={n.id}>
                  <td className="px-6 py-4">
                    <Link to={`/newsletters/${n.slug}`} className="font-medium text-brand-600 hover:underline">
                      {n.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">{n.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      n.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {n.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{n.author_name}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{new Date(n.updated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/newsletters/${n.id}/edit`} className="text-sm text-brand-600 hover:underline mr-3">Edit</Link>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this newsletter?')) {
                          newslettersAPI.remove(n.id).then(() => {
                            setNewsletters(newsletters.filter((x) => x.id !== n.id));
                          });
                        }
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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
