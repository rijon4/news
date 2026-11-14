export default function RichTextEditor({ value, onChange }) {
  const handleChange = (e) => onChange(e.target.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Content (HTML)</label>
        <textarea
          value={value}
          onChange={handleChange}
          rows={24}
          className="w-full monospace text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="Write your newsletter content in HTML…"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Preview</label>
        <div
          className="p-4 border border-gray-300 rounded-lg bg-white max-h-[600px] overflow-y-auto text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: value || '<em>Preview will appear here.</em>' }}
        />
      </div>
    </div>
  );
}
