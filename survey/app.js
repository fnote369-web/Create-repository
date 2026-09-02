const SCALE_LABELS = ["とても簡単", "簡単", "普通", "難しい", "とても難しい"];

function buildScaleGroups() {
  document.querySelectorAll(".scale-group").forEach((group) => {
    const name = group.dataset.name;
    const includeNa = group.dataset.includeNa === "true";

    SCALE_LABELS.forEach((label, index) => {
      group.appendChild(makeScalePill(name, String(index + 1), label));
    });

    if (includeNa) {
      const naPill = makeScalePill(name, "未実施", "試していない");
      naPill.classList.add("na");
      group.appendChild(naPill);
    }
  });
}

function makeScalePill(name, value, label) {
  const wrapper = document.createElement("label");
  wrapper.className = "scale-pill";
  wrapper.innerHTML = `<input type="radio" name="${name}" value="${value}"><span>${label}</span>`;
  return wrapper;
}

function buildNpsGroup() {
  const group = document.getElementById("npsGroup");
  for (let i = 0; i <= 10; i++) {
    const wrapper = document.createElement("label");
    wrapper.className = "nps-pill";
    wrapper.innerHTML = `<input type="radio" name="q14_nps" value="${i}"><span>${i}</span>`;
    group.appendChild(wrapper);
  }
}

function getRequiredFieldNames(form) {
  return Array.from(form.querySelectorAll(".scale-field[data-required='true'] [data-name], .scale-field[data-required='true'] #npsGroup"))
    .map((el) => el.dataset.name || "q14_nps");
}

function validateRequired(form) {
  const requiredNames = getRequiredFieldNames(form);
  const missing = requiredNames.filter((name) => !form.querySelector(`input[name="${name}"]:checked`));
  return missing;
}

function collectAnswers(form) {
  const formData = new FormData(form);
  const answers = {};
  formData.forEach((value, key) => {
    answers[key] = value;
  });
  answers.submittedAt = new Date().toISOString();
  return answers;
}

// TODO: 実際の送信先（Google フォーム / Formspree / 自前API など）が決まり次第、
// ここでネットワーク送信を行うように差し替える。現時点では見た目確認用に
// ローカル保存のみ行っている。
function saveAnswersLocally(answers) {
  const key = "bookingToolSurveyResponses";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(answers);
  localStorage.setItem(key, JSON.stringify(existing));
}

function initSurveyForm() {
  const form = document.getElementById("surveyForm");
  const thanksScreen = document.getElementById("thanksScreen");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const missing = validateRequired(form);
    if (missing.length > 0) {
      alert("5段階評価が必須の項目に、まだ回答していないものがあります。");
      return;
    }

    const answers = collectAnswers(form);
    saveAnswersLocally(answers);

    form.hidden = true;
    thanksScreen.hidden = false;
  });
}

buildScaleGroups();
buildNpsGroup();
initSurveyForm();
