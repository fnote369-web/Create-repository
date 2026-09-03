import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import StatusBanner from "../../components/StatusBanner.jsx";
import { api } from "../../lib/api.js";
import { useAdmin } from "../../context/AdminContext.jsx";
import { formatJapaneseDate } from "../../lib/date.js";

export default function AdminDashboard() {
  const { adminToken, setAdminToken } = useAdmin();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(q = "") {
    setLoading(true);
    setError("");
    try {
      const [s, u] = await Promise.all([api.adminStats(adminToken), api.adminListUsers(adminToken, { search: q })]);
      setStats(s);
      setUsers(u);
    } catch (e) {
      setError(e.message || "読み込みに失敗しました。");
      if (e.code === "UNAUTHORIZED") setAdminToken(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminToken) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  if (!adminToken) return <Navigate to="/admin/login" replace />;

  async function handleExport() {
    try {
      const { csv } = await api.adminExportCsv(adminToken);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `future-letter-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "CSV出力に失敗しました。");
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <div className="row-between">
            <h1>管理者ダッシュボード</h1>
            <button className="btn btn-ghost btn-auto btn-sm" onClick={() => { setAdminToken(null); }}>
              ログアウト
            </button>
          </div>

          <StatusBanner type="error">{error}</StatusBanner>

          {stats && (
            <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <Stat label="登録者数" value={stats.total} />
              <Stat label="配信中" value={stats.active} />
              <Stat label="完了者数" value={stats.completed} />
              <Stat label="配信停止" value={stats.paused} />
            </div>
          )}

          <div className="row">
            <input
              className="input"
              placeholder="名前またはメールアドレスで検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(search)}
            />
            <button className="btn btn-secondary btn-auto" onClick={() => load(search)}>検索</button>
          </div>

          <div className="row">
            <button className="btn btn-secondary" onClick={handleExport}>CSV出力</button>
            <Link to="/admin/test" className="btn btn-secondary">テストモード</Link>
          </div>

          {loading ? (
            <p className="muted">読み込んでいます…</p>
          ) : (
            <div className="stack" style={{ gap: "var(--space-2)" }}>
              {users.map((u) => (
                <Link key={u.userId} to={`/admin/users/${u.userId}`} className="card row-between" style={{ textDecoration: "none", color: "inherit" }}>
                  <div>
                    <div><strong>{u.name}</strong> <span className="small muted">{u.email}</span></div>
                    <div className="small muted">登録日 {formatJapaneseDate(u.createdAt.slice(0, 10))} ／ Day{u.currentDay} ／ {statusLabel(u.status)}</div>
                  </div>
                  {u.errorCount > 0 && <span className="badge" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>エラー{u.errorCount}</span>}
                </Link>
              ))}
              {users.length === 0 && <p className="muted center">利用者が見つかりません。</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="small muted">{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function statusLabel(status) {
  if (status === "paused") return "停止中";
  if (status === "active") return "配信中";
  return status;
}
