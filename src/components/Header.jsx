import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          Future Letter 30days
        </Link>
      </div>
    </header>
  );
}
