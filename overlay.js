// BOLET_LAKAY_VERSION: 2026-09-06-drag
/* =========================================================
   Bolet Lakay — OBS overlay logic
   Renders state cards + spotlight from Firebase data,
   and animates values the moment they become visible.
   ========================================================= */

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

// Track previous "visible" flags so we only animate on the transition
// from hidden -> shown (not on every database update).
const prevVisible = {};   // key: "STATE.field" -> boolean
const prevRevealedAt = { pick3: 0, pick4: 0 };

let animateEnabled = true;
let dateOverride = "";

// ---------------- Build the static card skeletons once ----------------
function fieldIcon(label) {
  const l = label.toLowerCase();
  if (l.includes("soir")) return "🌙";
  if (l.includes("mat")) return "☀️";
  return "🕐";
}

function buildCards() {
  const left = document.getElementById("col-left");
  const right = document.getElementById("col-right");

  STATE_CONFIG.forEach((state, i) => {
    const card = document.createElement("div");
    card.className = "state-card";
    card.style.setProperty("--accent", state.color);

    const header = document.createElement("div");
    header.className = "state-header";

    const iconEl = document.createElement("div");
    iconEl.className = "state-icon";
    iconEl.textContent = state.icon || "";

    const nameEl = document.createElement("div");
    nameEl.className = "state-name";
    nameEl.textContent = state.name.toUpperCase();

    header.appendChild(iconEl);
    header.appendChild(nameEl);
    card.appendChild(header);

    state.fields.forEach(f => {
      const row = document.createElement("div");
      row.className = "result-row";

      const label = document.createElement("div");
      label.className = "result-label";
      label.textContent = `${f.label} ${fieldIcon(f.label)}`;

      const box = document.createElement("div");
      box.className = "result-number empty";
      box.id = `val-${state.key}-${f.key}`;
      box.textContent = "---";

      row.appendChild(label);
      row.appendChild(box);
      card.appendChild(row);
    });

    // Split roughly evenly: first half left, rest right
    if (i < Math.ceil(STATE_CONFIG.length / 2)) left.appendChild(card);
    else right.appendChild(card);
  });
}

// ---------------- Render a single state field ----------------
function renderField(stateKey, fieldKey, data) {
  const box = document.getElementById(`val-${stateKey}-${fieldKey}`);
  if (!box) return;
  const mapKey = `${stateKey}.${fieldKey}`;
  const wasVisible = prevVisible[mapKey] || false;
  const isVisible = !!(data && data.visible && data.value);

  if (isVisible) {
    box.textContent = data.value;
    box.classList.remove("empty");
    if (!wasVisible && animateEnabled) {
      box.classList.remove("reveal");
      void box.offsetWidth; // restart animation
      box.classList.add("reveal");
    }
  } else {
    box.textContent = "---";
    box.classList.add("empty");
  }
  prevVisible[mapKey] = isVisible;
}

// ---------------- Render Pick 3 / Pick 4 digit rows ----------------
function renderPick(containerId, pickKey, data, length) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const isVisible = !!(data && data.visible && data.value);
  const val = isVisible ? String(data.value).padStart(length, "0") : "";
  const justRevealed = animateEnabled && data && data.revealedAt && data.revealedAt !== prevRevealedAt[pickKey];

  for (let i = 0; i < length; i++) {
    const d = document.createElement("div");
    d.className = "number" + (isVisible ? "" : " placeholder");
    d.textContent = isVisible ? val[i] : "•";
    if (justRevealed) {
      d.style.animationDelay = `${i * 140}ms`;
      d.classList.add("pop");
    }
    container.appendChild(d);
  }
  if (data) prevRevealedAt[pickKey] = data.revealedAt || 0;
}

// ---------------- Firebase listeners ----------------
function listenState() {
  db.ref("state").on("value", snap => {
    const data = snap.val() || {};
    STATE_CONFIG.forEach(state => {
      state.fields.forEach(f => {
        const fieldData = data[state.key] ? data[state.key][f.key] : null;
        renderField(state.key, f.key, fieldData);
      });
    });
  });
}

function listenDraw() {
  db.ref("draw").on("value", snap => {
    const data = snap.val() || {};
    const stateInfo = STATE_CONFIG.find(s => s.key === (data.state || "FL")) || STATE_CONFIG[0];

    document.getElementById("drawStateName").textContent = stateInfo.name.toUpperCase();
    document.getElementById("drawSubtitle").textContent = data.subtitle || "";

    renderPick("pick3", "pick3", data.pick3, 3);
    renderPick("pick4", "pick4", data.pick4, 4);
  });
}

function listenMeta() {
  db.ref("meta").on("value", snap => {
    const data = snap.val() || {};
    animateEnabled = data.animate !== false;
    dateOverride = data.dateText || "";
    updateDate();

    document.body.classList.toggle("bg-full", data.bgMode === "full");
    document.body.style.setProperty("--bg1", data.bgColor1 || "#0e1b33");
    document.body.style.setProperty("--bg2", data.bgColor2 || "#060b16");

    document.getElementById("liveBadge").style.display =
      data.liveOn === false ? "none" : "flex";

    const awelImg = document.getElementById("awelImg");
    const awelFallback = document.getElementById("awelFallback");
    if (data.awelLogoUrl) {
      awelImg.src = data.awelLogoUrl;
      awelImg.style.display = "block";
      awelFallback.style.display = "none";
    } else {
      awelImg.style.display = "none";
      awelFallback.style.display = "flex";
    }

    // ---- Freely-placed custom logo ----
    const customLogo = document.getElementById("customLogo");
    if (data.customLogoUrl) {
      customLogo.src = data.customLogoUrl;
      customLogo.style.width = `${data.customLogoSize || 150}px`;
      customLogo.style.left = `${data.customLogoX != null ? data.customLogoX : 20}px`;
      customLogo.style.top = `${data.customLogoY != null ? data.customLogoY : 20}px`;
      customLogo.style.display = "block";
    } else {
      customLogo.style.display = "none";
    }

    // ---- Timer / clock circle size ----
    const timerSize = data.timerSize || 150;
    const clockBadge = document.getElementById("clockBadge");
    const clockTime = document.getElementById("clockTime");
    const clockLabel = document.getElementById("clockLabel");
    clockBadge.style.width = `${timerSize}px`;
    clockBadge.style.height = `${timerSize}px`;
    clockBadge.style.left = `${data.timerX != null ? data.timerX : 1430}px`;
    clockBadge.style.top = `${data.timerY != null ? data.timerY : -20}px`;
    clockBadge.style.borderWidth = `${Math.max(4, Math.round(timerSize * 0.0533))}px`;
    clockTime.style.fontSize = `${Math.round(timerSize * 0.307)}px`;
    clockLabel.style.fontSize = `${Math.round(timerSize * 0.0867)}px`;
  });
}

// ---------------- Date + clock/countdown ----------------
const MONTHS_HT = ["Janvye","Fevriye","Mas","Avril","Me","Jen","Jiyè","Out","Septanm","Oktòb","Novanm","Desanm"];
const DAYS_HT = ["Dimanch","Lendi","Madi","Mèkredi","Jedi","Vandredi","Samdi"];

let timerActive = false;
let timerEndsAt = 0;

function updateDate() {
  if (dateOverride) {
    document.getElementById("datePill").textContent = dateOverride;
    return;
  }
  const now = new Date();
  const label = `${DAYS_HT[now.getDay()]} ${now.getDate()} ${MONTHS_HT[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById("datePill").textContent = label;
}

function updateClock() {
  const timeEl = document.getElementById("clockTime");
  const labelEl = document.getElementById("clockLabel");

  if (timerActive) {
    const remainingMs = timerEndsAt - Date.now();
    if (remainingMs <= 0) {
      timeEl.textContent = "00:00";
      labelEl.textContent = "REZILTA NAN";
      return;
    }
    const totalSec = Math.ceil(remainingMs / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    timeEl.textContent = `${m}:${s}`;
    labelEl.textContent = "REZILTA NAN";
  } else {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    timeEl.textContent = `${h}:${m}`;
    labelEl.textContent = "LÈ AKTYÈL";
  }
}

function listenTimer() {
  db.ref("timer").on("value", snap => {
    const data = snap.val() || {};
    timerActive = !!data.active && data.endsAt > Date.now();
    timerEndsAt = data.endsAt || 0;
    updateClock();
  });
}

// ---------------- Init ----------------
buildCards();
listenState();
listenDraw();
listenMeta();
listenTimer();
updateDate();
updateClock();
setInterval(updateClock, 1000);
setInterval(updateDate, 1000 * 60 * 30);
