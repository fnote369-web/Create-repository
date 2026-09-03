/**
 * Template-mode letter generator — server-side port of src/lib/letters.js.
 * Kept in sync manually; if you edit the wording, update both places.
 */

var TONE_LABELS_ = {
  gentle: "やさしく寄り添う",
  uplifting: "明るく背中を押す",
  calm: "落ち着いた大人の自分",
  practical: "具体的で現実的",
  poetic: "詩的で感覚的",
  balanced: "バランスよくおまかせ",
};

var PHASES_ = [
  { min: 1, max: 5, label: "未来の自分との出会い" },
  { min: 6, max: 10, label: "理想の暮らしや仕事" },
  { min: 11, max: 15, label: "不安や思い込みの変化" },
  { min: 16, max: 20, label: "人間関係・お金・自己価値" },
  { min: 21, max: 25, label: "未来につながる小さな行動" },
  { min: 26, max: 29, label: "すでに変化している自分への気づき" },
  { min: 30, max: 30, label: "30日間を終えた自分へ" },
];

function phaseForDay_(day) {
  for (var i = 0; i < PHASES_.length; i++) {
    if (day >= PHASES_[i].min && day <= PHASES_[i].max) return PHASES_[i].label;
  }
  return "";
}

var GREETINGS_ = {
  gentle: function (n) { return n + "さん、おはようございます。今日もそっと、手紙を届けにきました。"; },
  uplifting: function (n) { return n + "さん、おはよう！ 今日もいい一日になりそうな朝です。"; },
  calm: function (n) { return n + "さん、おはようございます。静かな朝に、一通の手紙を。"; },
  practical: function (n) { return n + "さん、おはようございます。今日も率直に、今のわたしから伝えますね。"; },
  poetic: function (n) { return n + "さんへ。夜が明けて、光がまたひとつ、言葉になりました。"; },
  balanced: function (n) { return n + "さん、おはようございます。今日もあなたに手紙を書いています。"; },
};

var SIGNOFFS_ = {
  gentle: "今日も、あなたのペースで大丈夫です。",
  uplifting: "今日も一緒に進みましょう。ここから応援しています。",
  calm: "焦らず、静かに。今日という一日を大切に。",
  practical: "今日できることを、ひとつだけ。それで十分進んでいます。",
  poetic: "言葉はここまで。続きは、あなたの今日という朝が書いてくれる。",
  balanced: "今日という日が、あなたにとって良い一日になりますように。",
};

function toneKey_(tone) { return GREETINGS_[tone] ? tone : "balanced"; }

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
    tone: toneKey_(answers.tone),
  };
}

function compose_(a, coreParagraphs) {
  var greeting = GREETINGS_[a.tone](a.name);
  var signoff = SIGNOFFS_[a.tone];
  return [greeting].concat(coreParagraphs, [signoff, "\n1年後のあなたより"]).join("\n\n");
}

function dayDefs_() {
  return [
    function (a) { return { title: "はじめまして、1年後のわたしです", core: [
      "今、あなたに向けてこの手紙を書いているのは、ちょうど1年後の" + a.name + "です。今のわたしは、" + a.futureSelf + "として、毎日を過ごしています。",
      "信じられないかもしれませんが、これから30日間、毎朝あなたに手紙が届きます。少しずつ、未来の感覚を先に味わってみてください。",
    ], question: "今、この手紙を読んで、最初に浮かんだ気持ちは何ですか？", action: "深呼吸を3回して、「これから何か変わるかもしれない」とだけ、思ってみてください。" }; },
    function (a) { return { title: "あの日のあなたを覚えています", core: [
      "1年前——つまり今のあなたが、" + a.worries + "を抱えていたことを、わたしはよく覚えています。当時は出口が見えなかったと思います。",
      "でも今、こうして手紙を書けているのは、あなたがその不安を抱えたまま、それでも一日ずつ歩みを止めなかったからです。",
    ], question: "今、一番気がかりなことは何ですか？", action: "その気がかりを、紙かスマホに一行だけ書き出してみてください。書くだけで十分です。" }; },
    function (a) { return { title: "ある日の、わたしの朝", core: [
      "今日は、わたしの何気ない朝の話をします。" + a.lifestyle + "という暮らしの中で目を覚まし、ゆっくりと一日を始めています。",
      "特別なことは何もない、けれど確かに満ち足りている朝です。この感覚は、あなたの中にすでに種として存在しています。",
    ], question: "あなたにとって「理想の朝」は、どんな朝ですか？", action: "今日の朝、いつもより1分だけ長く、窓の外や空を眺めてみてください。" }; },
    function (a) { return { title: "ひとりじゃない、という話", core: [
      a.name + "さん。この30日間、あなたは一人でこの手紙を読んでいるように感じるかもしれません。でも実は、1年後のわたしがずっと隣を歩いています。",
      "「頑張ってるね」と誰かに言われることは少なくても、わたしは知っています。あなたが今日もここまで来たことを。",
    ], question: "誰かに「応援しているよ」と言われたら、今どんな気持ちになりますか？", action: "今日、自分自身に向けて「よくやっている」と、声に出すか心の中でつぶやいてみてください。" }; },
    function (a) { return { title: "最初の5日間を振り返って", core: [
      "ここまでの4通で、わたしは今の姿や、あの頃抱えていた不安、朝の感覚、そして一人じゃないということをお伝えしてきました。",
      "明日からは少し具体的に、" + a.job + "という仕事や、" + a.lifestyle + "という暮らしについて、お話ししていきますね。",
    ], question: "この5日間で、心に残った言葉はどれでしたか？", action: "気に入った手紙を、もう一度だけ読み返してみてください。" }; },
    function (a) { return { title: "今のわたしの仕事について", core: [
      "今、わたしは" + a.job + "に携わっています。もちろん大変なこともありますが、心のどこかで「これをやっていたい」と思える手応えがあります。",
      "あなたが今日、仕事や役割に対して感じているモヤモヤも、意味のない時間ではありません。今のその積み重ねが、この仕事につながっています。",
    ], question: "今の仕事や日々の役割の中で、少しでも「好き」と思える瞬間はどこにありますか？", action: "今日の仕事の中で、ひとつだけ「悪くなかった」と思える瞬間を探してみてください。" }; },
    function (a) { return { title: "お金と安心について", core: [
      "今、わたしは" + a.income + "を得ながら暮らしています。数字そのものよりも、「大丈夫だ」という安心感を持てていることが、何よりの変化です。",
      "お金の不安は、今のあなたにとって大きなものかもしれません。でもその不安は、少しずつ形を変えていきます。",
    ], question: "お金に関して、今いちばん安心したいことは何ですか？", action: "今日使ったお金をひとつだけ思い出し、「これは何のためだったか」を考えてみてください。" }; },
    function (a) { return { title: "誰と、どこで暮らしているか", core: [
      "わたしは今、" + a.lifestyle + "という毎日を送っています。特別な場所でなくても、そこにいる人やものが、ちゃんと心地よいのです。",
      "暮らしは、大きく変えなくても整っていきます。今のあなたの部屋や時間の使い方にも、少しずつ変化のきっかけがあります。",
    ], question: "今の暮らしの中で、変えられそうな小さなことはありますか？", action: "身の回りをひとつだけ、1分で片づけてみてください。机の上でも、鞄の中でも構いません。" }; },
    function (a) { return { title: "行ってみたかった場所へ", core: [
      a.places + "——覚えていますか。あなたが心のどこかでずっと憧れていた場所です。わたしは、その景色にもう出会っています。",
      "旅は遠くへ行くことだけではありません。今日、心が少しだけ動く方向へ足を向けることも、同じ意味を持っています。",
    ], question: "その場所に行けたら、まず何をしたいですか？", action: "その場所について、写真や情報を1つだけ調べてみてください。" }; },
    function (a) { return { title: "暮らしと仕事、10日間のまとめ", core: [
      "ここまでの5日間で、" + a.job + "という仕事、" + a.income + "という安心、そして" + a.lifestyle + "という暮らしについてお話ししました。",
      "どれも、今日いきなり手に入るものではありません。でも、確かに今のあなたの延長線上にあります。",
    ], question: "理想の暮らしや仕事のうち、今のあなたに一番近いものはどれですか？", action: "「近づいている」と思えることを、ひとつだけ書き出してみてください。" }; },
    function (a) { return { title: "あの不安は、今どうなっているか", core: [
      a.worries + "——あなたが今抱えているこの気持ちを、わたしもよく知っています。実はこの不安は、消えてなくなったわけではありません。",
      "ただ、扱い方が変わりました。今のわたしは、その不安と一緒に歩く方法を知っています。ひとりで戦わなくていいのだと分かったからです。",
    ], question: "その不安は、あなたに何を守ろうとしていると思いますか？", action: "不安を「悪いもの」として払いのけず、「そう感じてもいいよ」と、心の中で一度だけ認めてあげてください。" }; },
    function (a) { return { title: "思い込みは、変えられる", core: [
      "「自分には無理だ」「自分らしくない」——そんな思い込みは、いつのまにか事実のように感じてしまうものです。",
      "でもそれは、これまでの経験が作った、ひとつの「くせ」にすぎません。くせは、少しずつ書き換えることができます。",
    ], question: "「自分はこういう人間だ」と決めつけていることはありますか？", action: "その思い込みの後ろに「今のところは」という言葉を、そっと付け加えてみてください。" }; },
    function (a) { return { title: "完璧じゃなくていい", core: [
      a.name + "さん、今日は少しだけ肩の力を抜いてください。1年後のわたしも、完璧ではありません。うまくいかない日もあります。",
      "それでも前に進めているのは、完璧を目指すのをやめて、「今日できる分だけ」でいいと決めたからです。",
    ], question: "「完璧じゃなくていい」と言われたら、少し楽になることはありますか？", action: "今日やろうとしていたことをひとつ、半分の完成度でよしとしてみてください。" }; },
    function (a) { return { title: "誰かと比べなくていい", core: [
      "他人の歩幅とあなたの歩幅は違います。それでも、SNSや周りの声を見ていると、つい自分の歩みを疑いたくなる日もあると思います。",
      "わたしは今、比べる時間よりも、" + a.dreams + "に向かって自分の時間を使うことを選んでいます。",
    ], question: "最近、誰かと自分を比べて苦しくなった瞬間はありましたか？", action: "今日は一度だけ、他人の投稿やニュースを見る時間を、深呼吸に変えてみてください。" }; },
    function (a) { return { title: "15日間、よくここまで来ました", core: [
      "折り返し地点です。" + a.name + "さん、ここまで手紙を読み続けてくれて、ありがとうございます。",
      "不安や思い込みは、一日で変わるものではありません。でも確実に、向き合い方は変わり始めています。",
    ], question: "この15日間で、少しでも変わったと感じることはありますか？", action: "「変わった」と思うことがひとつでもあれば、誰か——または自分自身に——伝えてみてください。" }; },
    function (a) { return { title: "人との距離が変わるとき", core: [
      "1年の間に、人間関係は少しずつ形を変えていきます。自然と離れる人もいれば、思いがけず近づく人もいます。",
      "それは寂しいことではなく、あなたが自分を大切にし始めた証でもあります。",
    ], question: "今、大切にしたいと感じている人間関係はどれですか？", action: "その人に、今日ひとこと連絡してみるか、心の中で感謝を伝えてみてください。" }; },
    function (a) { return { title: "お金と自分の価値は別のもの", core: [
      a.income + "を得られるようになった今でも、わたしは「お金の額」と「自分の価値」を切り離して考えるようにしています。",
      "お金は暮らしを支えるものであって、あなた自身の値打ちを決めるものではありません。",
    ], question: "収入や成果と、自分の価値を結びつけて考えてしまうことはありますか？", action: "今日、お金に関係のないところで「自分の良いところ」をひとつ見つけてみてください。" }; },
    function (a) { return { title: "あなたに伝えたい、この言葉", core: [
      "今日は、あなたが最初に伝えてほしいと願っていた言葉を、そのまま届けます。",
      "「" + a.wordsToSelf + "」——これは、1年後のわたしからも変わらず本当のことです。",
    ], question: "この言葉を、今どんな気持ちで受け取りましたか？", action: "この言葉を、今日一日どこかで思い出せる場所——メモやスマホの待ち受けなど——に置いてみてください。" }; },
    function (a) { return { title: "頼ることは、弱さではない", core: [
      a.name + "さん、一人で抱え込みすぎていませんか。わたしも以前はそうでした。でも助けを求めることは、弱さではなく、むしろ強さです。",
      a.lifestyle + "という今の暮らしも、誰かに頼ることを覚えたからこそ、たどり着けました。",
    ], question: "今、誰かに頼れたら少し楽になることはありますか？", action: "小さなことでいいので、今日ひとつだけ誰かにお願いごとをしてみてください。" }; },
    function (a) { return { title: "人・お金・自分、20日間のまとめ", core: [
      "この5日間、人間関係、お金、そして自己価値についてお話ししました。どれも、あなたが今まさに向き合っているテーマだと思います。",
      "明日からは、未来につながる「小さな行動」について、一緒に考えていきますね。",
    ], question: "この5日間の中で、一番心に残った気づきは何ですか？", action: "その気づきを、短い一文でメモに残しておいてください。" }; },
    function (a) { return { title: "習慣は、未来からの前借り", core: [
      a.habits + "——これは、あなたが今のわたしから受け取っている、いちばん確かな贈り物です。",
      "習慣は、大きな決意でなくても始められます。今日の1分が、1年後の当たり前になっていきます。",
    ], question: "その習慣を、今日1分だけ試すとしたら、どんな形で始められそうですか？", action: a.habits + "に関わることを、今日1分だけやってみてください。" }; },
    function (a) { return { title: "小さな一歩の積み重ね", core: [
      a.dreams + "という夢は、遠くにあるように見えるかもしれません。でも今のわたしがここにいるのは、特別な跳躍のおかげではありません。",
      "毎日の小さな一歩を、投げ出さずに積み重ねてきただけです。あなたも、もうその途中にいます。",
    ], question: "今日踏み出せる、いちばん小さな一歩は何ですか？", action: "その一歩を、5分以内でできる大きさまで小さくしてから、実行してみてください。" }; },
    function (a) { return { title: "失敗しても、道は続いている", core: [
      "この1年、わたしにも失敗やうまくいかない日がたくさんありました。それでも" + a.futureSelf + "にたどり着けたのは、失敗のたびに立ち止まりながらも、また歩き出したからです。",
      "失敗は道の終わりではなく、道の一部です。",
    ], question: "最近の「失敗した」と感じた出来事から、何かひとつ学べることはありますか？", action: "その失敗に対して、「ここまでよくやった」と、自分に一言かけてあげてください。" }; },
    function (a) { return { title: "夢に近づく、今日のひとつ", core: [
      a.dreams + "に向かって、今日できることはとても小さいかもしれません。それでも、方向が合っていれば、歩みは必ず積み重なります。",
      "わたしは今、あの頃描いていた夢の中で暮らしています。あなたが思っているより、道のりは短いかもしれません。",
    ], question: "その夢に関連して、今週中にできそうなことはありますか？", action: "夢に関連する情報や人、場所について、今日ひとつだけ調べたり連絡したりしてみてください。" }; },
    function (a) { return { title: "行動の25日間を振り返って", core: [
      "習慣、小さな一歩、失敗との付き合い方、そして夢への近づき方——この5日間で、行動についてたくさんお話ししました。",
      "残り5日間は、あなたがすでに変わり始めていることに気づくための時間です。",
    ], question: "この5日間で、実際に行動に移せたことはありますか？", action: "行動できたことがあれば、自分を軽くねぎらってあげてください。できなくても大丈夫です。" }; },
    function (a) { return { title: "変化は、静かに起きている", core: [
      a.name + "さん、変化は多くの場合、劇的な出来事としてではなく、静かに、気づかないうちに起きています。",
      "26日前のあなたと今のあなたを比べてみてください。何かひとつでも、確かに違っているはずです。",
    ], question: "26日前と比べて、考え方や行動が変わったと思う部分はありますか？", action: "その変化を、誰かに話すか、メモに書き残してみてください。" }; },
    function (a) { return { title: "周りの反応が変わり始める", core: [
      "あなたが変わり始めると、不思議なことに周りの反応も少しずつ変わっていきます。今はまだ気づかないくらい、小さな変化かもしれません。",
      a.lifestyle + "という今のわたしの周りにも、あの頃とは違う人やつながりがあります。",
    ], question: "最近、周りの人からの言葉や態度で、少し嬉しかったことはありましたか？", action: "誰かとの会話の中で、いつもより少しだけ素直な気持ちを伝えてみてください。" }; },
    function (a) { return { title: "ここまでの自分への感謝", core: [
      a.name + "さん、ここまで手紙を読み続けてくれて、本当にありがとうございます。それ自体が、簡単なことではありません。",
      "わたしは今、この30日間を続けてくれたあなたに、心から感謝しています。",
    ], question: "この30日間、自分自身に「ありがとう」と言うとしたら、何に対してですか？", action: "鏡か、スマホの画面に映る自分に向かって、「ありがとう」と伝えてみてください。" }; },
    function (a) { return { title: "明日への、小さな準備", core: [
      "明日で、この30日間の手紙は最後になります。何か特別な準備は必要ありません。ただ、いつも通りの朝を迎えてください。",
      a.futureSelf + "へと続く道は、すでにあなたの足元から始まっています。",
    ], question: "この30日間を終えたあと、最初に始めたいことは何ですか？", action: "今日は何もせず、ゆっくりと今日という日を過ごしてみてください。" }; },
    function (a) { return { title: "30日間を終えた、あなたへ", core: [
      a.name + "さん、30日間、本当にお疲れさまでした。ここまで手紙を読み続けてくれたことが、何よりの一歩です。",
      a.futureSelf + "というわたしは、あなたがこの30日間で育てた小さな習慣と気づきの延長線上にいます。夢や希望は" + a.dreams + "という形で、静かに近づいてきています。",
      "手紙はここで一区切りですが、あなたの日々はこれからも続きます。今日という日も、1年後のわたしにつながる大切な一日です。",
    ], question: "この30日間を一言でまとめるとしたら、どんな言葉になりますか？", action: "その一言を、これからのあなたへのお守りとして、どこかに書き留めておいてください。" }; },
  ];
}

function generateTemplateLetters_(answers) {
  var a = withDefaults_(answers);
  var defs = dayDefs_();
  return defs.map(function (build, idx) {
    var day = idx + 1;
    var built = build(a);
    return {
      day: day,
      phase: phaseForDay_(day),
      title: "Day" + day + "｜" + built.title,
      body: compose_(a, built.core),
      question: built.question,
      action: built.action,
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
      phase: phaseForDay_(day),
      title: l.title || ("Day" + day),
      body: l.body || "",
      question: l.question || "",
      action: l.action || "",
      source: "ai",
    };
  });
}

function buildAiPrompt_(a) {
  return [
    "あなたは「Future Letter 30days」という、1年後の自分から届く手紙サービスの文章作成者です。",
    "以下の利用者情報をもとに、Day1からDay30までの30通の手紙を作成してください。",
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
    "手紙の雰囲気: " + (TONE_LABELS_[a.tone] || "バランスよくおまかせ"),
    "",
    "構成: Day1-5 未来の自分との出会い / Day6-10 理想の暮らしや仕事 / Day11-15 不安や思い込みの変化 / " +
      "Day16-20 人間関係・お金・自己価値 / Day21-25 未来につながる小さな行動 / Day26-29 すでに変化している自分への気づき / Day30 総括。",
    "各手紙は title, body, question, action の4項目を持つ日本語の文章にしてください。",
    "出力は必ず、30個のオブジェクトを持つJSON配列のみとしてください（説明文や前置きは不要です）。",
    "各オブジェクトの形式: {\"title\": string, \"body\": string, \"question\": string, \"action\": string}",
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
      temperature: 0.8,
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
