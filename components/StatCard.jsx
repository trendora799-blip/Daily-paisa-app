export default function StatCard({ icon, label, value, sub, color='brand' }) {
  const colors = {
    brand:  'from-brand-500 to-indigo-600',
    green:  'from-emerald-500 to-green-600',
    pink:   'from-pink-500 to-rose-600',
    purple: 'from-purple-500 to-violet-600',
    amber:  'from-amber-500 to-orange-600',
  };
  return (
    <div className="card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold grad-text">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
