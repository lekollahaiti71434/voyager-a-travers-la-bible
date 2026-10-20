import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, getDoc, setDoc, writeBatch, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const MAX = 1000;
const MAX_SEC = 300;
const MAX_BYTES = 700000;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("komunote-content");

const L = {
  ht: { login: "Konekte", signup: "Kreye yon kont", name: "Non ou", email: "Imèl", password: "Modpas (omwen 6 karaktè)",
        toSignup: "Ou poko gen kont? Kreye youn", toLogin: "Ou deja gen kont? Konekte", forgot: "Bliye modpas?",
        logout: "Soti", hello: "Bonjou", placeholder: "Ekri yon mesaj...", send: "Voye", left: "karaktè rete",
        del: "Efase", confirmDel: "Efase mesaj sa a?", empty: "Poko gen mesaj. Se ou ki ka kòmanse!",
        bad: "Imèl oswa modpas pa bon.", used: "Imèl sa a deja itilize.", weak: "Modpas la two kout (omwen 6 karaktè).",
        badEmail: "Imèl la pa valid.", nameReq: "Mete non ou (2 a 40 karaktè).", generic: "Yon erè rive. Eseye ankò.",
        enterEmail: "Mete imèl ou anwo a dabò.", resetSent: "Nou voye yon lyen nan imèl ou pou chanje modpas la.",
        loading: "Chajman...", today: "Jodi a", yesterday: "Yè",
        mic: "Anrejistre yon vokal", cancel: "Anile", discard: "Jete vokal la",
        micDenied: "Mikwofòn lan bloke. Otorize l nan paramèt navigatè a.",
        micUnsupported: "Anrejistreman vokal pa sipòte sou aparèy sa a.",
        tooBig: "Vokal la two lou. Eseye yon vokal pi kout.", playErr: "Pa kapab jwe vokal la." },
  fr: { login: "Se connecter", signup: "Créer un compte", name: "Votre nom", email: "E-mail", password: "Mot de passe (6 caractères min.)",
        toSignup: "Pas encore de compte ? Créez-en un", toLogin: "Déjà un compte ? Connectez-vous", forgot: "Mot de passe oublié ?",
        logout: "Déconnexion", hello: "Bonjour", placeholder: "Écrivez un message...", send: "Envoyer", left: "caractères restants",
        del: "Supprimer", confirmDel: "Supprimer ce message ?", empty: "Aucun message. Soyez le premier !",
        bad: "E-mail ou mot de passe incorrect.", used: "Cet e-mail est déjà utilisé.", weak: "Mot de passe trop court (6 caractères min.).",
        badEmail: "E-mail invalide.", nameReq: "Entrez votre nom (2 à 40 caractères).", generic: "Une erreur est survenue. Réessayez.",
        enterEmail: "Entrez d'abord votre e-mail ci-dessus.", resetSent: "Un lien pour changer le mot de passe a été envoyé à votre e-mail.",
        loading: "Chargement...", today: "Aujourd'hui", yesterday: "Hier",
        mic: "Enregistrer un vocal", cancel: "Annuler", discard: "Supprimer le vocal",
        micDenied: "Micro bloqué. Autorisez-le dans les paramètres du navigateur.",
        micUnsupported: "L'enregistrement vocal n'est pas pris en charge sur cet appareil.",
        tooBig: "Le vocal est trop lourd. Essayez un vocal plus court.", playErr: "Impossible de lire le vocal." },
  en: { login: "Log in", signup: "Create an account", name: "Your name", email: "Email", password: "Password (min. 6 characters)",
        toSignup: "No account yet? Create one", toLogin: "Already have an account? Log in", forgot: "Forgot password?",
        logout: "Log out", hello: "Hello", placeholder: "Write a message...", send: "Send", left: "characters left",
        del: "Delete", confirmDel: "Delete this message?", empty: "No messages yet. Be the first!",
        bad: "Wrong email or password.", used: "This email is already in use.", weak: "Password too short (min. 6 characters).",
        badEmail: "Invalid email.", nameReq: "Enter your name (2 to 40 characters).", generic: "Something went wrong. Try again.",
        enterEmail: "Enter your email above first.", resetSent: "A password reset link was sent to your email.",
        loading: "Loading...", today: "Today", yesterday: "Yesterday",
        mic: "Record a voice message", cancel: "Cancel", discard: "Discard voice message",
        micDenied: "Microphone blocked. Allow it in your browser settings.",
        micUnsupported: "Voice recording is not supported on this device.",
        tooBig: "Voice message too large. Try a shorter one.", playErr: "Unable to play the voice message." },
  es: { login: "Iniciar sesión", signup: "Crear una cuenta", name: "Tu nombre", email: "Correo", password: "Contraseña (mín. 6 caracteres)",
        toSignup: "¿Aún no tienes cuenta? Crea una", toLogin: "¿Ya tienes cuenta? Inicia sesión", forgot: "¿Olvidaste tu contraseña?",
        logout: "Salir", hello: "Hola", placeholder: "Escribe un mensaje...", send: "Enviar", left: "caracteres restantes",
        del: "Eliminar", confirmDel: "¿Eliminar este mensaje?", empty: "Aún no hay mensajes. ¡Sé el primero!",
        bad: "Correo o contraseña incorrectos.", used: "Este correo ya está en uso.", weak: "Contraseña muy corta (mín. 6 caracteres).",
        badEmail: "Correo no válido.", nameReq: "Escribe tu nombre (2 a 40 caracteres).", generic: "Ocurrió un error. Inténtalo de nuevo.",
        enterEmail: "Escribe primero tu correo arriba.", resetSent: "Enviamos un enlace a tu correo para cambiar la contraseña.",
        loading: "Cargando...", today: "Hoy", yesterday: "Ayer",
        mic: "Grabar un audio", cancel: "Cancelar", discard: "Descartar audio",
        micDenied: "Micrófono bloqueado. Permítelo en los ajustes del navegador.",
        micUnsupported: "La grabación de audio no es compatible con este dispositivo.",
        tooBig: "El audio es demasiado pesado. Prueba uno más corto.", playErr: "No se pudo reproducir el audio." }
};

const COLORS = ["#b5651d", "#2a7a8c", "#8e44ad", "#c0392b", "#27ae60", "#2c3e50", "#d35400"];
const RP = {
  ht: { report: "Siyale", confirmReport: "Siyale mesaj sa a bay administratè a?", reported: "Siyale ✓" },
  fr: { report: "Signaler", confirmReport: "Signaler ce message à l'administrateur ?", reported: "Signalé ✓" },
  en: { report: "Report", confirmReport: "Report this message to the administrator?", reported: "Reported ✓" },
  es: { report: "Denunciar", confirmReport: "¿Denunciar este mensaje al administrador?", reported: "Denunciado ✓" }
};
const reportedIds = {};

let mode = "login";
let user = null;
let posts = [];
let draft = "";
let note = "";
let info = "";
let loaded = false;
let forceScroll = true;

const rec = { state: "idle", mr: null, stream: null, chunks: [], t0: 0, tick: null, blob: null, url: "", dur: 0, mime: "", err: "" };
const cache = {};
let cur = { id: null, audio: null, loading: false };

function lang() {
  let l = "ht";
  try { l = localStorage.getItem("lang") || "ht"; } catch (e) {}
  return L[l] ? l : "ht";
}
function loc() { return lang() === "ht" ? "fr" : lang(); }
function t() { return L[lang()]; }
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function input(type, placeholder, auto) {
  const i = document.createElement("input");
  i.type = type;
  i.placeholder = placeholder;
  i.autocomplete = auto;
  return i;
}
function fmt(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}
function errText(e) {
  const s = t();
  const c = e && e.code;
  if (c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") return s.bad;
  if (c === "auth/email-already-in-use") return s.used;
  if (c === "auth/weak-password") return s.weak;
  if (c === "auth/invalid-email") return s.badEmail;
  return s.generic;
}
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return COLORS[h % COLORS.length];
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayLabel(d) {
  const s = t();
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return s.today;
  if (sameDay(d, y)) return s.yesterday;
  return d.toLocaleDateString(loc(), { day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Vokal: anrejistreman ---------- */
function pickMime() {
  if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
  const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (let i = 0; i < c.length; i++) {
    if (MediaRecorder.isTypeSupported(c[i])) return c[i];
  }
  return "";
}
function stopStream() {
  if (rec.stream) {
    rec.stream.getTracks().forEach(function (tr) { tr.stop(); });
    rec.stream = null;
  }
}
function resetRec() {
  clearInterval(rec.tick);
  stopStream();
  if (rec.url) { try { URL.revokeObjectURL(rec.url); } catch (e) {} }
  rec.state = "idle"; rec.mr = null; rec.chunks = []; rec.blob = null; rec.url = ""; rec.dur = 0; rec.mime = "";
}
function tickUI() {
  const e = bottom.querySelector(".krectime");
  if (!e) return;
  const sec = Math.min(MAX_SEC, (Date.now() - rec.t0) / 1000);
  e.textContent = fmt(sec) + " / " + fmt(MAX_SEC);
}
async function startRec() {
  const s = t();
  rec.err = "";
  const mime = pickMime();
  if (mime === null) { rec.err = s.micUnsupported; renderBottom(); return; }
  try {
    rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) { rec.err = s.micDenied; renderBottom(); return; }
  rec.chunks = [];
  const opts = { audioBitsPerSecond: 16000 };
  if (mime) opts.mimeType = mime;
  try {
    rec.mr = new MediaRecorder(rec.stream, opts);
  } catch (e) {
    stopStream();
    rec.err = s.micUnsupported;
    renderBottom();
    return;
  }
  const mr = rec.mr;
  mr.ondataavailable = function (ev) { if (ev.data && ev.data.size) rec.chunks.push(ev.data); };
  mr.onstop = function () {
    stopStream();
    if (rec.state !== "stopping") return;
    if (rec.dur < 1) { resetRec(); renderBottom(); return; }
    const type = mr.mimeType || mime || "audio/webm";
    rec.blob = new Blob(rec.chunks, { type: type });
    rec.mime = type;
    rec.url = URL.createObjectURL(rec.blob);
    rec.state = "review";
    renderBottom();
  };
  rec.state = "recording";
  rec.t0 = Date.now();
  mr.start(1000);
  rec.tick = setInterval(function () {
    tickUI();
    if ((Date.now() - rec.t0) / 1000 >= MAX_SEC) stopRec();
  }, 250);
  renderBottom();
}
function stopRec() {
  if (rec.state !== "recording") return;
  clearInterval(rec.tick);
  rec.dur = Math.min(MAX_SEC, (Date.now() - rec.t0) / 1000);
  rec.state = "stopping";
  try { rec.mr.stop(); } catch (e) { resetRec(); renderBottom(); }
}
function cancelRec() {
  clearInterval(rec.tick);
  const mr = rec.mr;
  rec.state = "idle";
  try { if (mr && mr.state !== "inactive") mr.stop(); } catch (e) {}
  resetRec();
  renderBottom();
}
function blobToB64(blob) {
  return new Promise(function (res, rej) {
    const r = new FileReader();
    r.onload = function () { res(String(r.result).split(",")[1] || ""); };
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}
async function sendVoice() {
  const s = t();
  if (!rec.blob || !user || rec.state !== "review") return;
  if (rec.blob.size > MAX_BYTES) { rec.err = s.tooBig; renderBottom(); return; }
  rec.state = "sending";
  rec.err = "";
  renderBottom();
  try {
    const b64 = await blobToB64(rec.blob);
    const postRef = doc(collection(db, "posts"));
    const batch = writeBatch(db);
    batch.set(doc(db, "audios", postRef.id), {
      uid: user.uid,
      mime: rec.mime,
      audio: b64,
      createdAt: serverTimestamp()
    });
    batch.set(postRef, {
      uid: user.uid,
      name: (user.displayName || "").slice(0, 40) || "?",
      type: "voice",
      duration: Math.max(1, Math.round(rec.dur * 10) / 10),
      createdAt: serverTimestamp()
    });
    forceScroll = true;
    await batch.commit();
    resetRec();
  } catch (e) {
    rec.state = "review";
    rec.err = s.generic;
  }
  renderBottom();
}

/* ---------- Vokal: lekti ---------- */
function refreshVoice() {
  feed.querySelectorAll(".kplay").forEach(function (b) {
    const on = cur.id === b.dataset.id;
    b.textContent = on && cur.loading ? "…" : (on && cur.audio && !cur.audio.paused ? "⏸" : "▶");
  });
  feed.querySelectorAll(".kvtime").forEach(function (sp) {
    const d = Number(sp.dataset.dur) || 0;
    const on = cur.id === sp.dataset.id && cur.audio;
    sp.textContent = on ? fmt(cur.audio.currentTime) + " / " + fmt(d) : fmt(d);
  });
  feed.querySelectorAll(".kprog i").forEach(function (bar) {
    const sp = bar.parentNode.parentNode.querySelector(".kvtime");
    const d = Number(sp && sp.dataset.dur) || 0;
    const on = cur.id === bar.dataset.id && cur.audio && d > 0;
    bar.style.width = on ? Math.min(100, (cur.audio.currentTime / d) * 100) + "%" : "0";
  });
}
async function togglePlay(p) {
  const s = t();
  if (cur.id === p.id && cur.audio) {
    if (cur.audio.paused) cur.audio.play().catch(function () {});
    else cur.audio.pause();
    refreshVoice();
    return;
  }
  if (cur.audio) cur.audio.pause();
  cur = { id: p.id, audio: null, loading: true };
  refreshVoice();
  try {
    let src = cache[p.id];
    if (!src) {
      const snap = await getDoc(doc(db, "audios", p.id));
      if (!snap.exists()) throw new Error("none");
      const d = snap.data();
      src = "data:" + String(d.mime || "audio/webm").split(";")[0] + ";base64," + d.audio;
      cache[p.id] = src;
    }
    if (cur.id !== p.id) return;
    const a = new Audio(src);
    cur.audio = a;
    cur.loading = false;
    a.addEventListener("timeupdate", refreshVoice);
    a.addEventListener("play", refreshVoice);
    a.addEventListener("pause", refreshVoice);
    a.addEventListener("ended", function () { a.currentTime = 0; refreshVoice(); });
    await a.play();
  } catch (e) {
    cur = { id: null, audio: null, loading: false };
    refreshVoice();
    alert(s.playErr);
  }
}

/* ---------- Paj la ---------- */
const top = el("div", "ktop");
const feed = el("div", "kfeed");
const bottom = el("div", "kbottom");
root.appendChild(top);
root.appendChild(feed);
root.appendChild(bottom);

function renderTop() {
  const s = t();
  top.textContent = "";
  root.classList.toggle("kout", !user);

  if (!user) {
    top.appendChild(el("h3", "", mode === "login" ? s.login : s.signup));
    const form = el("div", "kform");
    let nameI = null;
    if (mode === "signup") {
      nameI = input("text", s.name, "name");
      nameI.maxLength = 40;
      form.appendChild(nameI);
    }
    const emailI = input("email", s.email, "username");
    const passI = input("password", s.password, mode === "login" ? "current-password" : "new-password");
    form.appendChild(emailI);
    form.appendChild(passI);
    top.appendChild(form);

    const go = el("button", "kbtn", mode === "login" ? s.login : s.signup);
    go.type = "button";
    go.onclick = async function () {
      note = ""; info = "";
      const email = emailI.value.trim();
      const pass = passI.value;
      try {
        if (mode === "signup") {
          const name = nameI.value.trim();
          if (name.length < 2 || name.length > 40) { note = s.nameReq; renderTop(); return; }
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          await updateProfile(cred.user, { displayName: name });
          user = auth.currentUser;
          forceScroll = true;
          renderTop(); renderBottom(); renderFeed();
        } else {
          await signInWithEmailAndPassword(auth, email, pass);
        }
      } catch (e) {
        note = errText(e);
        renderTop();
      }
    };
    top.appendChild(go);

    if (mode === "login") {
      const fg = el("button", "klink", s.forgot);
      fg.type = "button";
      fg.onclick = async function () {
        note = ""; info = "";
        const email = emailI.value.trim();
        if (!email) { note = s.enterEmail; renderTop(); return; }
        try { await sendPasswordResetEmail(auth, email); info = s.resetSent; }
        catch (e) { note = errText(e); }
        renderTop();
      };
      top.appendChild(fg);
    }

    const sw = el("button", "klink", mode === "login" ? s.toSignup : s.toLogin);
    sw.type = "button";
    sw.onclick = function () { mode = mode === "login" ? "signup" : "login"; note = ""; info = ""; renderTop(); };
    top.appendChild(sw);

    if (note) top.appendChild(el("p", "knote", note));
    if (info) top.appendChild(el("p", "kinfo", info));
    return;
  }

  const bar = el("div", "kbar");
  bar.appendChild(el("div", "", s.hello + ", " + (user.displayName || "")));
  const out = el("button", "kbtn", s.logout);
  out.type = "button";
  out.style.margin = "0";
  out.onclick = function () { signOut(auth); };
  bar.appendChild(out);
  top.appendChild(bar);
}

function renderBottom() {
  const s = t();
  bottom.textContent = "";
  if (!user) return;

  if (rec.state === "recording" || rec.state === "stopping") {
    const row = el("div", "krec");
    row.appendChild(el("span", "krecdot"));
    row.appendChild(el("span", "krectime", "0:00 / " + fmt(MAX_SEC)));
    const c = el("button", "kmic", "✕");
    c.type = "button";
    c.setAttribute("aria-label", s.cancel);
    c.onclick = cancelRec;
    const st = el("button", "ksend", "■");
    st.type = "button";
    st.onclick = stopRec;
    row.appendChild(c);
    row.appendChild(st);
    bottom.appendChild(row);
    tickUI();
    return;
  }

  if (rec.state === "review" || rec.state === "sending") {
    const sending = rec.state === "sending";
    const row = el("div", "kreview");
    const d = el("button", "kmic", "🗑");
    d.type = "button";
    d.disabled = sending;
    d.setAttribute("aria-label", s.discard);
    d.onclick = function () { resetRec(); renderBottom(); };
    const au = document.createElement("audio");
    au.controls = true;
    au.src = rec.url;
    const sd = el("button", "ksend", sending ? "…" : "➤");
    sd.type = "button";
    sd.disabled = sending;
    sd.setAttribute("aria-label", s.send);
    sd.onclick = sendVoice;
    row.appendChild(d);
    row.appendChild(au);
    row.appendChild(sd);
    bottom.appendChild(row);
    if (rec.err) bottom.appendChild(el("p", "knote", rec.err));
    return;
  }

  const row = el("div", "kcomposer");
  const ta = document.createElement("textarea");
  ta.rows = 1;
  ta.maxLength = MAX;
  ta.placeholder = s.placeholder;
  ta.value = draft;
  const mic = el("button", "kmic", "🎤");
  mic.type = "button";
  mic.setAttribute("aria-label", s.mic);
  mic.onclick = startRec;
  const send = el("button", "ksend", "➤");
  send.type = "button";
  send.setAttribute("aria-label", s.send);
  row.appendChild(ta);
  row.appendChild(mic);
  row.appendChild(send);
  const line = el("div", "kcount");
  bottom.appendChild(row);
  bottom.appendChild(line);
  if (rec.err) bottom.appendChild(el("p", "knote", rec.err));

  function grow() {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }
  function upd() {
    const left = MAX - ta.value.length;
    line.className = "kcount";
    line.textContent = left <= 200 ? left + " " + s.left : "";
  }
  ta.addEventListener("input", function () { draft = ta.value; grow(); upd(); });
  setTimeout(grow, 0);
  upd();

  send.onclick = async function () {
    const text = ta.value.trim();
    if (!text || text.length > MAX) return;
    send.disabled = true;
    try {
      forceScroll = true;
      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        name: (user.displayName || "").slice(0, 40) || "?",
        type: "text",
        text: text,
        createdAt: serverTimestamp()
      });
      draft = "";
      ta.value = "";
      grow();
      upd();
    } catch (e) {
      line.className = "knote";
      line.textContent = s.generic;
    }
    send.disabled = false;
  };
}

function renderFeed() {
  const s = t();
  const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 150;
  feed.textContent = "";
  if (!loaded) { feed.appendChild(el("p", "", s.loading)); return; }
  if (!posts.length) { feed.appendChild(el("p", "", s.empty)); return; }

  let lastDay = null;
  posts.slice().reverse().forEach(function (p) {
    const dt = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate() : null;
    if (dt && (!lastDay || !sameDay(dt, lastDay))) {
      lastDay = dt;
      feed.appendChild(el("div", "kday", dayLabel(dt)));
    }
    const own = !!(user && user.uid === p.uid);
    const msg = el("div", "kmsg" + (own ? " own" : ""));
    if (!own) {
      const n = el("div", "kname", p.name || "?");
      n.style.color = colorFor(p.name || "?");
      msg.appendChild(n);
    }
    if (p.type === "voice") {
      const row = el("div", "kvoice");
      const pb = el("button", "kplay", "▶");
      pb.type = "button";
      pb.dataset.id = p.id;
      pb.onclick = function () { togglePlay(p); };
      const prog = el("div", "kprog");
      const bar = document.createElement("i");
      bar.dataset.id = p.id;
      prog.appendChild(bar);
      const tm = el("span", "kvtime");
      tm.dataset.id = p.id;
      tm.dataset.dur = String(p.duration || 0);
      row.appendChild(pb);
      row.appendChild(prog);
      row.appendChild(tm);
      msg.appendChild(row);
    } else {
      msg.appendChild(el("div", "ktext", p.text || ""));
    }
    const foot = el("div", "kfoot");
    if (user && (own || user.uid === ADMIN_UID)) {
      const d = el("button", "kdel", s.del);
      d.type = "button";
      d.onclick = async function () {
        if (!confirm(s.confirmDel)) return;
        try {
          if (p.type === "voice") {
            if (cur.id === p.id && cur.audio) cur.audio.pause();
            const b = writeBatch(db);
            b.delete(doc(db, "posts", p.id));
            b.delete(doc(db, "audios", p.id));
            await b.commit();
          } else {
            await deleteDoc(doc(db, "posts", p.id));
          }
        } catch (e) {}
      };
      foot.appendChild(d);
    }
    if (user && !own && user.uid !== ADMIN_UID) {
      const r = RP[lang()];
      const rb = el("button", "kdel", reportedIds[p.id] ? r.reported : r.report);
      rb.type = "button";
      rb.disabled = !!reportedIds[p.id];
      rb.onclick = async function () {
        if (!confirm(r.confirmReport)) return;
        try {
          await setDoc(doc(db, "reports", p.id + "_" + user.uid), {
            postId: p.id,
            postUid: p.uid,
            reporter: user.uid,
            createdAt: serverTimestamp()
          });
          reportedIds[p.id] = true;
          rb.textContent = r.reported;
          rb.disabled = true;
        } catch (e) {}
      };
      foot.appendChild(rb);
  }
    foot.appendChild(el("span", "", dt ? dt.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" }) : ""));
    msg.appendChild(foot);
    feed.appendChild(msg);
  });

  if (forceScroll || nearBottom) {
    feed.scrollTop = feed.scrollHeight;
    if (feed.clientHeight > 0) forceScroll = false;
  }
  refreshVoice();
}

onAuthStateChanged(auth, function (u) {
  user = u;
  note = ""; info = "";
  forceScroll = true;
  if (!u) {
    if (rec.state === "recording") cancelRec();
    else resetRec();
    if (cur.audio) cur.audio.pause();
    cur = { id: null, audio: null, loading: false };
  }
  renderTop();
  renderBottom();
  renderFeed();
});

onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)),
  function (snap) {
    posts = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }));
    });
    loaded = true;
    renderFeed();
  },
  function () {
    loaded = true;
    posts = [];
    renderFeed();
  }
);

document.getElementById("lang-btn").addEventListener("click", function () {
  renderTop();
  renderBottom();
  renderFeed();
});

const navK = document.querySelector('nav button[data-page="komunote"]');
if (navK) {
  navK.addEventListener("click", function () {
    forceScroll = true;
    setTimeout(function () { feed.scrollTop = feed.scrollHeight; forceScroll = false; }, 50);
  });
}

renderTop();
renderBottom();
renderFeed();
