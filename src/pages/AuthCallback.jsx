import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { api } from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("リンクが正しくありません。");
      return;
    }
    (async () => {
      try {
        const { token: sessionToken } = await api.consumeMagicToken(token);
        await login(sessionToken);
        const next = params.get("next") || "/mypage";
        navigate(next, { replace: true });
      } catch (e) {
        setError(e.message || "ログインに失敗しました。リンクの有効期限が切れている可能性があります。");
      }
    })();
  }, [params, login, navigate]);

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          {error ? <StatusBanner type="error">{error}</StatusBanner> : <p>ログイン処理中です…</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
