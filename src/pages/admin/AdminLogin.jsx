import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import Field from "../../components/Field.jsx";
import StatusBanner from "../../components/StatusBanner.jsx";
import { api } from "../../lib/api.js";
import { useAdmin } from "../../context/AdminContext.jsx";

export default function AdminLogin() {
  const { adminToken, setAdminToken } = useAdmin();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (adminToken) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { adminToken: token } = await api.adminLogin(password);
      setAdminToken(token);
      navigate("/admin", { replace: true });
    } catch (e2) {
      setError(e2.message || "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack" style={{ maxWidth: 420 }}>
          <h1>管理者ログイン</h1>
          <StatusBanner type="error">{error}</StatusBanner>
          <form className="card stack" onSubmit={handleSubmit}>
            <Field label="管理者パスワード">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </Field>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "確認しています…" : "ログイン"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
