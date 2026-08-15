function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function decayColor(score) {
  if (score >= 0.7) return "text-accent-rose border-accent-rose/40";
  if (score >= 0.4) return "text-accent-amber border-accent-amber/40";
  return "text-accent-teal border-accent-teal/40";
}

export default function FileCard({ file }) {
  const scorePct = Math.round((file.decayScore ?? 0) * 100);

  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-slate-100 font-medium truncate">{file.name}</p>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          {file.category} · {formatBytes(file.sizeBytes)}
          {file.isJunk && (
            <span className="ml-2 text-accent-rose">flagged junk</span>
          )}
        </p>
      </div>
      <div
        className={`shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono text-sm ${decayColor(
          file.decayScore ?? 0
        )}`}
        title="Decay score"
      >
        {scorePct}%
      </div>
    </div>
  );
}
