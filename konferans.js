// konferans.js — Sal konferans odyo/videyo (Jitsi) pou manb ki konekte sèlman
import { getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot,
  doc, getDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const JITSI_DOMAIN = "meet.jit.si"; // pita ou ka chanje pou "8x8.vc" si bezwen

const TX = {
  ht: { title: "Konferans", sub: "Sal odyo ak videyo", newRoom: "Nouvo sal", name: "Non randevou a", desc: "Deskripsyon (opsyonèl)", when: "Dat ak lè", create: "Kreye sal la", cancel: "Anile", empty: "Pa gen sal pou kounye a.", join: "Antre", joinAudio: "Odyo sèlman", joinVideo: "Odyo + videyo", close: "Fèmen sal la", reopen: "Rouvri", del: "Efase", closed: "Fèmen", by: "Pa", login: "Konekte w nan Kominote a anvan pou w ka itilize Konferans lan.", leave: "Soti", newTab: "Louvri nan yon lòt paj", needName: "Mete non randevou a ak dat la.", confirmDel: "Efase sal sa a?", rooms: "Sal yo", open: "Louvri" },
  fr: { title: "Conférence", sub: "Salles audio et vidéo", newRoom: "Nouvelle salle", name: "Nom du rendez-vous", desc: "Description (facultatif)", when: "Date et heure", create: "Créer la salle", cancel: "Annuler", empty: "Aucune salle pour le moment.", join: "Rejoindre", joinAudio: "Audio seulement", joinVideo: "Audio + vidéo", close: "Fermer la salle", reopen: "Rouvrir", del: "Supprimer", closed: "Fermée", by: "Par", login: "Connectez-vous dans Communauté avant d'utiliser la Conférence.", leave: "Quitter", newTab: "Ouvrir dans un autre onglet", needName: "Indiquez le nom et la date.", confirmDel: "Supprimer cette salle ?", rooms: "Salles", open: "Ouverte" },
  en: { title: "Conference", sub: "Audio and video rooms", newRoom: "New room", name: "Meeting name", desc: "Description (optional)", when: "Date and time", create: "Create room", cancel: "Cancel", empty: "No rooms yet.", join: "Join", joinAudio: "Audio only", joinVideo: "Audio + video", close: "Close room", reopen: "Reopen", del: "Delete", closed: "Closed", by: "By", login: "Please log in via Community before using Conference.", leave: "Leave", newTab: "Open in another tab", needName: "Enter a name and date.", confirmDel: "Delete this room?", rooms: "Rooms", open: "Open" },
  es: { title: "Conferencia", sub: "Salas de audio y video", newRoom: "Nueva sala", name: "Nombre de la reunión", desc: "Descripción (opcional)", when: "Fecha y hora", create: "Crear sala", cancel: "Cancelar", empty: "Aún no hay salas.", join: "Entrar", joinAudio: "Solo audio", joinVideo: "Audio + video", close: "Cerrar sala", reopen: "Reabrir", del: "Eliminar", closed: "Cerrada", by: "Por", login: "Inicia sesión en Comunidad antes de usar Conferencia.", leave: "Salir", newTab: "Abrir en otra pestaña", needName: "Escribe el nombre y la fecha.", confirmDel: "¿Eliminar esta sala?", rooms: "Salas", open: "Abierta" }
};
const L = () => { try { return TX[localStorage.getItem("lang")] || TX.ht; } catch (e) { return TX.ht; } };

let db, auth, user = null, rooms = [], unsub = null, api = null, wired = false;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

function waitApp(cb, tries = 0) {
  if (getApps().length) { cb(getApp()); return; }
  if (tries > 60) return;
  setTimeout(() => waitApp(cb, tries + 1), 250);
}

function buildUI() {
  const fab = el("button", "kf-fab", "🎙️");
  fab.id = "kf-fab"; fab.setAttribute("aria-label", "Konferans");
  fab.onclick = openPanel;
  document.body.appendChild(fab);

  const p = el("div", "kf-panel"); p.id = "kf-panel"; p.hidden = true;
  p.innerHTML = `
    <div class="kf-head">
      <div><div class="kf-title" id="kf-title"></div><div class="kf-sub" id="kf-sub"></div></div>
      <button class="kf-x" id="kf-x" aria-label="X">✕</button>
    </div>
    <div class="kf-body" id="kf-body"></div>
    <div class="kf-call" id="kf-call" hidden>
      <div class="kf-callbar">
        <button class="kf-btn kf-danger" id="kf-leave"></button>
        <a class="kf-btn kf-ghost" id="kf-tab" target="_blank" rel="noopener"></a>
      </div>
      <div class="kf-frame" id="kf-frame"></div>
    </div>`;
  document.body.appendChild(p);
  $("kf-x").onclick = closePanel;
  $("kf-leave").onclick = leaveCall;
}

function openPanel() { $("kf-panel").hidden = false; document.body.classList.add("kf-lock"); render(); }
function closePanel() { leaveCall(); $("kf-panel").hidden = true; document.body.classList.remove("kf-lock"); }

function fmtDate(v) {
  try { return new Date(v).toLocaleString(localStorage.getItem("lang") || "ht", { dateStyle: "medium", timeStyle: "short" }); }
  catch (e) { return v; }
}

function render() {
  const t = L();
  $("kf-title").textContent = "🎙️ " + t.title;
  $("kf-sub").textContent = t.sub;
  const body = $("kf-body"); body.innerHTML = "";
  if (!user) { body.appendChild(el("p", "kf-note", t.login)); return; }

  const nb = el("button", "kf-btn kf-gold", "＋ " + t.newRoom);
  nb.onclick = () => form.hidden = !form.hidden;
  body.appendChild(nb);

  const form = el("div", "kf-form"); form.hidden = true;
  const i1 = el("input"); i1.maxLength = 80; i1.placeholder = t.name;
  const i2 = el("textarea"); i2.maxLength = 300; i2.rows = 2; i2.placeholder = t.desc;
  const i3 = el("input"); i3.type = "datetime-local";
  const row = el("div", "kf-row");
  const ok = el("button", "kf-btn kf-gold", t.create);
  const no = el("button", "kf-btn kf-ghost", t.cancel); no.onclick = () => form.hidden = true;
  ok.onclick = async () => {
    if (!i1.value.trim() || !i3.value) { alert(t.needName); return; }
    ok.disabled = true;
    try {
      const rid = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await addDoc(collection(db, "konferans"), {
        titre: i1.value.trim().slice(0, 80),
        description: i2.value.trim().slice(0, 300),
        date: new Date(i3.value).toISOString(),
        roomId: rid,
        status: "open",
        createdBy: user.uid,
        createdByName: await myName(),
        createdAt: serverTimestamp()
      });
      i1.value = ""; i2.value = ""; i3.value = ""; form.hidden = true;
    } catch (e) { alert("Erè: " + (e.code || e.message)); }
    ok.disabled = false;
  };
  row.append(ok, no);
  form.append(i1, i2, i3, row);
  body.appendChild(form);

  body.appendChild(el("h3", "kf-h", t.rooms));
  if (!rooms.length) body.appendChild(el("p", "kf-note", t.empty));
  rooms.forEach((r) => body.appendChild(card(r, t)));
}

function card(r, t) {
  const isAdmin = user && user.uid === ADMIN_UID;
  const mine = user && r.createdBy === user.uid;
  const c = el("div", "kf-card" + (r.status === "closed" ? " is-closed" : ""));
  c.appendChild(el("div", "kf-ctitle", r.titre));
  c.appendChild(el("div", "kf-cdate", "📅 " + fmtDate(r.date) + " · " + (r.status === "closed" ? t.closed : t.open)));
  if (r.description) c.appendChild(el("div", "kf-cdesc", r.description));
  c.appendChild(el("div", "kf-cby", t.by + " " + (r.createdByName || "—")));
  const act = el("div", "kf-row");
  if (r.status !== "closed") {
    const a = el("button", "kf-btn kf-gold", "🎧 " + t.joinAudio); a.onclick = () => join(r, false);
    const v = el("button", "kf-btn kf-dark", "🎥 " + t.joinVideo); v.onclick = () => join(r, true);
    act.append(a, v);
  }
  if (isAdmin || mine) {
    const cl = el("button", "kf-btn kf-ghost", r.status === "closed" ? t.reopen : t.close);
    cl.onclick = () => updateDoc(doc(db, "konferans", r.id), { status: r.status === "closed" ? "open" : "closed" }).catch(e => alert(e.code));
    const d = el("button", "kf-btn kf-danger", t.del);
    d.onclick = () => { if (confirm(t.confirmDel)) deleteDoc(doc(db, "konferans", r.id)).catch(e => alert(e.code)); };
    act.append(cl, d);
  }
  c.appendChild(act);
  return c;
}

async function myName() {
  let n = user.displayName || "";
  try {
    const s = await getDoc(doc(db, "profiles", user.uid));
    if (s.exists()) { const d = s.data(); n = d.name || d.displayName || d.non || d.nom || n; }
  } catch (e) {}
  return (n || (user.email || "Manb").split("@")[0]).slice(0, 40);
}

function loadJitsi() {
  return new Promise((res, rej) => {
    if (window.JitsiMeetExternalAPI) return res();
    const s = document.createElement("script");
    s.src = "https://" + JITSI_DOMAIN + "/external_api.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function join(r, withVideo) {
  const t = L();
  const room = "VATB-" + r.roomId;
  $("kf-body").hidden = true;
  $("kf-call").hidden = false;
  $("kf-leave").textContent = "⏻ " + t.leave;
  const tab = $("kf-tab"); tab.textContent = t.newTab; tab.href = "https://" + JITSI_DOMAIN + "/" + room;
  const frame = $("kf-frame"); frame.innerHTML = "";
  try {
    await loadJitsi();
    const name = await myName();
    api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: room,
      parentNode: frame,
      width: "100%", height: "100%",
      userInfo: { displayName: name, email: user.email || undefined },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: !withVideo,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        subject: r.titre
      },
      interfaceConfigOverwrite: { MOBILE_APP_PROMO: false }
    });
    api.addListener("readyToClose", leaveCall);
  } catch (e) {
    frame.appendChild(el("p", "kf-note", "Jitsi pa t ka chaje. Eseye bouton \"" + t.newTab + "\"."));
  }
}

function leaveCall() {
  try { if (api) api.dispose(); } catch (e) {}
  api = null;
  const c = $("kf-call"), b = $("kf-body");
  if (c) { c.hidden = true; $("kf-frame").innerHTML = ""; }
  if (b) b.hidden = false;
}

function listen() {
  if (unsub) { unsub(); unsub = null; }
  rooms = [];
  if (!user) { render(); return; }
  const q = query(collection(db, "konferans"), orderBy("date", "desc"), limit(50));
  unsub = onSnapshot(q, (snap) => {
    rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!$("kf-panel").hidden && $("kf-call").hidden) render();
  }, () => { rooms = []; });
  render();
}

buildUI();
waitApp((app) => {
  db = getFirestore(app); auth = getAuth(app);
  onAuthStateChanged(auth, (u) => { user = u; listen(); });
});
