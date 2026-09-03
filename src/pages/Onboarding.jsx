import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import Field from "../components/Field.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import StatusBanner from "../components/StatusBanner.jsx";
import { TONE_OPTIONS } from "../lib/letters.js";
import { isValidEmail, MESSAGES } from "../lib/validators.js";
import { todayInTimezone, addDays, isValidDate } from "../lib/date.js";
import { api, draftStore, backendMode } from "../lib/api.js";
import { useSession } from "../context/SessionContext.jsx";

const TIMEZONES = [
  { value: "Asia/Tokyo", label: "日本 (Asia/Tokyo)" },
  { value: "Asia/Seoul", label: "韓国 (Asia/Seoul)" },
  { value: "America/Los_Angeles", label: "アメリカ西海岸 (America/Los_Angeles)" },
  { value: "America/New_York", label: "アメリカ東海岸 (America/New_York)" },
  { value: "Europe/London", label: "イギリス (Europe/London)" },
  { value: "UTC", label: "協定世界時 (UTC)" },
];

function defaultAnswers() {
  const today = todayInTimezone("Asia/Tokyo");
  return {
    name: "",
    email: "",
    timezone: "Asia/Tokyo",
    deliveryStartDate: addDays(today, 1),
    deliveryTime: "06:30",
    targetDate: addDays(today, 366),
    futureSelf: "",
    job: "",
    income: "",
    lifestyle: "",
    places: "",
    dreams: "",
    habits: "",
    worries: "",
    wordsToSelf: "",
    tone: "balanced",
    mode: "template",
    consent: false,
  };
}

const STEPS = [
  { key: "name", title: "お名前", question: "手紙で呼ばれたいお名前を教えてください。", type: "text", placeholder: "例：はな" },
  { key: "email", title: "メールアドレス", question: "手紙を受け取るメールアドレスを教えてください。", type: "email", placeholder: "example@mail.com" },
  { key: "schedule", title: "配信スケジュール", question: "手紙を届け始める日と、届けてほしい時刻を教えてください。", type: "schedule" },
  { key: "targetDate", title: "1年後の日付", question: "1年後、どの日付のあなたを思い描きますか？", type: "date" },
  { key: "futureSelf", title: "1年後の自分", question: "1年後、どのような自分になっていたいですか？", type: "textarea", placeholder: "例：自分に自信を持ち、穏やかに毎日を過ごしている" },
  { key: "job", title: "仕事", question: "1年後、どのような仕事をしていたいですか？", type: "textarea", placeholder: "例：好きなことを仕事にして、人の役に立っている" },
  { key: "income", title: "収入", question: "どのくらいの収入や売上を実現していたいですか？", type: "text", placeholder: "例：月収35万円、安心して暮らせる金額" },
  { key: "lifestyle", title: "暮らし", question: "どこで、誰と、どのように暮らしていたいですか？", type: "textarea", placeholder: "例：海の見える街で、大切な人たちと穏やかに" },
  { key: "places", title: "行きたい場所", question: "行ってみたい場所はありますか？", type: "text", placeholder: "例：京都、パリ、沖縄の離島" },
  { key: "dreams", title: "叶えたい夢", question: "叶えたい夢を教えてください。", type: "textarea", placeholder: "例：自分のお店を持つ、本を出版する" },
  { key: "habits", title: "身につけたい習慣", question: "身につけたい習慣はありますか？", type: "text", placeholder: "例：毎朝10分の散歩、日記を書く" },
  { key: "worries", title: "手放したい不安", question: "手放したい不安や思い込みはありますか？", type: "textarea", placeholder: "例：自分には無理だという思い込み" },
  { key: "wordsToSelf", title: "伝えてほしい言葉", question: "今の自分に、どんな言葉をかけてほしいですか？", type: "text", placeholder: "例：大丈夫、ちゃんと進んでいるよ" },
  { key: "tone", title: "手紙の雰囲気", question: "手紙の雰囲気を選んでください。", type: "tone" },
  { key: "confirm", title: "最後に", question: "内容をご確認のうえ、登録を完了してください。", type: "confirm" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [answers, setAnswers] = useState(defaultAnswers);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = draftStore.load();
    if (saved?.draft) {
      setAnswers((prev) => ({ ...prev, ...saved.draft }));
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    draftStore.save(answers);
  }, [answers]);

  const current = STEPS[step];
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function update(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function validateStep() {
    switch (current.type) {
      case "text":
      case "email":
      case "textarea":
        if (!answers[current.key]?.trim()) return MESSAGES.required;
        if (current.type === "email" && !isValidEmail(answers.email)) return MESSAGES.email;
        return "";
      case "schedule":
        if (!isValidDate(answers.deliveryStartDate)) return MESSAGES.date;
        if (!/^\d{2}:\d{2}$/.test(answers.deliveryTime)) return MESSAGES.time;
        return "";
      case "date":
        if (!isValidDate(answers[current.key])) return MESSAGES.date;
        return "";
      case "tone":
        return answers.tone ? "" : MESSAGES.required;
      case "confirm":
        return answers.consent ? "" : MESSAGES.consent;
      default:
        return "";
    }
  }

  function goNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    setError("");
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (submitting) return; // prevent double-submit from repeated clicks
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: answers.name.trim(),
        email: answers.email.trim(),
        timezone: answers.timezone,
        deliveryStartDate: answers.deliveryStartDate,
        deliveryTime: answers.deliveryTime,
        targetDate: answers.targetDate,
        mode: answers.mode,
        answers: {
          futureSelf: answers.futureSelf,
          job: answers.job,
          income: answers.income,
          lifestyle: answers.lifestyle,
          places: answers.places,
          dreams: answers.dreams,
          habits: answers.habits,
          worries: answers.worries,
          wordsToSelf: answers.wordsToSelf,
          tone: answers.tone,
        },
      };
      const { token } = await api.registerUser(payload);
      draftStore.clear();
      await login(token);
      navigate("/mypage");
    } catch (e) {
      setError(e.message || "登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <ProgressBar value={step + 1} max={STEPS.length} label={`ステップ ${step + 1} / ${STEPS.length}`} />
          {restored && step === 0 && (
            <StatusBanner type="info">前回の続きから再開しました。内容はいつでも書き直せます。</StatusBanner>
          )}
          <StatusBanner type="error">{error}</StatusBanner>

          <div className="card stack">
            <h2>{current.question}</h2>
            <StepInput step={current} answers={answers} update={update} />
          </div>

          <div className="row" style={{ marginTop: "var(--space-4)" }}>
            {step > 0 && (
              <button className="btn btn-secondary btn-auto" onClick={goBack} disabled={submitting}>
                戻る
              </button>
            )}
            <button className="btn btn-primary" onClick={goNext} disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "登録しています…" : step === STEPS.length - 1 ? "登録を完了する" : "次へ"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StepInput({ step, answers, update }) {
  switch (step.type) {
    case "text":
    case "email":
      return (
        <Field>
          <input
            className="input"
            type={step.type === "email" ? "email" : "text"}
            value={answers[step.key]}
            placeholder={step.placeholder}
            onChange={(e) => update(step.key, e.target.value)}
            autoFocus
          />
        </Field>
      );
    case "textarea":
      return (
        <Field>
          <textarea
            className="input"
            value={answers[step.key]}
            placeholder={step.placeholder}
            onChange={(e) => update(step.key, e.target.value)}
            autoFocus
          />
        </Field>
      );
    case "date":
      return (
        <Field hint="あとから設定画面で変更することもできます。">
          <input className="input" type="date" value={answers[step.key]} onChange={(e) => update(step.key, e.target.value)} />
        </Field>
      );
    case "schedule":
      return (
        <div className="stack">
          <Field label="配信開始日" hint={`今日は ${todayInTimezone(answers.timezone)} です。`}>
            <input
              className="input"
              type="date"
              value={answers.deliveryStartDate}
              onChange={(e) => update("deliveryStartDate", e.target.value)}
            />
          </Field>
          <Field label="配信希望時刻">
            <input className="input" type="time" value={answers.deliveryTime} onChange={(e) => update("deliveryTime", e.target.value)} />
          </Field>
          <Field label="タイムゾーン">
            <select className="input" value={answers.timezone} onChange={(e) => update("timezone", e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      );
    case "tone":
      return (
        <div className="choice-grid">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`choice-card${answers.tone === opt.value ? " selected" : ""}`}
              onClick={() => update("tone", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    case "confirm":
      return (
        <div className="stack">
          <div className="choice-grid">
            <button
              type="button"
              className={`choice-card${answers.mode === "template" ? " selected" : ""}`}
              onClick={() => update("mode", "template")}
            >
              <strong>無料モード</strong>
              <div className="small muted">テンプレートから30通の手紙を作成します（追加費用なし）。</div>
            </button>
            <button
              type="button"
              className={`choice-card${answers.mode === "ai" ? " selected" : ""}`}
              onClick={() => update("mode", "ai")}
            >
              <strong>AIモード</strong>
              <div className="small muted">
                AIがあなた専用の30通を作成します（サーバー側でAPIキーが設定されている場合のみ有効。未設定の場合は自動的に無料モードで作成されます）。
              </div>
            </button>
          </div>
          <label className="row" style={{ alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={answers.consent}
              onChange={(e) => update("consent", e.target.checked)}
              style={{ width: 22, height: 22, marginTop: 2 }}
            />
            <span>
              <a href="#/privacy" target="_blank" rel="noreferrer">プライバシーポリシー</a>と
              <a href="#/terms" target="_blank" rel="noreferrer">利用規約</a>
              を確認し、Future Letter 30daysから30日間メールを受け取ることに同意します
            </span>
          </label>
        </div>
      );
    default:
      return null;
  }
}
