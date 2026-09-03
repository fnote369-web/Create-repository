export default function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <p className="error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
