/* =========================================================
   Bolet Lakay — shared configuration
   Loaded by BOTH index.html (OBS overlay) and admin.html
   Edit this file to add/remove states or change colors.
   ========================================================= */

// ---- Firebase Realtime Database config ----
// Replace with YOUR project's config (Firebase console > Project settings > General > Your apps > SDK setup and config)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCwIxeRU1QO2hLY5Ur6CHVWr_kFSQzLStY",
  authDomain: "obsstudio-704de.firebaseapp.com",
  databaseURL: "https://obsstudio-704de-default-rtdb.firebaseio.com",
  projectId: "obsstudio-704de",
  storageBucket: "obsstudio-704de.firebasestorage.app",
  messagingSenderId: "42040619392",
  appId: "1:42040619392:web:9b9d11ab44d55fb4b75165"
};

// ---- States shown in the side panels ----
// key    = short id used in the database (do not use spaces/accents)
// name   = display name
// color  = accent color for the card header/border
// fields = the rows shown for that state, in order
const STATE_CONFIG = [
  { key: "NY", name: "New York",    color: "#9b5de5", fields: [
      { key: "matin", label: "Matin" },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "GA", name: "Georgia",     color: "#3a86ff", fields: [
      { key: "matin", label: "Matin" },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "FL", name: "Florida",     color: "#ef4444", fields: [
      { key: "matin", label: "Maten" },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "NJ", name: "New Jersey",  color: "#1d4ed8", fields: [
      { key: "matin", label: "Maten" },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "TN", name: "Tennessee",   color: "#9b5de5", fields: [
      { key: "matin", label: "Maten" },
      { key: "h1h20", label: "1H20"  },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "TX", name: "Texas",       color: "#3a86ff", fields: [
      { key: "matin", label: "Maten" },
      { key: "h1h30", label: "1H30"  },
      { key: "soir",  label: "Soir"  }
  ]},
  { key: "MD", name: "Maryland",    color: "#06b6d4", fields: [
      { key: "matin", label: "Maten" },
      { key: "soir",  label: "Soir"  }
  ]}
];

// Default (empty) value for every field: { value: "", visible: false }
function emptyField() {
  return { value: "", visible: false };
}

// Builds a fresh, empty results tree matching STATE_CONFIG
function buildEmptyState() {
  const state = {};
  STATE_CONFIG.forEach(s => {
    state[s.key] = {};
    s.fields.forEach(f => { state[s.key][f.key] = emptyField(); });
  });
  return state;
}

function buildEmptyDraw() {
  return {
    title: "Rezilta Tiraj FLORIDA",
    subtitle: "",
    pick3: { value: "", visible: false, revealedAt: 0 },
    pick4: { value: "", visible: false, revealedAt: 0 }
  };
}

function buildDefaultMeta() {
  return {
    animate: true,
    bgMode: "transparent", // "transparent" or "full"
    bgColor1: "#0e1b33",   // top color of the full-background gradient
    bgColor2: "#060b16",   // bottom color of the full-background gradient
    logoUrl: "",
    awelLogoUrl: "",
    liveOn: true
  };
}
