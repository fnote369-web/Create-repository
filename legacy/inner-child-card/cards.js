/* インナーチャイルドカード データ
   各カードは「テーマ」「イラスト(SVG)」「言葉(メッセージ/問いかけ)」を持つ */

const CARDS = [
  {
    id: 1,
    title: "無邪気な子",
    reading: "The Innocent",
    color: "#FFC857",
    message: "なんでも新しくて、キラキラして見える。\nまっさらな好奇心と純粋さを持つ、あなたの中の小さな自分。\n難しく考えず、ただ「わあ」と驚く心を思い出して。",
    question: "最近、何かに純粋に「わあ」と驚いたのはいつですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#FFF3D6"/>
      <path d="M30 12 L33 24 L45 24 L35 31 L39 43 L30 36 L21 43 L25 31 L15 24 L27 24 Z" fill="#FFC857"/>`
  },
  {
    id: 2,
    title: "傷ついた子",
    reading: "The Wounded Child",
    color: "#F16C6C",
    message: "痛かったね。誰にも気づかれずに、ずっと我慢してきたのかもしれない。\nその傷を否定せず、まずは「気づいてあげる」ことから始めよう。",
    question: "小さい頃、本当は誰に「大丈夫？」と聞いてほしかったですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#FDE2E2"/>
      <path d="M30 44 C16 34 12 26 18 20 C22 16 28 17 30 22 C32 17 38 16 42 20 C48 26 44 34 30 44 Z" fill="#F16C6C"/>
      <line x1="24" y1="26" x2="36" y2="26" stroke="#FDE2E2" stroke-width="3"/>
      <line x1="30" y1="20" x2="30" y2="32" stroke="#FDE2E2" stroke-width="3"/>`
  },
  {
    id: 3,
    title: "遊び心のある子",
    reading: "The Playful Child",
    color: "#6FCF97",
    message: "理由なんてなくていい。ただ楽しいから、笑いたいから、それだけでいい。\n遊ぶことは、生きるエネルギーそのもの。",
    question: "時間を忘れて夢中になれる遊びは何ですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#E3F6EC"/>
      <circle cx="30" cy="24" r="10" fill="#6FCF97"/>
      <path d="M30 34 L30 46" stroke="#6FCF97" stroke-width="3"/>
      <path d="M22 30 L14 24 M38 30 L46 24" stroke="#6FCF97" stroke-width="3"/>`
  },
  {
    id: 4,
    title: "好奇心旺盛な子",
    reading: "The Curious Child",
    color: "#56A3D9",
    message: "「これなんだろう？」その一言が、世界を広げてきた。\n知らないことは怖くない。知りたい気持ちに素直になっていい。",
    question: "今、いちばん「知りたい」と思っていることは何ですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#DEEEFA"/>
      <circle cx="27" cy="27" r="10" fill="none" stroke="#56A3D9" stroke-width="4"/>
      <line x1="34" y1="34" x2="44" y2="44" stroke="#56A3D9" stroke-width="4" stroke-linecap="round"/>`
  },
  {
    id: 5,
    title: "甘えたい子",
    reading: "The Child Who Wants to Be Loved",
    color: "#E895C4",
    message: "本当は、もっと甘えたかった。もっと抱きしめてほしかった。\nその気持ちを恥ずかしがらなくていい。今のあなたが、その子を抱きしめてあげよう。",
    question: "今すぐ誰かに甘えられるとしたら、何をしてもらいたいですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#FBE4F1"/>
      <path d="M30 42 C16 32 12 24 18 18 C22 14 28 15 30 20 C32 15 38 14 42 18 C48 24 44 32 30 42 Z" fill="#E895C4"/>`
  },
  {
    id: 6,
    title: "怖がりな子",
    reading: "The Fearful Child",
    color: "#9B8BC4",
    message: "不安なとき、いつも一人で耐えてきたのかもしれない。\n「怖い」と言っていい。守られる場所は、ちゃんとある。",
    question: "何が起きたら、あなたは「もう安心だ」と感じられますか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#EAE5F6"/>
      <path d="M14 26 C14 16 46 16 46 26 L46 26 L14 26 Z" fill="#9B8BC4"/>
      <line x1="30" y1="26" x2="30" y2="44" stroke="#9B8BC4" stroke-width="3"/>
      <path d="M22 44 Q30 50 38 44" fill="none" stroke="#9B8BC4" stroke-width="3"/>`
  },
  {
    id: 7,
    title: "怒れる子",
    reading: "The Angry Child",
    color: "#E8734A",
    message: "怒りは「もっと大切に扱ってほしい」というサイン。\n押し込めなくていい。その炎は、あなたを守るための力にもなる。",
    question: "本当は誰に、何を「嫌だ」と言いたかったですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#FCE3D6"/>
      <path d="M30 46 C20 40 18 32 24 26 C22 32 26 32 26 28 C26 22 30 18 30 14 C34 20 38 22 36 28 C42 26 40 34 36 38 C40 36 38 42 30 46 Z" fill="#E8734A"/>`
  },
  {
    id: 8,
    title: "悲しみを抱えた子",
    reading: "The Grieving Child",
    color: "#5B8BB0",
    message: "泣きたいときに、泣けなかったのかもしれない。\n涙は弱さじゃない。心が正直に動いている証。今なら、流していい。",
    question: "本当はずっと悲しかったことは何ですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#DFEAF2"/>
      <path d="M30 14 C22 26 18 32 18 38 C18 45 24 48 30 48 C36 48 42 45 42 38 C42 32 38 26 30 14 Z" fill="#5B8BB0"/>`
  },
  {
    id: 9,
    title: "誇り高き子",
    reading: "The Proud Child",
    color: "#D9A441",
    message: "頑張ったことを、ちゃんと見てほしかった。\n誰かに認められなくても、あなたは自分の頑張りを知っている。",
    question: "誰にも褒められなくても、自分を誇らしいと思えることは何ですか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#F7EBD2"/>
      <circle cx="30" cy="24" r="9" fill="#D9A441"/>
      <path d="M24 31 L18 46 L30 40 L42 46 L36 31" fill="#D9A441"/>`
  },
  {
    id: 10,
    title: "自由な子",
    reading: "The Free Child",
    color: "#4FB8A6",
    message: "誰かの期待に応えなくても、あなたはあなたのままでいい。\n羽を広げて、自分らしい方向へ飛んでいこう。",
    question: "誰の目も気にせず自由でいられるとしたら、何をしますか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#DFF3EF"/>
      <path d="M30 44 C30 30 18 26 12 16 C24 16 30 26 30 32 C30 26 36 16 48 16 C42 26 30 30 30 44 Z" fill="#4FB8A6"/>`
  },
  {
    id: 11,
    title: "信じたい子",
    reading: "The Trusting Child",
    color: "#C48A5A",
    message: "裏切られるのが怖くて、信じることをやめてしまったかもしれない。\nでも本当は、また誰かを、そして自分を信じたいと願っている。",
    question: "もう一度、誰かを信じてみるとしたら、何から始めますか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#F1E3D3"/>
      <circle cx="30" cy="22" r="8" fill="none" stroke="#C48A5A" stroke-width="4"/>
      <rect x="26" y="28" width="8" height="14" rx="2" fill="#C48A5A"/>`
  },
  {
    id: 12,
    title: "愛される子",
    reading: "The Beloved Child",
    color: "#F2A65A",
    message: "何かができるからじゃなく、ただそこにいるだけで、\nあなたは愛される価値がある。それは、生まれたときからずっと。",
    question: "「そのままのあなたでいい」と言われたら、どう感じますか？",
    svg: `<circle cx="30" cy="30" r="26" fill="#FDECD8"/>
      <circle cx="30" cy="18" r="9" fill="#F2A65A"/>
      <path d="M30 40 C20 33 17 27 22 22 C25 19 29 20 30 24 C31 20 35 19 38 22 C43 27 40 33 30 40 Z" fill="#F2A65A"/>`
  }
];
