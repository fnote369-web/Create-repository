import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { useSession } from "../context/SessionContext.jsx";
import { api } from "../lib/api.js";

export default function LetterView() {
  const { day } = useParams();
  const dayNum = Number(day);
  const { token, session, loading, refresh } = useSession();
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState("");

  const letter = session?.letters.find((l) => l.day === dayNum);
  const readInfo = session?.readState?.[dayNum];

  useEffect(() => {
    setMemo(readInfo?.memo || "");
  }, [dayNum, readInfo?.memo]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return null;
  if (!letter || letter.locked) {
    return (
      <Shell>
        <StatusBanner type="info">この手紙はまだ配信されていません。マイページに戻ってお待ちください。</StatusBanner>
        <Link to="/mypage" className="btn btn-secondary">マイページに戻る</Link>
      </Shell>
    );
  }

  async function handleMarkRead() {
    if (marking) return;
    setMarking(true);
    try {
      await api.markLetterRead(token, dayNum);
      await refresh();
      setMessage("「読みました」を記録しました。");
    } catch (e) {
      setMessage(e.message || "記録に失敗しました。");
    } finally {
      setMarking(false);
    }
  }

  async function handleSaveMemo() {
    if (saving) return;
    setSaving(true);
    try {
      await api.saveMemo(token, dayNum, memo);
      setMessage("メモを保存しました。");
    } catch (e) {
      setMessage(e.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <div className="small muted">{letter.phase}</div>
      <h1>{letter.title}</h1>

      <div className="card envelope-card">
        <p style={{ whiteSpace: "pre-wrap" }}>{letter.body}</p>
      </div>

      <div className="card stack">
        <h3 style={{ fontSize: "1rem" }}>今日の小さな問いかけ</h3>
        <p>{letter.question}</p>
        <h3 style={{ fontSize: "1rem" }}>今日できる小さな一歩</h3>
        <p>{letter.action}</p>
      </div>

      <div className="card stack">
        <label htmlFor="memo"><strong>メモ</strong></label>
        <textarea
          id="memo"
          className="input"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="今日感じたことを自由に書き留めてください。"
        />
        <button className="btn btn-secondary" onClick={handleSaveMemo} disabled={saving}>
          {saving ? "保存しています…" : "メモを保存"}
        </button>
      </div>

      <StatusBanner type="success">{message}</StatusBanner>

      <button className="btn btn-primary" onClick={handleMarkRead} disabled={marking || readInfo?.read}>
        {readInfo?.read ? "読みました ✓" : marking ? "記録しています…" : "読みました"}
      </button>

      <Link to="/mypage" className="btn btn-ghost">マイページに戻る</Link>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">{children}</div>
      </main>
      <Footer />
    </>
  );
}
