import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useSession } from "../context/SessionContext.jsx";

export default function Landing() {
  const { token } = useSession();

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack" style={{ paddingTop: "var(--space-7)" }}>
          <section className="center stack">
            <p className="muted small" style={{ letterSpacing: "0.08em" }}>FUTURE DESIGN LAB</p>
            <h1>Future Letter 30days</h1>
            <p style={{ fontSize: "1.1rem", color: "var(--color-text-soft)" }}>
              1年後の私から、毎朝届く手紙。
            </p>
            <p className="muted">
              夢や理想の暮らし、仕事、人間関係——あなたが登録した想いをもとに、
              1年後のあなたから30通の手紙を書き上げます。毎朝1通ずつ、30日間。
              未来の感覚を先に味わいながら、少しずつ今日の行動や前提を変えていくためのサービスです。
            </p>
          </section>

          <section className="card envelope-card stack">
            <h2 style={{ fontSize: "1.05rem" }}>Future Letter 30daysでできること</h2>
            <ul style={{ margin: 0, paddingLeft: "1.2em", color: "var(--color-text-soft)" }}>
              <li>あなただけの夢・暮らし・仕事の想いから、30通の手紙を自動作成</li>
              <li>毎朝、設定した時刻に1通ずつメールでお届け</li>
              <li>読んだ手紙には短いメモを残せる、あなただけのマイページ</li>
              <li>いつでも配信の一時停止・再開・やり直しが可能</li>
            </ul>
          </section>

          <section className="stack" style={{ marginTop: "var(--space-4)" }}>
            <Link to="/onboarding" className="btn btn-primary">
              はじめる
            </Link>
            <Link to={token ? "/mypage" : "/login"} className="btn btn-secondary">
              {token ? "続きから" : "登録済みの方はこちら（ログイン）"}
            </Link>
          </section>

          <section className="center small muted" style={{ marginTop: "var(--space-6)" }}>
            <p>
              このサービスは自己成長のための体験ツールです。
              専門的なカウンセリングや医療的な助言の代わりにはなりません。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
