import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useSession } from "../context/SessionContext.jsx";

const SAMPLE_LETTERS = [
  {
    day: 22,
    title: "今日、ちょっと変なことになってる",
    body: `もう夜の11時なんだけど、興奮しすぎて眠れる気がしないから、先にこれだけ書いておく。

覚えてる？ あの頃、あなたが「いつかやってみたい」って、ノートの隅にだけ書いてた企画。正直、今のわたしがやってるのは、あれとはちょっと違う形になってる。途中で全然関係ない人から声をかけられて、気づいたら、思ってもみなかった方向に転がっていった。

今日はその打ち合わせが、思った以上にいい感じで、帰りの電車でひとりニヤニヤしてたのが、ちょっと恥ずかしい。

うまくいくかは、正直まだ分からない。でも「こうなるはずだった」から外れたことに、不安より先に、わくわくしてる自分がいる。

この続き、また明日書くね。`,
  },
  {
    day: 13,
    title: "出張先のホテルで、ふと",
    body: `今、出張先のホテルの部屋。狭いデスクにパソコンを広げて、冷めたコンビニのコーヒーを飲みながらこれを書いてる。

さっきまで打ち合わせで、初めて会う人ばかりの中にいて、移動中の電車で「あの言い方、変じゃなかったかな」って一瞬考えかけて——あ、そういえば、あなたよくこれで、夜眠れなくなってたよね。

今のわたしも、たまに考える。でも「あ、またやってる」って、割とすぐ気づけるようになった。気づいたら、窓の外の知らない街の明かりを、ぼーっと眺める。それだけで、たいてい忘れる。

治った、とかじゃなくて、うまく付き合えるようになった、が近い気がする。

明日は違う街に移動する予定。また何か書くことがあったら送るね。`,
  },
  {
    day: 18,
    title: "京都の小さな宿で",
    body: `今朝、京都の小さな宿の窓を開けたら、思ったより風が冷たくてね。少し驚いて、そのまま何分か、外の音だけ聞いてた。

ここに来たのは、実はほとんど思いつきで。朝市で仲良くなった人に「面白い店があるよ」って教えてもらって、気づいたら次の週末、来ていた。

その店主のおばあさんと、お茶の淹れ方についてだけで小一時間しゃべって、結局、何も買わずに出てきた。それなのに、今日一日、なんだかすごく満たされてる。

前は「お金をかけないと豊かになれない」って思っていた気がするけど、今は、こういう時間の方が、よっぽど贅沢だって分かってきた。`,
    question: "最近、お金をかけずに満たされた時間はありましたか？",
  },
];

export default function Landing() {
  const { token } = useSession();

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack" style={{ paddingTop: "var(--space-6)", gap: "var(--space-8)" }}>
          {/* 1. ファーストビュー */}
          <section className="center stack">
            <p className="muted small" style={{ letterSpacing: "0.08em" }}>FUTURE DESIGN LAB</p>
            <h1 style={{ textWrap: "balance" }}>
              明日の朝6時30分、
              <br />
              1年後のあなたから、
              <br />
              手紙が届きます。
            </h1>
            <p style={{ fontSize: "1.05rem", color: "var(--color-text-soft)" }}>
              え？ と思った人ほど、たぶん向いています。
            </p>
            <p className="muted small">
              15の質問に答えると、「1年後のあなた」が、30日間、毎朝、手紙を書いてくれる。
              <br />
              そんな、ちょっと不思議な習慣です。
            </p>
            <div className="stack" style={{ marginTop: "var(--space-3)" }}>
              <Link to="/onboarding" className="btn btn-primary">はじめる</Link>
              <Link to={token ? "/mypage" : "/login"} className="btn btn-secondary">
                {token ? "続きから" : "登録済みの方はこちら（ログイン）"}
              </Link>
            </div>
            <p className="muted small">今日答えると、明日の朝には最初の手紙が届きます。</p>
          </section>

          {/* 2. Future Letterとは */}
          <section className="stack">
            <h2>Future Letterとは</h2>
            <p>
              15の質問に答えてください。今どんな仕事をしているか。どんな暮らしを望んでいるか。
              行ってみたい場所。叶えたい夢。手放したい不安。今の自分に、どんな言葉をかけてほしいか。
            </p>
            <p>
              その答えをもとに、「1年後のあなた」から、30日間、毎朝6時30分に手紙が届きます。
            </p>
            <p>
              説教くさい自己啓発メールではありません。未来のあなたは、ただ日々を生きていて、
              その暮らしの途中から、今日のあなたに手紙を書いています。
            </p>
          </section>

          {/* 3. 手紙サンプル */}
          <section className="stack">
            <h2>たとえば、こんな手紙が届きます</h2>
            <div className="stack" style={{ gap: "var(--space-5)" }}>
              {SAMPLE_LETTERS.map((letter) => (
                <div key={letter.day} className="card envelope-card stack">
                  <p className="small muted" style={{ margin: 0 }}>Day{letter.day}</p>
                  <h3 style={{ marginBottom: 0 }}>{letter.title}</h3>
                  <p style={{ whiteSpace: "pre-wrap" }}>{letter.body}</p>
                  {letter.question && (
                    <p className="small" style={{ color: "var(--color-green-700)", fontWeight: 600 }}>
                      今日の小さな問いかけ：{letter.question}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="center muted">これが、30日間、続きます。</p>
          </section>

          {/* 4. 30日間、こんなふうに届きます */}
          <section className="stack">
            <h2>30日間、こんなふうに届きます</h2>
            <p>
              最初の数日は、まだ少し、距離を感じるかもしれません。
              知らない誰かから、手紙をもらったような感覚。
            </p>
            <p>
              けれど、1週間ほど経つ頃には、不思議と「この人からの手紙、待ってるな」と
              思っている自分に気づくはずです。
            </p>
            <p>
              中盤にさしかかると、未来のあなたは、今のあなたが抱えている迷いや、
              昔からの思い込みにも、さりげなく触れるようになります。
              教えるというより、「そういえば、あの頃こんなこと考えてたよね」というふうに。
            </p>
            <p>
              後半になる頃には、未来のあなたの暮らしや、物事の選び方が、
              ずいぶん近く、身近なものに感じられているはずです。
            </p>
            <p>
              そして30日目。最後の手紙が届いても、それは「終わり」ではありません。
            </p>
            <p style={{ fontStyle: "italic" }}>
              ずっと未来の誰かから、手紙をもらっていたと思っていたけれど、
              気づけば、その声を、自分の中に少しずつ育てていたのかもしれない。
            </p>
            <p>
              そんな感覚とともに、ここから先は、あなた自身が、その声で
              未来を書いていく番になります。
            </p>
          </section>

          {/* 5. こんな方へ */}
          <section className="stack">
            <h2>こんな方へ</h2>
            <ul style={{ margin: 0, paddingLeft: "1.2em", color: "var(--color-text-soft)" }}>
              <li>毎朝の数分が、少しだけ楽しみになるものが欲しい人</li>
              <li>過去の物語に、少し区切りをつけて、次に進みたい人</li>
              <li>「私はこういう人間だ」という思い込みに、少し疲れている人</li>
              <li>何かを変えたいと思いながら、何から始めればいいか分からない人</li>
              <li>誰かに背中を押されるより、自分の言葉で、自分を励ましたい人</li>
            </ul>
          </section>

          {/* 6. 開発者ストーリー */}
          <section className="stack">
            <p className="muted small center" style={{ letterSpacing: "0.04em" }}>
              ここから少し、内側の話をします。
            </p>
            <h2>なぜ、このサービスを作ったのか</h2>
            <p>
              私はこれまで長く、過去の自分と向き合う学びに関わってきました。
              そこでよく大切にされているのは、
              「今の大人の自分が、過去の小さな自分に、語りかける」という視点です。
            </p>
            <p>
              私たちは、これまでの経験から、自分でも気づかないうちに、
              「私は大切にされない」「頑張らなければ価値がない」「失敗してはいけない」
              そんな物語を、自分の中に作ってしまうことがあります。
            </p>
            <p>
              過去を理解し、その物語のなりたちに気づいていくこと。
              それは、とても大切な作業だと、今も思っています。
            </p>
            <p>
              けれど、あるとき、ふと気づいたのです。物語を書き足せるのは、
              過去からだけじゃないのではないか。
              「1年後の、少し成熟したわたしが、今のわたしに、語りかけてもいいのではないか」
            </p>
            <p>
              未来のわたしは、今のわたしの迷いを知っていて、時には励まし、
              時には安心させ、時には、まだ知らない選択肢を、そっと見せてくれる。
            </p>
            <p>
              過去の物語だけに、これからの人生を決めさせなくてもいい。
              未来からも、新しい物語を受け取っていい。そう思ったのが、Future Letterの始まりです。
            </p>
            <p>
              きっかけは、とても個人的なものでした。自分のためだけに、
              AIに「1年後の自分からの手紙」を毎日書いてもらい、それをただ読んでいたのです。
            </p>
            <p>
              最初は、「未来のわたしなら、こう言うだろうか」という、軽い遊びのような気持ちでした。
              けれど続けているうちに、仕事のアイデアが、次々と浮かぶようになりました。
              それまでなら考えもしなかったことを、気づけば始めていました。
            </p>
            <p>
              未来を、当てたわけではありません。ただ、未来を先に、少しだけ生きてみたことで、
              今日という日に選べるものが、確かに増えていったのです。
            </p>
            <p>その体験を、一人でも多くの方に届けたくて、Future Letterを作りました。</p>
          </section>

          {/* 7. 思想 */}
          <section className="card envelope-card stack">
            <h2 style={{ fontSize: "1.3rem" }}>未来の私が、今の私を育てる</h2>
            <p>
              Future Letterは、未来を予言するサービスではありません。
              願えば叶うと、保証するものでもありません。
            </p>
            <p>わたしたちは、過去から作った物語だけで、これからを決めなくてもいい。</p>
            <p>
              「こんな未来もあるかもしれない」——そんな新しい物語に、30日間触れ続けることで、
              「これ、やってみたい」「こんな生き方もいいかもしれない」「私は本当は、これが欲しかったんだ」
              そんな小さな発想や選択が、自分の中に、少しずつ生まれてくる。
            </p>
            <p>その結果として、現実での小さな行動が、変わっていく。これが、Future Letterで実現したいことです。</p>
          </section>

          {/* 8. なぜ30日か */}
          <section className="stack">
            <h2>なぜ、30日なのか</h2>
            <p>長い時間をかけて作られた物語は、一日で書き変わるものではありません。</p>
            <p>
              けれど、同じ未来の人格から、30回、朝ごとに手紙が届くとき。
              それはいつしか、「メッセージ」ではなく、「知っている誰か」に変わっていきます。
            </p>
            <p>30日は、物語を書き変えるには短い時間です。でも、新しい物語に、"慣れ始める"には、十分な時間です。</p>
          </section>

          {/* 9. 15の質問の意味 */}
          <section className="stack">
            <h2>15の質問に、答えるということ</h2>
            <p>これは、単なるアンケートではありません。未来の自分との、最初の対話です。</p>
            <p>正直に答えるほど、届く手紙は、あなた自身の言葉に近くなっていきます。</p>
            <p>
              ただし、手紙はあなたの答えを、そのまま繰り返すことはしません。
              「行きたい」と答えた場所に、すでに立っている朝から、手紙は始まります。
            </p>
            <p>うまく答えられなくても大丈夫です。「まだ分からない」も、ひとつの正直な答えです。</p>
          </section>

          {/* 10. 約束すること／しないこと */}
          <section className="stack">
            <h2>Future Letterが約束すること／約束しないこと</h2>
            <div className="card stack">
              <h3 style={{ fontSize: "1rem" }}>約束すること</h3>
              <ul style={{ margin: 0, paddingLeft: "1.2em", color: "var(--color-text-soft)" }}>
                <li>あなたの回答をもとに、あなただけの30通の手紙をお届けします</li>
                <li>毎朝、決まった時刻に、1通ずつ届きます</li>
                <li>毎日同じ形式の手紙が届くわけではありません。長い日も、短い日も、ただ天気の話だけの日もあります</li>
                <li>いつでも、配信を止めることができます</li>
              </ul>
            </div>
            <div className="card stack">
              <h3 style={{ fontSize: "1rem" }}>約束しないこと</h3>
              <ul style={{ margin: 0, paddingLeft: "1.2em", color: "var(--color-text-soft)" }}>
                <li>未来を言い当てることは、約束しません</li>
                <li>願えば必ず叶うとは、お伝えしません</li>
                <li>トラウマの治療や、心理療法の代わりにはなりません</li>
              </ul>
            </div>
            <p className="muted small">
              Future Letterは、自己対話と自己理解のための体験です。それ以上でも、それ以下でもありません。
            </p>
          </section>

          {/* 11. CTA */}
          <section className="card envelope-card center stack">
            <p style={{ fontSize: "1.1rem" }}>
              未来のわたしは、
              <br />
              もう手紙を書き始めています。
            </p>
            <p className="muted">読むのは、あなたの番です。</p>
            <Link to="/onboarding" className="btn btn-primary">Future Letterをはじめる</Link>
            <p className="muted small">15の質問に答えるだけ。今日から、30日間が始まります。</p>
          </section>

          {/* 12. FAQ */}
          <section className="stack">
            <h2>よくある質問</h2>
            <div className="stack">
              <FaqItem q="毎日同じような内容が届くのですか？">
                いいえ。仕事の話の日もあれば、天気や朝ごはんの話だけの日もあります。
                それも含めて、生活している誰かからの手紙として楽しんでください。
              </FaqItem>
              <FaqItem q="手紙はAIが書くと聞きました。機械的な文章になりませんか？">
                最初の15の質問への回答をもとに、あなた自身の言葉や状況を反映して書かれます。
                定型文の一斉配信ではなく、一人ひとり異なる30通になります。
              </FaqItem>
              <FaqItem q="これまでのインナーチャイルドワークなどと、何が違うのですか？">
                Future Letterは、それらの学びから着想を得ていますが、同じ技法ではありません。
                治療や心理療法ではなく、自己対話のためのサービスです。
              </FaqItem>
              <FaqItem q="途中でやめることはできますか？">
                いつでも配信を一時停止・停止できます。ペナルティなどは一切ありません。
              </FaqItem>
              <FaqItem q="入力した内容は、どのように扱われますか？">
                手紙の作成とお届け以外の目的では使用しません。詳しくはプライバシーポリシーをご覧ください。
              </FaqItem>
              <FaqItem q="心理カウンセリングの代わりになりますか？">
                いいえ。Future Letterは自己対話・自己理解のための体験であり、治療や医療、
                専門的なカウンセリングの代わりにはなりません。専門的なサポートが必要な場合は、そちらをご利用ください。
              </FaqItem>
              <FaqItem q="1日読み逃してしまったら？">
                手紙はマイページにも残ります。ご自身のペースで、あとから読むこともできます。
              </FaqItem>
            </div>
          </section>

          <section className="center small muted">
            <p>
              このサービスは自己成長のための体験ツールです。
              専門的なカウンセリングや医療的な助言の代わりにはなりません。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FaqItem({ q, children }) {
  return (
    <details className="card">
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary>
      <p className="muted" style={{ marginTop: "var(--space-2)", marginBottom: 0 }}>{children}</p>
    </details>
  );
}
