import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function StatusBadge({ label, color }) {
  return (
    <span className="status-badge" style={{ color, background: `${color}1A`, borderColor: `${color}33` }}>
      <span className="status-badge__dot" style={{ background: color }} />
      {label}
    </span>
  );
}

export function Loader({ label = 'Loading...' }) {
  return (
    <div className="state-block">
      <Loader2 size={22} className="spin" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-block state-block--error">
      <AlertTriangle size={22} />
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'Nothing here yet.', icon: Icon = Inbox }) {
  return (
    <div className="state-block">
      <Icon size={22} />
      <p>{message}</p>
    </div>
  );
}
