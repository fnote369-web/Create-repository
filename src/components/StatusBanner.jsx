export default function StatusBanner({ type = "info", children }) {
  if (!children) return null;
  return <div className={`banner banner-${type}`} role="status">{children}</div>;
}
