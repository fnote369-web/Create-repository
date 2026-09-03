/**
 * Template-mode letter generator — server-side port of src/lib/letters.js.
 * Kept in sync manually; if you edit the wording, update both places.
 *
 * Voice rules for "1年後の少し成熟した私":
 *   - Not a teacher, not a therapist, not a "success story". Someone who
 *     is simply one year further along, living an ordinary life.
 *   - Full emotional range: excited, tired, annoyed, content, bored,
 *     nothing-happened days, laughing-with-someone days. Never uniformly
 *     calm/wise.
 *   - Doesn't moralize or ask a reflective question every day — most
 *     letters have no question/action at all.
 *   - Doesn't report achievements as a success story. Answers are
 *     dissolved into a lived scene, not echoed back literally.
 *   - Varies opening style, length, and how it signs off so consecutive
 *     letters don't read as templated, while still reading as one
 *     continuous person across 30 days.
 *   - Day 30 does not "graduate" the reader with a tidy lesson.
 * This same voice is what buildAiPrompt_() asks the AI to imitate in AI
 * mode, so template and AI letters don't feel like two different products.
 */

var TONE_LABELS_ = {
  gentle: "やさしく寄り添う",
  uplifting: "明るく背中を押す",
  calm: "落ち着いた大人の自分",
  practical: "具体的で現実的",
  poetic: "詩的で感覚的",
  balanced: "バランスよくおまかせ",
};

function withDefaults_(answers) {
  answers = answers || {};
  function d(v, fallback) { return (v && String(v).trim()) || fallback; }
  return {
    name: d(answers.name, "あなた"),
    futureSelf: d(answers.futureSelf, "穏やかで、自分に自信を持てている自分"),
    job: d(answers.job, "心から打ち込める仕事"),
    income: d(answers.income, "安心して暮らせるだけの収入"),
    lifestyle: d(answers.lifestyle, "大切な人たちと、心地よい場所で"),
    places: d(answers.places, "ずっと行ってみたかった場所"),
    dreams: d(answers.dreams, "心の奥でずっと願っていた夢"),
    habits: d(answers.habits, "自分を大切にする小さな習慣"),
    worries: d(answers.worries, "漠然とした不安"),
    wordsToSelf: d(answers.wordsToSelf, "大丈夫、ちゃんと進んでいるよ"),
    tone: answers.tone || "balanced",
  };
}

function dayLetterDefs_() {
  return [
    function (a) { return { title: "はじめまして、って変だけど", body:
`はじめまして、って言うのも変な感じだけど、他に言葉が見つからない。

わたしは、1年後の${a.name}です。今、これを書きながら、ちょっと緊張してる。

多分あなたは、半信半疑でこの手紙を開いてると思う。それで大丈夫。わたしも、最初にこの仕組みのことを聞いたときは、正直「怪しいな」と思った側の人間だから。

これから30日間、思いついた日のことを、思いついたまま書いて送ります。特別な言葉を用意しているわけじゃない。ただ、1年分先に生きてる人間として、たまに顔を出すだけです。`,
      question: "この手紙を読んで、今、どんな気持ちになっていますか？",
      action: "特にありません。今日はただ、この手紙を読んだことだけで十分です。" }; },

    function (a) { return { title: "古いノートに書いてあったこと", body:
`今日、掃除をしてたら、古いノートが出てきた。

開いたら、あなたが今頃感じてるであろう不安と近いことが、殴り書きで残ってた。${a.worries}——多分、まだそれ、抱えてるでしょう。

正直に言うと、今のわたしも、そのノートを読み返して少し懐かしくなっただけで、「もう克服した」とかそういうことは言えない。ただ、あの頃ほど、その不安に振り回される時間は短くなった気がする。

ノートは、結局捨てずにしまっておいた。

また書くね。` }; },

    function () { return { title: "今日は、ただの朝の話", body:
`今日は、ただの朝の話をする。

いつもより少し早く目が覚めて、カーテンを開けたら、光がまっすぐ差し込んでた。

お湯を沸かしてる間、何も考えずにぼーっとしてた。多分3分くらい。

それだけ。特に意味はないけど、こういう朝が地味に好きだったりする。` }; },

    function (a) { return { title: "最近、あなたのことをよく考える", body:
`最近、あなたのことをよく考える。

${a.name}、今日は忙しかった？ それとも、暇すぎて逆に落ち着かなかった？ どっちにしても、今日一日、ちゃんとここまで来られたなら、それでいい。

誰かに「頑張ってるね」って言われることは少ないかもしれないけど、わたしは知ってる。あなたが今日もここまで来たこと。`,
      question: "今日、自分に一言かけるとしたら、何て言いますか？",
      action: "その言葉を、声に出すか、心の中でつぶやいてみてください。" }; },

    function () { return { title: "気づいたら、もう1週間", body:
`気づいたら、もう1週間、こうして手紙を書いてる。

正直、最初の1通目を書いたときは、続けられるか自信なかった。でも今、なんとなくこの時間が、悪くないなと思い始めてる自分がいる。

あなたの方はどう？ まだ、ちょっと他人行儀な感じで読んでる？ それとも、少しは慣れてきた？

まあ、どっちでもいい。これからも、思いついた日に、思いついたことを送るので。

また明日。` }; },

    function (a) { return { title: "今日は、仕事の話", body:
`今日は、仕事の話。

${a.job}に関わるようになって、正直、大変なことも多い。今日も、思ったより時間がかかって、気づいたら夕方だった。

それでも、帰り道、悪くない疲れ方をしてるなと思った。やらされてる感じじゃなくて、ちゃんと自分で選んでやってる疲れ、というか。

うまく言えないけど、そんな感じ。` }; },

    function (a) { return { title: "残高を見て、少し笑った", body:
`銀行のアプリを開いて、残高を見て、少し笑った。

${a.income}——別に、あの頃思い描いてた通りぴったりというわけじゃない。多いときもあれば、心もとない月もある。

それでも、数字そのものより、「まあ、なんとかなるか」って思えるようになったことの方が、大きい気がする。`,
      question: "お金に関して、今いちばん安心したいことは何ですか？" }; },

    function () { return { title: "特に何もなかった一日", body:
`今日は、ほんとに何もなかった。

洗濯物を干して、ちょっと乾ききらないうちに取り込んで、夕方また外に干し直した。それくらい。

昼にコンビニで新しいおにぎりを試してみたけど、思ったほどでもなかった。夜は特に予定もなくて、テレビをつけっぱなしにして、気づいたらソファでうたた寝してた。

こんな日のこと、正直、書くことがあんまりない。でも、何も書くことがない一日って、それはそれで悪くないなと思ってる。

また、何かあったら書くね。` }; },

    function (a) { return { title: "部屋の話", body:
`今日は、部屋の話をする。

${a.lifestyle}という毎日を送ってる、と言うと大げさに聞こえるけど、実際はただ、洗い物を片付けて、窓を少し開けて、それだけ。

特別な場所じゃなくていいんだなって、最近よく思う。` }; },

    function (a) { return { title: "また同じ場所を検索してた", body:
`地図アプリで、また同じ場所を検索してた。${a.places}。

まだ行けてない。予定も立ててない。ただ、気が向くと開いて、写真だけ眺めてる。

いつか、じゃなくて、来月とか、そのくらいの近さで考えてもいいのかもな、って今日は思った。

それだけ。` }; },

    function (a) { return { title: "今日は、ちょっと重たい話", body:
`今日は、ちょっと重たい話をする。

${a.worries}。この不安、今のあなたにとって、まだかなり大きいと思う。わたしも、消えてなくなったとは言えない。

ただ、それを「悪いもの」として追い出そうとするのをやめてから、少し楽になった気がする。ただそこにいさせてあげる、みたいな感じ。`,
      question: "その不安は、あなたの何を守ろうとしていると思いますか？" }; },

    function () { return { title: "鏡を見ながら、変な独り言", body:
`さっき、鏡を見ながら、変な独り言を言ってた。

「なんでそう思い込んでるんだっけ」って。特に理由もなく、ずっとそう信じてきただけのことって、意外と多い。

答えは出なかった。とりあえず歯を磨いて、寝る。` }; },

    function (a) { return { title: "出張先のホテルで、ふと", body:
`今、出張先のホテルの部屋。狭いデスクにパソコンを広げて、冷めたコンビニのコーヒーを飲みながらこれを書いてる。

さっきまで打ち合わせで、初めて会う人ばかりの中にいて、移動中の電車で「あの言い方、変じゃなかったかな」って一瞬考えかけて——あ、そういえば、あなたよくこれで、夜眠れなくなってたよね。

今のわたしも、たまに考える。でも「あ、またやってる」って、割とすぐ気づけるようになった。気づいたら、窓の外の知らない街の明かりを、ぼーっと眺める。それだけで、たいてい忘れる。

治った、とかじゃなくて、うまく付き合えるようになった、が近い気がする。

明日は違う街に移動する予定。また何か書くことがあったら送るね。` }; },

    function () { return { title: "締め切りに間に合わなかった", body:
`今日、締め切りに間に合わなかった。

前だったら、たぶん自分をかなり責めてたと思う。今日も、正直へこんだ。でも、思ったより早く「まあ、明日謝ろう」に切り替えられた。

完璧じゃなくていい、って言葉、簡単に言えるけど、実際はこうやって、小さくやらかしながら覚えていくんだと思う。` }; },

    function () { return { title: "折り返しって言葉", body:
`折り返しって言葉、今書いてて気づいた。今日で、ちょうど半分。

正直、毎日書いてるわけじゃなくて、書きたいことがある日だけ書いてる。それでも気づけば、もう半分あなたに話しかけたことになる。

残り半分も、気が向いたときに、また。` }; },

    function () { return { title: "今日はちょっと、うまくいかなかった", body:
`今日は、朝から予定が全部後ろにずれて、最後は駅で電車を一本逃した。

しかも、逃した電車の中に忘れ物したことに、あとで気づいた。取りに戻るには時間が足りなくて、結局そのまま出かけた。

前だったら、たぶん一日中、ちょっと引きずってたと思う。今日も、正直ちょっとイラッとはした。でも「まあ、そういう日もあるか」で、思ったより早く、他のことを考え始めてる自分がいた。

別に何かを克服したとか、そういう話じゃない。ただ、前より少しだけ、自分に対して雑じゃなくなった気がする。

それだけ。` }; },

    function (a) { return { title: "給料明細を見ながら", body:
`給料明細を見ながら、これを書いてる。

正直、まだ「稼いだ金額」と「自分の価値」を、つい結びつけて考えそうになる日がある。今日もちょっとそうだった。

でも、そこで一回立ち止まれるようにはなった。数字は数字、わたしはわたし、って。`,
      question: "今日、お金に関係のないところで、自分の良いところをひとつ見つけるとしたら？" }; },

    function (a) { return { title: "京都の小さな宿で", body:
`今朝、${a.places}の小さな宿の窓を開けたら、思ったより風が冷たくてね。少し驚いて、そのまま何分か、外の音だけ聞いてた。

ここに来たのは、実はほとんど思いつきで。朝市で仲良くなった人に「面白い店があるよ」って教えてもらって、気づいたら次の週末、来ていた。

その店主のおばあさんと、お茶の淹れ方についてだけで小一時間しゃべって、結局、何も買わずに出てきた。それなのに、今日一日、なんだかすごく満たされてる。

前は「お金をかけないと豊かになれない」って思っていた気がするけど、今は、こういう時間の方が、よっぽど贅沢だって分かってきた。`,
      question: "最近、お金をかけずに満たされた時間はありましたか？",
      action: "今日、誰かとの何気ない会話に、少しだけ長く付き合ってみてください。" }; },

    function () { return { title: "今日は、人に頼った日", body:
`今日は、人に頼った日だった。

一人でやろうとしてたことを、途中で「無理」って言って、誰かに手伝ってもらった。前のわたしなら、多分最後まで意地張ってたと思う。

頼ったあと、想像より全然気まずくなかった。むしろ、ちょっと拍子抜けした。` }; },

    function () { return { title: "最近、会わなくなった人がいる", body:
`最近、会わなくなった人がいる。

喧嘩したとか、そういうことじゃなくて、なんとなく、自然に。代わりに、前より近くなった人もいる。

寂しくないと言えば嘘になるけど、悪いことだとも思ってない。` }; },

    function (a) { return { title: "今日も、朝、同じことをした", body:
`今日も、朝、同じことをした。${a.habits}。

特別なことじゃない。ただの習慣。でも、これを続けてることが、今のわたしを支えてる部分は、確実にある。`,
      question: "それを、今日1分だけ試すとしたら、どんな形で始められそうですか？",
      action: "今日、1分だけでいいので、やってみてください。" }; },

    function (a) { return { title: "今日、ちょっと変なことになってる", body:
`もう夜の11時なんだけど、興奮しすぎて眠れる気がしないから、先にこれだけ書いておく。

覚えてる？ あの頃、あなたが「いつかやってみたい」って、ノートの隅にだけ書いてた企画。正直、今のわたしがやってるのは、あれとはちょっと違う形になってる。途中で全然関係ない人から声をかけられて、気づいたら、思ってもみなかった方向に転がっていった。

今日はその打ち合わせが、思った以上にいい感じで、帰りの電車でひとりニヤニヤしてたのが、ちょっと恥ずかしい。

うまくいくかは、正直まだ分からない。でも「こうなるはずだった」から外れたことに、不安より先に、わくわくしてる自分がいる。

この続き、また明日書くね。` }; },

    function (a) { return { title: "久しぶりに、あの話をした", body:
`今日、久しぶりに、あの話をした。${a.dreams}。

誰かに話すと、まだちょっと照れる。でも、話しながら、「あ、まだ本気なんだな」って自分で気づいた。`,
      question: "その夢について、今週中にできそうな小さなことはありますか？" }; },

    function () { return { title: "正直、今日はもうやる気が出なかった", body:
`正直、今日はもうやる気が出なかった。

やることリストの半分も終わらせないまま、夕飯を作る気力もなくて、結局買ってきたもので済ませた。

こういう日、前はちょっと自己嫌悪してたけど、今日は普通に「まあ、そういう日」で終われた。それだけの話。` }; },

    function (a) { return { title: "今日は、短く書くね", body:
`今日は、短く書くね。

「${a.wordsToSelf}」

これだけ、今日は伝えたかった。` }; },

    function () { return { title: "今日、笑いすぎて涙出た", body:
`今日、仕事終わりに、同僚と少しだけ話し込んだ。

最初はただの雑談だったのに、誰かの失敗談から、なぜか止まらなくなって、気づいたら二人とも笑いすぎて涙拭いてた。

大した話じゃない。多分、明日には内容もあんまり覚えてない。

でも、家に帰ってからも、なんとなくその余韻だけが、しばらく残ってた。

こういう時間のために働いてるのかもな、って、ちょっとだけ思った。` }; },

    function () { return { title: "前より、よく笑ってる気がする", body:
`最近、前より、よく笑ってる気がする。

何が変わったのか、うまく説明できない。多分、ひとつの大きな出来事じゃなくて、こういう手紙を読んでたことも、少しは関係あるのかもしれない。

なくても、ないでいい。` }; },

    function () { return { title: "ちょっとだけ、ありがとうの話", body:
`今日は、ちょっとだけ、ありがとうの話。

最近、そばにいてくれる人に、ちゃんと「ありがとう」を言えてるかどうか、あんまり自信がない。今日、久しぶりにちゃんと言えた気がする。

それだけで、なんとなくいい一日だった。` }; },

    function () { return { title: "明日で最後なんだけど", body:
`明日で最後なんだけど、特に何も準備してない。

きれいな締めくくりの言葉とか、今から考えるつもりもない。多分、いつも通りの手紙になると思う。

それでいいかなと思ってる。` }; },

    function () { return { title: "じゃあ、今日はここまで", body:
`30日間、読んでくれてありがとう。

正直、特別にまとめる言葉は、あんまり浮かばない。明日のあなたも、明後日のあなたも、きっと普通に、日々を続けていくだけだと思うから。

じゃあ、今日はここまで。
また、どこかの未来から。` }; },
  ];
}

function generateTemplateLetters_(answers) {
  var a = withDefaults_(answers);
  var defs = dayLetterDefs_();
  return defs.map(function (build, idx) {
    var day = idx + 1;
    var built = build(a);
    return {
      day: day,
      title: "Day" + day + "｜" + built.title,
      body: built.body,
      question: built.question || null,
      action: built.action || null,
      source: "template",
    };
  });
}

/**
 * AI mode: generates 30 letters via an external AI API (Claude or OpenAI),
 * called once at registration time (see design note in README/gas-backend).
 * Falls back to the template letters on any error so registration never
 * fails and delivery is never blocked by an AI outage.
 */
function generateLettersForUser_(answers, mode) {
  if (mode === "ai") {
    var aiKey = getProp_("AI_API_KEY");
    var aiProvider = getProp_("AI_PROVIDER") || "anthropic";
    if (aiKey) {
      try {
        return generateAiLetters_(answers, aiProvider, aiKey);
      } catch (e) {
        Logger.log("AI letter generation failed, falling back to template: " + e.message);
        // fall through to template fallback below
      }
    }
  }
  return generateTemplateLetters_(answers);
}

function generateAiLetters_(answers, provider, apiKey) {
  var a = withDefaults_(answers);
  var prompt = buildAiPrompt_(a);
  var text;
  if (provider === "openai") {
    text = callOpenAi_(prompt, apiKey);
  } else {
    text = callClaude_(prompt, apiKey);
  }
  var parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length !== 30) {
    throw new Error("AIの応答が30通の配列ではありませんでした。");
  }
  return parsed.map(function (l, idx) {
    var day = idx + 1;
    return {
      day: day,
      title: l.title ? ("Day" + day + "｜" + l.title) : ("Day" + day),
      body: l.body || "",
      question: l.question || null,
      action: l.action || null,
      source: "ai",
    };
  });
}

function buildAiPrompt_(a) {
  return [
    "あなたは「Future Letter 30days」という、1年後の自分から届く手紙サービスの文章作成者です。",
    "以下の利用者情報をもとに、Day1からDay30までの30通の手紙を作成してください。",
    "",
    "【最重要：手紙を書く人格について】",
    "手紙の書き手は「1年後の、少し先を生きている利用者自身」です。先生でも、セラピストでも、成功者でもありません。",
    "この人物は、いつも穏やかで悟っている人ではありません。普通に喜び、興奮し、疲れ、面倒くさがり、笑い、少し腹を立て、",
    "予定が狂い、何もしたくない日もある、感情の幅がある一人の人間として書いてください。",
    "「健全な大人」とは、いつも正しく落ち着いている人物のことではありません。怒らない・不安にならない・失敗しないのではなく、",
    "いろんな自分がいてもそれを扱えるようになっている、という意味です。この解釈を必ず守ってください。",
    "",
    "【厳守事項（すべての手紙に共通）】",
    "・毎回「教訓」や「気づき」で締めない。多くの日は、ただの日常の一場面で終わってよい。",
    "・毎回、末尾に問いかけ（question）や行動提案（action）を入れない。30通のうち、questionとactionを持つのは全体の3割程度にとどめ、残りはnullにしてください。",
    "・成功や達成を自慢げに報告しない。収入額・肩書き・完璧な達成の羅列は禁止です。",
    "・「不安が消えた」「治った」と断定しない。「付き合い方が変わった」程度の、控えめな変化にとどめてください。",
    "・利用者の回答（仕事・夢・行きたい場所など）を、そのまま結果報告のように引用しない。",
    "　例：「京都に行きたい」という回答に対して「京都に行けました！」ではなく、すでに京都の朝の情景の中にいる文章にする。",
    "・利用者が答えた夢や仕事をそのまま固定しない。予想していなかった人・場所・出来事に出会っている余白を残してよい。",
    "・一人で完結する成功物語にしない。家族・友人・同僚など、人との関わりも定期的に描く。",
    "・Day30は、きれいな結論やまとめで終わらせない。「また、どこかの未来から」のように、関係が続いている余韻を残す。",
    "",
    "【文体のばらつきについて】",
    "AIは放っておくと似た構造の文章を量産しがちです。以下の要素を、30通の中でできる限りばらけさせてください。",
    "・書き出しのパターン（情景から入る／今の気持ちから入る／会話の引用から入る、など）",
    "・手紙の長さ（3行程度の短い日もあれば、少し長い日があってもよい）",
    "・感情の温度（興奮、疲労、退屈、満足、苛立ち、何も感じない、など）",
    "・現在の利用者への言及量（強く触れる日、まったく触れない日があってよい）",
    "・締め方（「1年後のあなたより」と署名する日、「また明日」で終わる日、署名なしで終わる日など）",
    "ただし、同じ一人の人間が30日間書いているという一貫性（口調・呼び方のクセ）は保ってください。",
    "",
    "【30日を通した関係性の変化（表には出さない、あくまで内容のトーンに反映）】",
    "Day1〜4は、まだ少し他人行儀。1週間ほどで親しみが増す。中盤では、利用者の古い思い込みや不安にさりげなく触れる。",
    "後半になるほど、未来の暮らしや価値観が身近に感じられるようにする。ただし、これは「学習プログラムの段階」のように",
    "利用者に感じさせてはいけません。あくまで自然な30通の手紙として届くようにしてください。",
    "",
    "利用者情報:",
    "呼び名: " + a.name,
    "1年後どうなっていたいか: " + a.futureSelf,
    "仕事: " + a.job,
    "収入: " + a.income,
    "暮らし: " + a.lifestyle,
    "行きたい場所: " + a.places,
    "叶えたい夢: " + a.dreams,
    "身につけたい習慣: " + a.habits,
    "手放したい不安: " + a.worries,
    "伝えてほしい言葉: " + a.wordsToSelf,
    "手紙の雰囲気の好み（参考程度。上記の人格ルールを優先すること）: " + (TONE_LABELS_[a.tone] || "バランスよくおまかせ"),
    "",
    "出力は必ず、30個のオブジェクトを持つJSON配列のみとしてください（説明文や前置きは不要です）。",
    "各オブジェクトの形式: {\"title\": string, \"body\": string, \"question\": string または null, \"action\": string または null}",
  ].join("\n");
}

function callClaude_(prompt, apiKey) {
  var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    payload: JSON.stringify({
      model: getProp_("AI_MODEL") || "claude-sonnet-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error("Claude API error: " + res.getContentText());
  var json = JSON.parse(res.getContentText());
  return extractJsonArrayText_(json.content[0].text);
}

function callOpenAi_(prompt, apiKey) {
  var res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify({
      model: getProp_("AI_MODEL") || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error("OpenAI API error: " + res.getContentText());
  var json = JSON.parse(res.getContentText());
  return extractJsonArrayText_(json.choices[0].message.content);
}

function extractJsonArrayText_(text) {
  var start = text.indexOf("[");
  var end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI応答からJSON配列を抽出できませんでした。");
  return text.slice(start, end + 1);
}
