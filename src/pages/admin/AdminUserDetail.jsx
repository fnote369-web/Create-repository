import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import StatusBanner from "../../components/StatusBanner.jsx";
import { api } from "../../lib/api.js";
import { useAdmin } from "../../context/AdminContext.jsx";

export default function AdminUserDetail() {
  const { adminToken } = useAdmin();
  const { userId } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const d = await api.adminGetUser(adminToken, userId);
      setDetail(d);
    } catch (e) {
      setError(e.message || "読み込みに失敗しました。");
    }
  }

  useEffect(() => {
    if (adminToken) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, userId]);

  if (!adminToken) return <Navigate to="/admin/login" replace />;
  if (!detail) return null;

  async function toggleStatus() {
    setBusy(true);
    try {
      const next = detail.status === "paused" ? "active" : "paused";
      await api.adminSetUserStatus(adminToken, userId, next);
      await load();
      setMessage("配信状態を更新しました。");
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError("");
    try {
      const result = await api.adminSendTestMail(adminToken, userId, selectedDay);
      setPreview(result.preview);
      setMessage(result.note || "テストメールを送信しました。");
    } catch (e) {
      setError(e.message || "送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function sendManual() {
    setBusy(true);
    setError("");
    try {
      const result = await api.adminSendManualDay(adminToken, userId, selectedDay);
      setMessage(result.ok ? `Day${selectedDay}を手動送信しました。` : result.message);
      await load();
    } catch (e) {
      setError(e.message || "送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>{detail.name}さんの詳細</h1>
          <StatusBanner type="error">{error}</StatusBanner>
          <StatusBanner type="success">{message}</StatusBanner>

          <div className="card stack">
            <Row label="メールアドレス" value={detail.emailRaw} />
            <Row label="登録日" value={detail.createdAt} />
            <Row label="配信開始日" value={detail.deliveryStartDate} />
            <Row label="現在のDay" value={`Day${detail.currentDay}`} />
            <Row label="配信状態" value={detail.status} />
            <button className="btn btn-secondary" onClick={toggleStatus} disabled={busy}>
              {detail.status === "paused" ? "配信を再開する" : "配信を一時停止する"}
            </button>
          </div>

          <div className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>テスト送信 / 手動送信</h2>
            <select className="input" value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>Day{d}</option>
              ))}
            </select>
            <div className="row">
              <button className="btn btn-secondary" onClick={sendTest} disabled={busy}>テストメールをプレビュー</button>
              <button className="btn btn-gold" onClick={sendManual} disabled={busy}>この日を手動送信</button>
            </div>
            {preview && (
              <div className="card" style={{ background: "var(--color-bg-soft)" }}>
                <p className="small muted">件名</p>
                <p><strong>{preview.subject}</strong></p>
                <p className="small muted">本文冒頭</p>
                <p>{preview.excerpt}</p>
              </div>
            )}
          </div>

          <div className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>送信履歴</h2>
            {detail.sendLog.length === 0 && <p className="muted small">まだ送信履歴はありません。</p>}
            {detail.sendLog.map((l, i) => (
              <div key={i} className="row-between small">
                <span>Day{l.day}</span>
                <span className="muted">{l.sentAt}</span>
                <span>{l.status === "sent" ? "送信済み" : "エラー"}</span>
              </div>
            ))}
          </div>

          {detail.errorLog.length > 0 && (
            <div className="card stack">
              <h2 style={{ fontSize: "1.05rem" }}>エラー履歴</h2>
              {detail.errorLog.map((l, i) => (
                <div key={i} className="small">
                  <span className="muted">{l.at}</span> — {l.message}
                </div>
              ))}
            </div>
          )}

          <div className="card stack">
            <h2 style={{ fontSize: "1.05rem" }}>30通の手紙（管理者確認用）</h2>
            <details>
              <summary>すべて表示</summary>
              <div className="stack" style={{ marginTop: "var(--space-3)" }}>
                {detail.letters.map((l) => (
                  <div key={l.day}>
                    <strong>{l.title}</strong>
                    <p className="small" style={{ whiteSpace: "pre-wrap" }}>{l.body}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="row-between">
      <span className="muted small">{label}</span>
      <span>{value}</span>
    </div>
  );
}
