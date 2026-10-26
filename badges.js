import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const st = document.createElement("style");
st.textContent = "nav button.has-new::after{content:'';display:inline-block;width:9px;height:9px;margin-left:6px;border-radius:50%;background:#f2b632;box-shadow:0 0 0 2px rgba(242,182,50,.35);vertical-align:super}";
document.head.appendChild(st);

const KEYS = { pawol: "seen_pawol", komunote: "seen_komunote", solidarite: "seen_solidarite" };
const latest = { pawol: 0, komunote: 0, solidarite: 0 };
let me = null;
let authReady = false;
let postsRaw = [];
let chatRaw = [];
let projMs = 0;
let updMs = 0;

function getSeen(k) {
  try {
    const v = localStorage.getItem(KEYS[k]);
    return v === null ? null : Number(v);
  } catch (e) { return null; }
}
function setSeen(k, v) {
  try { localStorage.setItem(KEYS[k], String(v)); } catch (e) {}
}
function btn(k) { return document.querySelector('nav button[data-page="' + k + '"]'); }
function isActive(k) {
  const s = document.getElementById(k);
  return !!(s && s.classList.contains("active"));
}
function isAdmin() { return !!(me && me.uid === ADMIN_UID); }

function refresh(k) {
  const b = btn(k);
  if (!b || !authReady) return;
  const l = latest[k];
  if (!l) { b.classList.remove("has-new"); return; }
  let seen = getSeen(k);
  if (seen === null) { setSeen(k, l); seen = l; }
  if (isActive(k) || (isAdmin() && k !== "komunote")) {
    if (l > seen) setSeen(k, l);
    b.classList.remove("has-new");
    return;
  }
  b.classList.toggle("has-new", l > seen);
}
function refreshAll() { refresh("pawol"); refresh("komunote"); refresh("solidarite"); }

function recomputePosts() {
  let m = 0;
  postsRaw.concat(chatRaw).forEach(function (p) {
    if (!me || p.uid !== me.uid) { if (p.ms > m) m = p.ms; }
  });
  latest.komunote = m;
  refresh("komunote");
}
function recomputeSol() {
  latest.solidarite = Math.max(projMs, updMs);
  refresh("solidarite");
}
function today() {
  const n = new Date();
  const p = function (x) { return String(x).padStart(2, "0"); };
  return n.getFullYear() + "-" + p(n.getMonth() + 1) + "-" + p(n.getDate());
}
function ms(ts) { return ts && ts.toMillis ? ts.toMillis() : 0; }

Object.keys(KEYS).forEach(function (k) {
  const b = btn(k);
  if (!b) return;
  b.addEventListener("click", function () {
    if (latest[k]) setSeen(k, latest[k]);
    b.classList.remove("has-new");
  });
});

onAuthStateChanged(auth, function (u) {
  me = u;
  authReady = true;
  recomputePosts();
  refreshAll();
});

onSnapshot(
  query(collection(db, "pawol"), where("date", "<=", today()), orderBy("date", "desc"), limit(1)),
  function (snap) {
    let v = 0;
    snap.forEach(function (d) { v = Number(String(d.data().date || "").replace(/-/g, "")) || 0; });
    latest.pawol = v;
    refresh("pawol");
  },
  function () {}
);

onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30)),
  function (snap) {
    postsRaw = snap.docs.map(function (d) {
      const x = d.data({ serverTimestamps: "estimate" });
      return { uid: x.uid, ms: ms(x.createdAt) };
    });
    recomputePosts();
  },
  function () {}
);

onSnapshot(
  query(collection(db, "chat"), orderBy("createdAt", "desc"), limit(30)),
  function (snap) {
    chatRaw = snap.docs.map(function (d) {
      const x = d.data({ serverTimestamps: "estimate" });
      return { uid: x.uid, ms: ms(x.createdAt) };
    });
    recomputePosts();
  },
  function () {}
);
  onSnapshot(
  query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(5)),
  function (snap) {
    let m = 0;
    snap.forEach(function (d) { const v = ms(d.data({ serverTimestamps: "estimate" }).createdAt); if (v > m) m = v; });
    projMs = m;
    recomputeSol();
  },
  function () {}
);

onSnapshot(
  query(collection(db, "updates"), orderBy("createdAt", "desc"), limit(5)),
  function (snap) {
    let m = 0;
    snap.forEach(function (d) { const v = ms(d.data({ serverTimestamps: "estimate" }).createdAt); if (v > m) m = v; });
    updMs = m;
    recomputeSol();
  },
  function () {}
);
