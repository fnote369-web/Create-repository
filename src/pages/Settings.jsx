import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Field from "../components/Field.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { useSession } from "../context/SessionContext.jsx";
import { api } from "../lib/api.js";
import { isValidEmail, MESSAGES } from "../lib/validators.js";

export default function Settings() {
  const { token, session, refresh, logout } = useSession();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!token) return <Navigate to="/login" replace />;
  if (!session) return null;
  const { user } = session;

  async function toggleStatus() {
    setBusy(true);
    setError("");
    try {
      const next = user.status === "paused" ? "active" : "paused";
      await api.setDeliveryStatus(token, next);
      await refresh();
      setMessage(next === "paused" ? "配信を一時停止しました。" : "配信を再開しました。");
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    if (!isValidEmail(newEmail)) {
      setError(MESSAGES.email);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.changeEmail(token, newEmail.trim());
      await refresh();
      setNewEmail("");
      setMessage("メールアドレスを変更しました。");
    } catch (e2) {
      setError(e2.message || "変更に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.resetAccount(token);
      await refresh();
      setMessage("最初からやり直しました。本日を1日目として手紙が届きます。");
      setConfirmReset(false);
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.deleteAccount(token);
      logout();
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message || "削除に失敗しました。");
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>設定</h1>
          <StatusBanner type="error">{error}</StatusBanner>
          <StatusBanner type="success">{message}</StatusBanner>

          <section className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>配信状況</h2>
            <p className="muted small">現在のメールアドレス：{user.email}</p>
            <button className="btn btn-secondary" onClick={toggleStatus} disabled={busy}>
              {user.status === "paused" ? "配信を再開する" : "配信を一時停止する"}
            </button>
          </section>

          <section className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>メールアドレスの変更</h2>
            <form className="stack" onSubmit={handleChangeEmail}>
              <Field label="新しいメールアドレス">
                <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@mail.com" />
              </Field>
              <button className="btn btn-secondary" type="submit" disabled={busy}>変更する</button>
            </form>
          </section>

          <section className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>最初からやり直す</h2>
            <p className="small muted">今日を1日目として、Day1から手紙が再配信されます。これまでの既読・メモは削除されます。</p>
            <button className="btn btn-secondary" onClick={handleReset} disabled={busy}>
              {confirmReset ? "本当にやり直す（もう一度押すと実行）" : "最初からやり直す"}
            </button>
          </section>

          <section className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>登録情報の削除</h2>
            <p className="small muted">登録した個人情報・手紙・メモをすべて削除し、配信を停止します。元に戻せません。</p>
            <button className="btn btn-danger" onClick={handleDelete} disabled={busy}>
              {confirmDelete ? "本当に削除する（もう一度押すと実行）" : "登録情報を削除する"}
            </button>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
