const TEMPLATES = [
  { id: 'history', name: 'Historical Documentary', sections: 5 },
  { id: 'corporate', name: 'Corporate Profile', sections: 4 },
  { id: 'travel', name: 'Travel & Culture', sections: 5 },
  { id: 'science', name: 'Science Explainer', sections: 6 },
];

export function TemplatesPanel() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Templates</h3>
      <p className="text-[10px] text-gray-500 mb-2">Rule-based narration structures</p>
      <ul className="space-y-2">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="w-full text-left p-2 rounded-lg border border-forge-border/30 hover:border-forge-accent/50 hover:bg-forge-accent/5 transition-colors"
            >
              <p className="text-xs font-medium text-gray-200">{t.name}</p>
              <p className="text-[10px] text-gray-600">{t.sections} sections</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
