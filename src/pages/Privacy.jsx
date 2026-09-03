import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>プライバシーポリシー</h1>
          <p className="muted small">最終更新日：{new Date().toISOString().slice(0, 10)}</p>

          <section className="stack">
            <h2>1. 取得する情報</h2>
            <p>
              Future Letter 30days（以下「本サービス」）は、以下の情報を取得します。
              お名前（呼ばれたい名前）、メールアドレス、タイムゾーン、配信設定、
              オンボーディングでご入力いただく夢・仕事・暮らし等に関する回答、
              手紙の既読状況およびメモ、メール送信履歴。
            </p>

            <h2>2. 利用目的</h2>
            <p>
              取得した情報は、あなた専用の手紙30通の作成、メールでの配信、
              マイページでの進捗表示、サービス改善のための統計分析（個人を特定しない形）
              にのみ利用します。
            </p>

            <h2>3. 第三者提供</h2>
            <p>
              法令に基づく場合を除き、ご本人の同意なく第三者に個人情報を提供することはありません。
              AIモードをご利用の場合、手紙作成のために入力内容の一部を外部のAI APIに送信することがあります。
            </p>

            <h2>4. 保管・管理</h2>
            <p>
              情報はGoogleスプレッドシートおよびGoogle Apps Scriptの安全なプロパティストア上で管理し、
              アクセス権限を最小限に制限します。
            </p>

            <h2>5. 削除・配信停止</h2>
            <p>
              マイページの設定画面から、いつでも配信の一時停止・登録情報の削除を行うことができます。
              削除をご希望の場合は、設定画面の「登録情報を削除する」から手続きしてください。
            </p>

            <h2>6. お問い合わせ</h2>
            <p>本サービスに関するお問い合わせは、運営者までご連絡ください。</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
