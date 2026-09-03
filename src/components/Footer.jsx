import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>Future Design Lab ｜ Future Letter 30days</p>
        <p>
          <Link to="/privacy">プライバシーポリシー</Link>
          <Link to="/terms">利用規約</Link>
        </p>
      </div>
    </footer>
  );
}
