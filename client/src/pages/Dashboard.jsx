import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.get()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your newsletter activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Newsletters" value={formatNumber(stats.totalNewsletters)} sub={stats.publishedNewsletters + ' published'} color="brand" />
        <StatCard title="Subscribers" value={formatNumber(stats.totalSubscribers)} sub={stats.activeSubscribers + ' active'} color="green" />
        <StatCard title="Unsubscribed" value={formatNumber(stats.unsubscribed)} color="gray" />
        <StatCard title="Campaigns" value={formatNumber(stats.totalCampaigns)} sub={stats.sentCampaigns + ' sent'} color="indigo" />
        <StatCard title="Emails Sent" value={formatNumber(stats.totalEmailsSent)} color="emerald" />
        <StatCard title="Drafts" value={formatNumber(stats.draftNewsletters)} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickCard title="Create Newsletter" desc="Write and publish a new newsletter.">
          <a href="/newsletters/new" className="mt-3 inline-block text-brand-600 font-medium hover:underline">Create now →</a>
        </QuickCard>
        <QuickCard title="Manage Subscribers" desc="Add, import, or remove subscribers.">
          <a href="/subscribers" className="mt-3 inline-block text-brand-600 font-medium hover:underline">Manage →</a>
        </QuickCard>
        <QuickCard title="Send a Campaign" desc="Send a published newsletter to all active subscribers.">
          <a href="/campaigns" className="mt-3 inline-block text-brand-600 font-medium hover:underline">Send →</a>
        </QuickCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color }) {
  const colorMap = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    gray: 'bg-gray-50 border-gray-100 text-gray-700',
  };
  return (
    <div className={`p-4 rounded-lg border ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-80">{sub}</p>}
    </div>
  );
}

function QuickCard({ title, desc, children }) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
      {children}
    </div>
  );
}
