import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container center" style={{ paddingTop: "var(--space-7)" }}>
          <h1>ページが見つかりません</h1>
          <Link to="/" className="btn btn-primary btn-auto">トップに戻る</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
