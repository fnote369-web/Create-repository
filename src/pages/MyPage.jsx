import { Link, Navigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { useSession } from "../context/SessionContext.jsx";
import { addDays, formatJapaneseDate } from "../lib/date.js";

export default function MyPage() {
  const { token, session, loading, error } = useSession();

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <CenteredMessage>読み込んでいます…</CenteredMessage>;
  if (error || !session) return <CenteredMessage>セッションを読み込めませんでした。もう一度ログインしてください。</CenteredMessage>;

  const { user, letters, readState } = session;
  const readCount = Object.values(readState || {}).filter((r) => r.read).length;
  const todayLetter = letters.find((l) => l.day === user.currentDay);
  const nextDate = user.isComplete ? null : addDays(user.deliveryStartDate, user.currentDay);

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>おかえりなさい、{user.name}さん</h1>

          {user.status === "paused" && <StatusBanner type="info">現在、配信は一時停止中です。設定から再開できます。</StatusBanner>}
          {user.testMode && <StatusBanner type="info">テストモードが適用中です（管理者による確認用の表示です）。</StatusBanner>}

          <div className="card stack">
            <ProgressBar value={Math.min(user.currentDay, 30)} max={30} label="30日間の進捗" />
            <div className="row-between">
              <span className="muted small">現在のDay</span>
              <strong>{user.isComplete ? "Day30（完了）" : `Day${Math.max(user.currentDay, 0)}`}</strong>
            </div>
            <div className="row-between">
              <span className="muted small">読了数</span>
              <strong>{readCount} / 30</strong>
            </div>
            <div className="row-between">
              <span className="muted small">次回配信予定</span>
              <strong>{nextDate ? `${formatJapaneseDate(nextDate)} ${user.deliveryTime}` : "配信完了"}</strong>
            </div>
          </div>

          {todayLetter && !todayLetter.locked ? (
            <Link to={`/letter/${todayLetter.day}`} className="card envelope-card">
              <p className="small muted">今日の手紙</p>
              <h2 style={{ marginBottom: 0 }}>{todayLetter.title}</h2>
            </Link>
          ) : (
            <div className="card center muted">
              {user.currentDay < 1 ? "配信開始日になると、最初の手紙が届きます。" : "本日分の手紙はまだありません。明日の朝をお楽しみに。"}
            </div>
          )}

          <section className="stack">
            <h2 style={{ fontSize: "1.1rem" }}>Day1〜Day30</h2>
            <div className="stack" style={{ gap: "var(--space-2)" }}>
              {letters.map((l) => {
                const rs = readState[l.day];
                const locked = l.locked;
                return (
                  <LetterRow key={l.day} letter={l} locked={locked} read={rs?.read} />
                );
              })}
            </div>
          </section>

          <Link to="/settings" className="btn btn-secondary">設定を変更する</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function LetterRow({ letter, locked, read }) {
  const content = (
    <div className="row-between card" style={{ padding: "var(--space-3) var(--space-4)" }}>
      <div>
        <div className="small muted">Day{letter.day} ｜ {letter.phase}</div>
        {!locked && <div>{letter.title.replace(/^Day\d+｜/, "")}</div>}
      </div>
      {locked ? (
        <span className="badge badge-locked">配信前</span>
      ) : (
        <span className={`badge ${read ? "badge-read" : "badge-unread"}`}>{read ? "読了" : "未読"}</span>
      )}
    </div>
  );
  if (locked) return <div aria-disabled="true" style={{ opacity: 0.6 }}>{content}</div>;
  return <Link to={`/letter/${letter.day}`} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
}

function CenteredMessage({ children }) {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container center" style={{ paddingTop: "var(--space-7)" }}>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
