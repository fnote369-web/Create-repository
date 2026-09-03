import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import StatusBanner from "../../components/StatusBanner.jsx";
import { api } from "../../lib/api.js";
import { useAdmin } from "../../context/AdminContext.jsx";

export default function AdminTestMode() {
  const { adminToken } = useAdmin();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [detail, setDetail] = useState(null);
  const [day, setDay] = useState(1);
  const [preview, setPreview] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminToken) return;
    api.adminListUsers(adminToken, {}).then(setUsers).catch((e) => setError(e.message));
  }, [adminToken]);

  useEffect(() => {
    if (!userId) return;
    api.adminGetUser(adminToken, userId).then(setDetail).catch((e) => setError(e.message));
  }, [adminToken, userId]);

  if (!adminToken) return <Navigate to="/admin/login" replace />;

  async function applyDay(overrideDay) {
    setError("");
    try {
      await api.testSetDay(adminToken, userId, overrideDay);
      setDetail(await api.adminGetUser(adminToken, userId));
      setMessage(overrideDay === null ? "テストモードの日付指定を解除しました（実際の配信日に戻ります）。" : `Day${overrideDay}を表示するよう設定しました。`);
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    }
  }

  async function advanceDay() {
    setError("");
    try {
      const { user } = await api.testAdvanceDay(adminToken, userId);
      setDetail(await api.adminGetUser(adminToken, userId));
      setMessage(`配信日を1日進めました（現在 Day${user.currentDay}）。`);
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    }
  }

  async function resetUser() {
    setError("");
    try {
      await api.adminResetUser(adminToken, userId);
      setDetail(await api.adminGetUser(adminToken, userId));
      setMessage("利用者登録をリセットしました（本日をDay1として再開）。");
    } catch (e) {
      setError(e.message || "処理に失敗しました。");
    }
  }

  async function previewMail() {
    setError("");
    try {
      const result = await api.adminSendTestMail(adminToken, userId, day);
      setPreview(result.preview);
    } catch (e) {
      setError(e.message || "プレビューに失敗しました。");
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>テストモード</h1>
          <p className="muted small">本番公開前の動作確認用です。本番データとは分離されず、選んだ利用者データに対して直接テスト操作を行います。テスト用の利用者を登録してからお使いください。</p>

          <StatusBanner type="error">{error}</StatusBanner>
          <StatusBanner type="success">{message}</StatusBanner>

          <div className="card stack">
            <label>対象の利用者</label>
            <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">選択してください</option>
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>{u.name}（{u.email}）</option>
              ))}
            </select>
          </div>

          {detail && (
            <>
              <div className="card stack">
                <h2 style={{ fontSize: "1.05rem" }}>Dayを指定して表示</h2>
                <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Day{d}</option>
                  ))}
                </select>
                <div className="row">
                  <button className="btn btn-secondary" onClick={() => applyDay(day)}>このDayを表示状態にする</button>
                  <button className="btn btn-ghost btn-auto" onClick={() => applyDay(null)}>解除（通常の配信日に戻す）</button>
                </div>
                <div className="row">
                  <button className="btn btn-secondary" onClick={advanceDay}>配信日を1日進める</button>
                  <button className="btn btn-danger btn-auto" onClick={resetUser}>利用者登録をリセット</button>
                </div>
              </div>

              <div className="card stack">
                <h2 style={{ fontSize: "1.05rem" }}>メール本文プレビュー</h2>
                <button className="btn btn-secondary" onClick={previewMail}>Day{day}のメールをプレビュー</button>
                <label className="row small">
                  <input type="checkbox" checked={mobilePreview} onChange={(e) => setMobilePreview(e.target.checked)} />
                  スマートフォン幅で表示
                </label>
                {preview && (
                  <div style={{ maxWidth: mobilePreview ? 360 : "100%", margin: mobilePreview ? "0 auto" : 0 }}>
                    <div className="card" style={{ background: "var(--color-bg-soft)" }}>
                      <p className="small muted">件名</p>
                      <p><strong>{preview.subject}</strong></p>
                      <p className="small muted">宛名</p>
                      <p>{preview.name} さん</p>
                      <p className="small muted">本文冒頭</p>
                      <p>{preview.excerpt}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
