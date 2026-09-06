// BOLET_LAKAY_VERSION: 2026-09-06-drag
/* =========================================================
   Bolet Lakay — admin control panel logic
   Renders one editable card per state, keeps everything in
   sync with Firebase, and pushes reveal/update/reset actions.
   ========================================================= */

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

const inputs = {};   // "STATE.field" -> <input>
const eyeBtns = {};  // "STATE.field" -> <button>
const visibleState = {}; // "STATE.field" -> bool

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1600);
}

// ---------------- Build one card per state ----------------
function buildStateCards() {
  const container = document.getElementById("statesContainer");
  STATE_CONFIG.forEach(state => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--accent", state.color);

    const h2 = document.createElement("h2");
    h2.textContent = state.name;
    card.appendChild(h2);

    state.fields.forEach(f => {
      const mapKey = `${state.key}.${f.key}`;
      const row = document.createElement("div");
      row.className = "field-row";

      const label = document.createElement("div");
      label.className = "flabel";
      label.textContent = f.label;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "ex: 069-56-65";
      input.autocomplete = "off";
      input.addEventListener("change", () => pushField(state.key, f.key));

      const eye = document.createElement("button");
      eye.className = "eye-btn";
      eye.textContent = "👁";
      eye.title = "Montre/kache sou OBS";
      eye.addEventListener("click", () => toggleVisible(state.key, f.key));

      inputs[mapKey] = input;
      eyeBtns[mapKey] = eye;

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(eye);
      card.appendChild(row);
    });

    container.appendChild(card);
  });
}

// ---------------- Push a single field's value to Firebase ----------------
function pushField(stateKey, fieldKey) {
  const mapKey = `${stateKey}.${fieldKey}`;
  const val = inputs[mapKey].value.trim();
  db.ref(`state/${stateKey}/${fieldKey}/value`).set(val);
  toast(`${stateKey} ${fieldKey} mizajou`);
}

// ---------------- Toggle show/hide for one field ----------------
function toggleVisible(stateKey, fieldKey) {
  const mapKey = `${stateKey}.${fieldKey}`;
  const newVal = !visibleState[mapKey];
  db.ref(`state/${stateKey}/${fieldKey}/visible`).set(newVal);
}

// ---------------- Listen for external changes (keep panel in sync) ----------------
function listenState() {
  db.ref("state").on("value", snap => {
    const data = snap.val() || {};
    STATE_CONFIG.forEach(state => {
      state.fields.forEach(f => {
        const mapKey = `${state.key}.${f.key}`;
        const fieldData = (data[state.key] && data[state.key][f.key]) || { value: "", visible: false };
        const input = inputs[mapKey];
        // Don't clobber what the user is actively typing
        if (document.activeElement !== input) input.value = fieldData.value || "";
        visibleState[mapKey] = !!fieldData.visible;
        eyeBtns[mapKey].classList.toggle("on", !!fieldData.visible);
      });
    });
  });
}

// ---------------- Draw (Pick 3 / Pick 4) ----------------
function listenDraw() {
  db.ref("draw").on("value", snap => {
    const data = snap.val() || {};
    const stateSelect = document.getElementById("draw-state");
    const sub = document.getElementById("draw-subtitle");
    const p3 = document.getElementById("draw-pick3");
    const p4 = document.getElementById("draw-pick4");
    if (document.activeElement !== stateSelect) stateSelect.value = data.state || "FL";
    if (document.activeElement !== sub) sub.value = data.subtitle || "";
    if (document.activeElement !== p3) p3.value = (data.pick3 && data.pick3.value) || "";
    if (document.activeElement !== p4) p4.value = (data.pick4 && data.pick4.value) || "";
    document.getElementById("eye-pick3").classList.toggle("on", !!(data.pick3 && data.pick3.visible));
    document.getElementById("eye-pick4").classList.toggle("on", !!(data.pick4 && data.pick4.visible));
  });
}

function wireDrawControls() {
  const stateSelect = document.getElementById("draw-state");
  STATE_CONFIG.forEach(state => {
    const opt = document.createElement("option");
    opt.value = state.key;
    opt.textContent = state.name;
    stateSelect.appendChild(opt);
  });
  stateSelect.addEventListener("change", () => {
    const chosen = STATE_CONFIG.find(s => s.key === stateSelect.value);
    db.ref("draw").update({
      state: stateSelect.value,
      title: `Rezilta Tiraj ${chosen.name.toUpperCase()}`
    });
    toast(`Spotlight chanje pou ${chosen.name}`);
  });

  document.getElementById("draw-subtitle").addEventListener("change", e => {
    db.ref("draw/subtitle").set(e.target.value.trim());
  });
  document.getElementById("draw-pick3").addEventListener("change", e => {
    db.ref("draw/pick3/value").set(e.target.value.trim());
  });
  document.getElementById("draw-pick4").addEventListener("change", e => {
    db.ref("draw/pick4/value").set(e.target.value.trim());
  });
  document.getElementById("eye-pick3").addEventListener("click", () => {
    db.ref("draw/pick3/visible").once("value", s => db.ref("draw/pick3/visible").set(!s.val()));
  });
  document.getElementById("eye-pick4").addEventListener("click", () => {
    db.ref("draw/pick4/visible").once("value", s => db.ref("draw/pick4/visible").set(!s.val()));
  });
  document.getElementById("reveal-pick3").addEventListener("click", () => {
    const val = document.getElementById("draw-pick3").value.trim();
    db.ref("draw/pick3").update({ value: val, visible: true, revealedAt: Date.now() });
    toast("Pick 3 revele!");
  });
  document.getElementById("reveal-pick4").addEventListener("click", () => {
    const val = document.getElementById("draw-pick4").value.trim();
    db.ref("draw/pick4").update({ value: val, visible: true, revealedAt: Date.now() });
    toast("Pick 4 revele!");
  });
}

// ---------------- Meta toggles ----------------
function wireMetaControls() {
  const animateToggle = document.getElementById("animateToggle");
  const bgFullToggle = document.getElementById("bgFullToggle");
  const liveToggle = document.getElementById("liveToggle");

  const bgColor1 = document.getElementById("bgColor1");
  const bgColor2 = document.getElementById("bgColor2");
  const dateOverride = document.getElementById("dateOverride");
  const timerSize = document.getElementById("timerSize");
  const timerX = document.getElementById("timerX");
  const timerY = document.getElementById("timerY");
  const logoUrl = document.getElementById("logoUrl");
  const logoSize = document.getElementById("logoSize");
  const logoX = document.getElementById("logoX");
  const logoY = document.getElementById("logoY");

  animateToggle.addEventListener("change", () => db.ref("meta/animate").set(animateToggle.checked));
  bgFullToggle.addEventListener("change", () => db.ref("meta/bgMode").set(bgFullToggle.checked ? "full" : "transparent"));
  liveToggle.addEventListener("change", () => db.ref("meta/liveOn").set(liveToggle.checked));
  bgColor1.addEventListener("input", () => db.ref("meta/bgColor1").set(bgColor1.value));
  bgColor2.addEventListener("input", () => db.ref("meta/bgColor2").set(bgColor2.value));
  dateOverride.addEventListener("change", () => db.ref("meta/dateText").set(dateOverride.value.trim()));
  timerSize.addEventListener("change", () => db.ref("meta/timerSize").set(Number(timerSize.value) || 150));
  timerX.addEventListener("change", () => db.ref("meta/timerX").set(Number(timerX.value) || 0));
  timerY.addEventListener("change", () => db.ref("meta/timerY").set(Number(timerY.value) || 0));
  logoUrl.addEventListener("change", () => db.ref("meta/customLogoUrl").set(logoUrl.value.trim()));
  logoSize.addEventListener("change", () => db.ref("meta/customLogoSize").set(Number(logoSize.value) || 150));
  logoX.addEventListener("change", () => db.ref("meta/customLogoX").set(Number(logoX.value) || 0));
  logoY.addEventListener("change", () => db.ref("meta/customLogoY").set(Number(logoY.value) || 0));

  db.ref("meta").on("value", snap => {
    const data = snap.val() || {};
    animateToggle.checked = data.animate !== false;
    bgFullToggle.checked = data.bgMode === "full";
    liveToggle.checked = data.liveOn !== false;
    if (document.activeElement !== bgColor1) bgColor1.value = data.bgColor1 || "#0e1b33";
    if (document.activeElement !== bgColor2) bgColor2.value = data.bgColor2 || "#060b16";
    if (document.activeElement !== dateOverride) dateOverride.value = data.dateText || "";
    if (document.activeElement !== timerSize) timerSize.value = data.timerSize || 150;
    if (document.activeElement !== timerX) timerX.value = data.timerX != null ? data.timerX : 1430;
    if (document.activeElement !== timerY) timerY.value = data.timerY != null ? data.timerY : -20;
    if (document.activeElement !== logoUrl) logoUrl.value = data.customLogoUrl || "";
    if (document.activeElement !== logoSize) logoSize.value = data.customLogoSize || 150;
    if (document.activeElement !== logoX) logoX.value = data.customLogoX != null ? data.customLogoX : 20;
    if (document.activeElement !== logoY) logoY.value = data.customLogoY != null ? data.customLogoY : 20;
  });
}

// ---------------- Draggable position preview (timer + logo) ----------------
function makeDraggable(marker, previewEl, onDrop) {
  let dragging = false;

  function start(e) {
    dragging = true;
    e.preventDefault();
  }
  function move(e) {
    if (!dragging) return;
    const rect = previewEl.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    let x = point.clientX - rect.left - marker.offsetWidth / 2;
    let y = point.clientY - rect.top - marker.offsetHeight / 2;
    x = Math.max(0, Math.min(x, rect.width - marker.offsetWidth));
    y = Math.max(0, Math.min(y, rect.height - marker.offsetHeight));
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
  }
  function end() {
    if (!dragging) return;
    dragging = false;
    const rect = previewEl.getBoundingClientRect();
    const scale = rect.width / 1920;
    const x = Math.round(parseFloat(marker.style.left) / scale);
    const y = Math.round(parseFloat(marker.style.top) / scale);
    onDrop(x, y);
  }

  marker.addEventListener("mousedown", start);
  marker.addEventListener("touchstart", start, { passive: false });
  window.addEventListener("mousemove", move);
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("mouseup", end);
  window.addEventListener("touchend", end);
}

function wirePositionPreview() {
  const preview = document.getElementById("posPreview");
  const markerTimer = document.getElementById("markerTimer");
  const markerLogo = document.getElementById("markerLogo");

  function placeMarker(marker, x, y) {
    const rect = preview.getBoundingClientRect();
    const scale = rect.width / 1920;
    marker.style.left = `${x * scale}px`;
    marker.style.top = `${y * scale}px`;
  }

  function refreshFromMeta() {
    db.ref("meta").once("value", snap => {
      const data = snap.val() || {};
      placeMarker(markerTimer, data.timerX != null ? data.timerX : 1430, data.timerY != null ? data.timerY : -20);
      placeMarker(markerLogo, data.customLogoX != null ? data.customLogoX : 20, data.customLogoY != null ? data.customLogoY : 20);
    });
  }

  makeDraggable(markerTimer, preview, (x, y) => {
    document.getElementById("timerX").value = x;
    document.getElementById("timerY").value = y;
    db.ref("meta").update({ timerX: x, timerY: y });
  });

  makeDraggable(markerLogo, preview, (x, y) => {
    document.getElementById("logoX").value = x;
    document.getElementById("logoY").value = y;
    db.ref("meta").update({ customLogoX: x, customLogoY: y });
  });

  db.ref("meta").on("value", snap => {
    const data = snap.val() || {};
    placeMarker(markerTimer, data.timerX != null ? data.timerX : 1430, data.timerY != null ? data.timerY : -20);
    placeMarker(markerLogo, data.customLogoX != null ? data.customLogoX : 20, data.customLogoY != null ? data.customLogoY : 20);
  });

  window.addEventListener("resize", refreshFromMeta);
}

// ---------------- UPDATE ALL RESULTS ----------------
function wireUpdateAll() {
  document.getElementById("updateAllBtn").addEventListener("click", () => {
    const updates = {};
    STATE_CONFIG.forEach(state => {
      state.fields.forEach(f => {
        const mapKey = `${state.key}.${f.key}`;
        updates[`state/${state.key}/${f.key}/value`] = inputs[mapKey].value.trim();
      });
    });
    updates["draw/subtitle"] = document.getElementById("draw-subtitle").value.trim();
    updates["draw/pick3/value"] = document.getElementById("draw-pick3").value.trim();
    updates["draw/pick4/value"] = document.getElementById("draw-pick4").value.trim();
    db.ref().update(updates).then(() => toast("Tout rezilta mete ajou!"));
  });
}

// ---------------- Reset / Clear ----------------
function wireDangerZone() {
  document.getElementById("resetToday").addEventListener("click", () => {
    if (!confirm("Reset tout valè yo pou jodi a? (Aksyon sa a pa ka anile)")) return;
    db.ref("state").set(buildEmptyState());
    db.ref("draw").set(buildEmptyDraw());
    toast("Reset fèt.");
  });
  document.getElementById("clearAll").addEventListener("click", () => {
    if (!confirm("Efase TOUT bagay (rezilta + paramèt)? Aksyon sa a pa ka anile!")) return;
    if (!confirm("Ou sèten? Sa ap efase tout bagay net.")) return;
    db.ref("state").set(buildEmptyState());
    db.ref("draw").set(buildEmptyDraw());
    db.ref("meta").set(buildDefaultMeta());
    toast("Tout bagay efase.");
  });
}

// ---------------- Presets ----------------
function wirePresets() {
  document.getElementById("savePreset").addEventListener("click", () => {
    const name = document.getElementById("presetName").value.trim();
    if (!name) { toast("Mete yon non pou preset la"); return; }
    Promise.all([
      db.ref("state").once("value"),
      db.ref("draw").once("value")
    ]).then(([stateSnap, drawSnap]) => {
      db.ref(`presets/${name}`).set({
        state: stateSnap.val() || buildEmptyState(),
        draw: drawSnap.val() || buildEmptyDraw(),
        savedAt: Date.now()
      });
      document.getElementById("presetName").value = "";
      toast(`Preset "${name}" anrejistre`);
    });
  });

  db.ref("presets").on("value", snap => {
    const data = snap.val() || {};
    const list = document.getElementById("presetList");
    list.innerHTML = "";
    Object.keys(data).forEach(name => {
      const chip = document.createElement("button");
      chip.className = "preset-chip";
      chip.textContent = name;
      chip.addEventListener("click", () => {
        if (!confirm(`Chaje preset "${name}"? Sa ap ranplase valè aktyèl yo.`)) return;
        db.ref("state").set(data[name].state || buildEmptyState());
        db.ref("draw").set(data[name].draw || buildEmptyDraw());
        toast(`Preset "${name}" chaje`);
      });
      list.appendChild(chip);
    });
  });
}

// ---------------- Connection status ----------------
function wireConnStatus() {
  const el = document.getElementById("connStatus");
  db.ref(".info/connected").on("value", snap => {
    if (snap.val() === true) {
      el.textContent = "Konekte ✓";
      el.className = "status ok";
    } else {
      el.textContent = "Pa konekte...";
      el.className = "status err";
    }
  });
}

// ---------------- Countdown timer ----------------
function wireTimerControls() {
  document.getElementById("timerStart").addEventListener("click", () => {
    const minutes = parseFloat(document.getElementById("timerMinutes").value || "5");
    const endsAt = Date.now() + minutes * 60 * 1000;
    db.ref("timer").set({ active: true, endsAt });
    toast(`Countdown lanse pou ${minutes} minit`);
  });
  document.getElementById("timerStop").addEventListener("click", () => {
    db.ref("timer").set({ active: false, endsAt: 0 });
    toast("Countdown sispann");
  });
}

// ---------------- Init ----------------
buildStateCards();
listenState();
listenDraw();
wireDrawControls();
wireMetaControls();
wirePositionPreview();
wireUpdateAll();
wireDangerZone();
wireConnStatus();
wirePresets();
wireTimerControls();
