import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, doc, getDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const root = document.getElementById("pawol-content");

const L = {
  ht: { today: "Vèsè jounen an", reflexion: "Refleksyon", priye: "Lapriyè", archives: "Achiv",
        empty: "Pa gen pawòl pibliye pou kounye a.", error: "Pa kapab chaje kontni an.",
        loading: "Chajman...", wa: "WhatsApp", fb: "Facebook" },
  fr: { today: "Verset de la journée", reflexion: "Réflexion", priye: "Prière", archives: "Archives",
        empty: "Aucune parole publiée pour le moment.", error: "Impossible de charger le contenu.",
        loading: "Chargement...", wa: "WhatsApp", fb: "Facebook" },
  en: { today: "Verse of the day", reflexion: "Reflection", priye: "Prayer", archives: "Archives",
        empty: "No verse published yet.", error: "Unable to load content.",
        loading: "Loading...", wa: "WhatsApp", fb: "Facebook" },
  es: { today: "Versículo del día", reflexion: "Reflexión", priye: "Oración", archives: "Archivos",
        empty: "Aún no hay versículos publicados.", error: "No se pudo cargar el contenido.",
        loading: "Cargando...", wa: "WhatsApp", fb: "Facebook" }
};

let docs = [];
let state = "loading";
const photoCache = {};
const photoPending = {};

function lang() {
  let l = "ht";
  try { l = localStorage.getItem("lang") || "ht"; } catch (e) {}
  return L[l] ? l : "ht";
}
function pick(d, f) {
  const l = lang();
  const suffix = l === "ht" ? "" : "_" + l;
  return d[f + suffix] || d[f] || "";
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function localDate() {
  const n = new Date();
  const p = function (x) { return String(x).padStart(2, "0"); };
  return n.getFullYear() + "-" + p(n.getMonth() + 1) + "-" + p(n.getDate());
}

function needPhoto(d) { return !!(d && d.photo && d.date); }
function fetchPhoto(d, done) {
  const k = "verse_" + d.date;
  if (photoCache[k] !== undefined) { done(photoCache[k]); return; }
  if (photoPending[k]) { photoPending[k].push(done); return; }
  photoPending[k] = [done];
  getDoc(doc(db, "media", k)).then(function (snap) {
    photoCache[k] = snap.exists() && snap.data().data ? "data:image/jpeg;base64," + snap.data().data : "";
  }).catch(function () {
    photoCache[k] = "";
  }).then(function () {
    const list = photoPending[k] || [];
    delete photoPending[k];
    list.forEach(function (fn) { fn(photoCache[k]); });
  });
}
function photoEl(d) {
  const im = el("img", "vphoto");
  im.alt = "";
  im.style.display = "none";
  fetchPhoto(d, function (src) {
    if (src) { im.src = src; im.style.display = "block"; }
  });
  return im;
}

function renderHome() {
  const h = document.getElementById("akey-verse");
  if (!h) return;
  const t = L[lang()];
  h.textContent = "";
  if (state !== "ok" || !docs.length) return;
  const d = docs[0];
  const card = el("div", "card");
  if (needPhoto(d)) card.appendChild(photoEl(d));
  card.appendChild(el("div", "ref", t.today + " · " + (d.reference || "")));
  card.appendChild(el("p", "verse", pick(d, "verset")));
  h.appendChild(card);
}

function render() {
  renderHome();
  const t = L[lang()];
  root.textContent = "";
  if (state === "loading") { root.appendChild(el("p", "", t.loading)); return; }
  if (state === "error") { root.appendChild(el("p", "", t.error)); return; }
  if (!docs.length) { root.appendChild(el("p", "", t.empty)); return; }

  const d = docs[0];
  const card = el("div", "card");
  if (needPhoto(d)) card.appendChild(photoEl(d));
  card.appendChild(el("div", "ref", t.today + " · " + (d.reference || "")));
  card.appendChild(el("p", "verse", pick(d, "verset")));
  if (pick(d, "reflexion")) {
    card.appendChild(el("h3", "", t.reflexion));
    card.appendChild(el("p", "", pick(d, "reflexion")));
  }
  if (pick(d, "priye")) {
    card.appendChild(el("h3", "", t.priye));
    card.appendChild(el("p", "", pick(d, "priye")));
  }
  const text = pick(d, "verset") + " (" + (d.reference || "") + ") - Voyager à travers la Bible";
  const share = el("div", "share");
  const wa = el("a", "", t.wa);
  wa.href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + location.origin);
  wa.target = "_blank"; wa.rel = "noopener";
  const fb = el("a", "", t.fb);
  fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(location.origin);
  fb.target = "_blank"; fb.rel = "noopener";
  share.appendChild(wa); share.appendChild(fb);
  card.appendChild(share);
  root.appendChild(card);

  if (docs.length > 1) {
    const arch = el("div", "archives");
    arch.appendChild(el("h3", "", t.archives));
    docs.slice(1).forEach(function (a) {
      const det = document.createElement("details");
      const sm = el("summary", "", (a.date || "") + " · " + (a.reference || ""));
      det.appendChild(sm);
      det.appendChild(el("p", "verse", pick(a, "verset")));
      if (pick(a, "reflexion")) det.appendChild(el("p", "", pick(a, "reflexion")));
      if (pick(a, "priye")) det.appendChild(el("p", "", pick(a, "priye")));
      if (needPhoto(a)) {
        det.addEventListener("toggle", function () {
          if (det.open && !det.querySelector("img")) det.insertBefore(photoEl(a), sm.nextSibling);
        });
      }
      arch.appendChild(det);
    });
    root.appendChild(arch);
  }
}

async function load() {
  render();
  try {
    const q = query(collection(db, "pawol"), where("date", "<=", localDate()), orderBy("date", "desc"), limit(30));
    const snap = await getDocs(q);
    docs = snap.docs.map(function (x) { return x.data(); });
    state = "ok";
  } catch (e) {
    state = "error";
  }
  render();
}

document.getElementById("lang-btn").addEventListener("click", render);
load();
