import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Field from "../components/Field.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { isValidEmail, MESSAGES } from "../lib/validators.js";
import { api, backendMode } from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    if (!isValidEmail(email)) {
      setError(MESSAGES.email);
      return;
    }
    setSending(true);
    setError("");
    try {
      const result = await api.requestMagicLink(email.trim());
      setSent(true);
      setDemoToken(result?.demoLoginToken || null);
    } catch (e2) {
      setError(e2.message || "処理に失敗しました。");
    } finally {
      setSending(false);
    }
  }

  async function useDemoLink() {
    await login(demoToken);
    navigate("/mypage");
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>ログイン</h1>
          <p className="muted">登録したメールアドレス宛に、ログイン用のリンクをお送りします。</p>

          <StatusBanner type="error">{error}</StatusBanner>

          {!sent ? (
            <form className="card stack" onSubmit={handleSubmit}>
              <Field label="メールアドレス">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
              </Field>
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? "送信しています…" : "ログインリンクを送る"}
              </button>
            </form>
          ) : (
            <div className="card stack">
              <StatusBanner type="success">ログインリンクをお送りしました。メールをご確認ください。</StatusBanner>
              {backendMode === "local" && demoToken && (
                <div className="stack">
                  <p className="small muted">
                    現在ローカルモードで動作しているため、実際のメール送信の代わりにここからログインできます（開発確認用）。
                  </p>
                  <button className="btn btn-secondary" onClick={useDemoLink}>
                    ログインする（ローカルモード）
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
