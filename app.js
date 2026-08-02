(() => {
  const cardEl = document.getElementById("card");
  const drawBtn = document.getElementById("drawBtn");
  const resetBtn = document.getElementById("resetBtn");

  const cardIcon = document.getElementById("cardIcon");
  const cardTitle = document.getElementById("cardTitle");
  const cardReading = document.getElementById("cardReading");
  const cardMessage = document.getElementById("cardMessage");
  const cardQuestion = document.getElementById("cardQuestion");

  const galleryGrid = document.getElementById("galleryGrid");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalClose = document.getElementById("modalClose");
  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalReading = document.getElementById("modalReading");
  const modalMessage = document.getElementById("modalMessage");
  const modalQuestion = document.getElementById("modalQuestion");

  let currentCard = null;
  let drawn = false;

  function fillFace(card, refs) {
    refs.icon.innerHTML = card.svg
      ? `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">${card.svg}</svg>`
      : "";
    refs.title.textContent = card.title;
    refs.reading.textContent = card.reading;
    refs.message.textContent = card.message;
    refs.question.textContent = card.question;
  }

  function drawRandomCard() {
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
    currentCard = card;
    fillFace(card, {
      icon: cardIcon,
      title: cardTitle,
      reading: cardReading,
      message: cardMessage,
      question: cardQuestion
    });
    cardEl.classList.remove("flipped");
    drawn = false;
    drawBtn.hidden = true;
    resetBtn.hidden = true;
    cardEl.hidden = false;
  }

  function flipCard() {
    if (!currentCard) return;
    cardEl.classList.toggle("flipped");
    if (cardEl.classList.contains("flipped") && !drawn) {
      drawn = true;
      resetBtn.hidden = false;
    }
  }

  cardEl.hidden = true;

  drawBtn.addEventListener("click", drawRandomCard);
  resetBtn.addEventListener("click", () => {
    drawRandomCard();
  });

  cardEl.addEventListener("click", flipCard);
  cardEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  });

  // ---- タブ切り替え ----
  const tabButtons = document.querySelectorAll(".tab-btn");
  const screens = document.querySelectorAll(".screen");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      screens.forEach((s) => s.classList.toggle("active", s.id === target));
    });
  });

  // ---- 一覧タブ ----
  function renderGallery() {
    galleryGrid.innerHTML = "";
    CARDS.forEach((card) => {
      const item = document.createElement("div");
      item.className = "gallery-item";
      item.innerHTML = `
        <div class="card-icon"><svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">${card.svg}</svg></div>
        <h3>${card.title}</h3>
      `;
      item.addEventListener("click", () => openModal(card));
      galleryGrid.appendChild(item);
    });
  }

  function openModal(card) {
    fillFace(card, {
      icon: modalIcon,
      title: modalTitle,
      reading: modalReading,
      message: modalMessage,
      question: modalQuestion
    });
    modalOverlay.hidden = false;
  }

  modalClose.addEventListener("click", () => {
    modalOverlay.hidden = true;
  });
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.hidden = true;
  });

  renderGallery();
})();
