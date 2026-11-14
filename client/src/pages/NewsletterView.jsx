import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newslettersAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsletterView() {
  const { slug } = useParams();
  const [newsletter, setNewsletter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    newslettersAPI.get(slug)
      .then((res) => setNewsletter(res.data.newsletter))
      .catch((err) => {
        setError(err.response?.data?.error || 'Newsletter not found');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error || !newsletter) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">{error || 'Not found'}</h1>
        <p className="mt-3 text-gray-600">This newsletter could not be found or is not published.</p>
        <a href="/" className="mt-5 inline-block text-brand-600 hover:underline">Go home</a>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wider uppercase ${
            newsletter.published ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'
          } border rounded">
            {newsletter.published ? 'Published' : 'Draft'}
          </span>
          <time className="block text-sm text-gray-500 mt-1">
            {new Date(newsletter.created_at).toLocaleDateString()}
          </time>
        </div>
        <Link to="/newsletters" className="text-sm text-gray-600 hover:underline">← Back to archive</Link>
      </div>

      <h1 className="text-4xl font-bold mb-6 tracking-tight">{newsletter.title}</h1>
      {newsletter.summary && (
        <p className="text-lg text-gray-600 mb-8 italic">{newsletter.summary}</p>
      )}
      {newsletter.cover_image && (
        <img
          src={newsletter.cover_image}
          alt=""
          className="w-full h-64 object-cover rounded-xl mb-8 shadow"
        />
      )}
      <div className="prose prose-lg max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: newsletter.content }} />
      <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
        By {newsletter.author_name} • Newsletter Platform
      </div>
    </article>
  );
}
