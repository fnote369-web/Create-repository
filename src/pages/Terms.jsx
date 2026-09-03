import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Terms() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <h1>利用規約</h1>
          <p className="muted small">最終更新日：{new Date().toISOString().slice(0, 10)}</p>

          <section className="stack">
            <h2>第1条（本サービス）</h2>
            <p>
              Future Letter 30days（以下「本サービス」）は、利用者が登録した情報をもとに、
              1年後の自分からの手紙を模した文章を30日間にわたりメールで配信するサービスです。
            </p>

            <h2>第2条（登録）</h2>
            <p>
              利用者は、真実かつ正確な情報を登録するものとします。
              プライバシーポリシーおよび本規約に同意のうえ、登録を行ってください。
            </p>

            <h2>第3条（禁止事項）</h2>
            <p>
              他人になりすましての登録、本サービスの運営を妨げる行為、
              法令または公序良俗に反する行為を禁止します。
            </p>

            <h2>第4条（免責事項）</h2>
            <p>
              本サービスは自己成長・自己内省を目的とした体験ツールであり、
              専門的なカウンセリング、医療行為、投資助言等の代わりとなるものではありません。
              本サービスの利用により生じた損害について、運営者は法令上許容される範囲で責任を負いません。
            </p>

            <h2>第5条（配信停止）</h2>
            <p>
              利用者は、マイページからいつでも配信の一時停止・再開・登録情報の削除を行うことができます。
            </p>

            <h2>第6条（規約の変更）</h2>
            <p>運営者は、必要と判断した場合、本規約を変更できるものとします。</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
