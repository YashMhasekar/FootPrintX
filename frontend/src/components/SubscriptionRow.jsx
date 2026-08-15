const METHOD_LABELS = {
  "one-click": { label: "One-click", color: "text-accent-teal border-accent-teal/40" },
  mailto: { label: "Mailto", color: "text-accent-violet border-accent-violet/40" },
  link: { label: "Manual link", color: "text-accent-amber border-accent-amber/40" },
  none: { label: "Filter only", color: "text-slate-500 border-slate-600" },
};

const STATUS_LABELS = {
  active: null,
  unsubscribe_sent: "Unsubscribed",
  manual_pending: "Awaiting confirmation",
  filtered: "Filtered",
  failed: "Failed",
};

export default function SubscriptionRow({ sub, selected, onToggleSelect, onUnsubscribe, busy }) {
  const method = METHOD_LABELS[sub.unsubscribeMethod] || METHOD_LABELS.none;
  const statusLabel = STATUS_LABELS[sub.status];

  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(sub.senderEmail)}
        className="w-4 h-4 accent-accent-teal shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="text-slate-100 font-medium truncate">{sub.senderName}</p>
        <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
          {sub.senderEmail} · {sub.category} · {sub.emailCount} emails
        </p>
      </div>

      <span
        className={`shrink-0 text-xs font-mono border rounded-full px-2.5 py-1 ${method.color}`}
      >
        {method.label}
      </span>

      {statusLabel ? (
        <span className="shrink-0 text-xs text-slate-400 font-mono">{statusLabel}</span>
      ) : (
        <button
          onClick={() => onUnsubscribe(sub)}
          disabled={busy}
          className="shrink-0 text-sm bg-accent-rose/10 text-accent-rose border border-accent-rose/30 rounded-lg px-3 py-1.5 hover:bg-accent-rose/20 transition disabled:opacity-40"
        >
          {busy ? "Working…" : "Unsubscribe"}
        </button>
      )}
    </div>
  );
}
