/* =========================================================
   Bolet Lakay — OBS overlay logic
   Renders state cards + Florida spotlight from Firebase data,
   and animates values the moment they become visible.
   ========================================================= */

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

// Track previous "visible" flags so we only animate on the transition
// from hidden -> shown (not on every database update).
const prevVisible = {};   // key: "STATE.field" or "pick3"/"pick4" -> boolean
const prevRevealedAt = { pick3: 0, pick4: 0 };

let animateEnabled = true;

// ---------------- Build the static card skeletons once ----------------
function buildCards() {
  const left = document.getElementById("col-left");
  const right = document.getElementById("col-right");
  STATE_CONFIG.forEach((state, i) => {
    const card = document.createElement("div");
    card.className = "state-card";
    card.style.setProperty("--accent", state.color);

    const title = document.createElement("div");
    title.className = "state-name";
    title.textContent = state.name;
    card.appendChild(title);

    state.fields.forEach(f => {
      const row = document.createElement("div");
      row.className = "state-row";

      const label = document.createElement("div");
      label.className = "label";
      label.textContent = f.label;

      const box = document.createElement("div");
      box.className = "value-box empty";
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
    d.className = "digit" + (isVisible ? "" : " placeholder");
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
    document.getElementById("drawTitle").textContent =
      (data.title || "REZILTA TIRAJ FLORIDA").toUpperCase();
    document.getElementById("drawSubtitle").textContent = data.subtitle || "";
    renderPick("pick3", "pick3", data.pick3, 3);
    renderPick("pick4", "pick4", data.pick4, 4);
  });
}

function listenMeta() {
  db.ref("meta").on("value", snap => {
    const data = snap.val() || {};
    animateEnabled = data.animate !== false;

    document.body.classList.toggle("bg-full", data.bgMode === "full");
    document.body.style.setProperty("--bg1", data.bgColor1 || "#0e1b33");
    document.body.style.setProperty("--bg2", data.bgColor2 || "#060b16");

    document.getElementById("liveBadge").style.display =
      data.liveOn === false ? "none" : "flex";

    if (data.logoUrl) {
      // reserved: could swap a header brand logo image if you add one later
    }

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
  });
}

// ---------------- Date + clock ----------------
const MONTHS_HT = ["Janvye","Fevriye","Mas","Avril","Me","Jen","Jiyè","Out","Septanm","Oktòb","Novanm","Desanm"];
const DAYS_HT = ["Dimanch","Lendi","Madi","Mèkredi","Jedi","Vandredi","Samdi"];

function updateDate() {
  const now = new Date();
  const label = `${DAYS_HT[now.getDay()]} ${now.getDate()} ${MONTHS_HT[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById("datePill").textContent = label;
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clockTime").textContent = `${h}:${m}`;
}

// ---------------- Init ----------------
buildCards();
listenState();
listenDraw();
listenMeta();
updateDate();
updateClock();
setInterval(updateClock, 1000 * 15);
setInterval(updateDate, 1000 * 60 * 30);
