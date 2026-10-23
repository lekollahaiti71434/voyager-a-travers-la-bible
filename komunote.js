import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const APP_URL = "https://voyager-a-travers-la-bible.vercel.app";
const MAX = 1000;
const MAX_CM = 500;
const MAX_SEC = 300;
const MAX_BYTES = 700000;
const CATS = ["testimony", "question", "prayer"];

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("komunote-content");

const L = {
  ht: { login: "Konekte", signup: "Kreye yon kont", name: "Non ou", email: "Imèl", password: "Modpas (omwen 6 karaktè)",
        toSignup: "Ou poko gen kont? Kreye youn", toLogin: "Ou deja gen kont? Konekte", forgot: "Bliye modpas?", logout: "Soti",
        bad: "Imèl oswa modpas pa bon.", used: "Imèl sa a deja itilize.", weak: "Modpas la two kout (omwen 6 karaktè).",
        badEmail: "Imèl la pa valid.", nameReq: "Mete non ou (2 a 40 karaktè).", generic: "Yon erè rive. Eseye ankò.",
        enterEmail: "Mete imèl ou anwo a dabò.", resetSent: "Nou voye yon lyen nan imèl ou pou chanje modpas la.", loading: "Chajman...",
        placeholder: "Ekri sa w vle pataje...", send: "Pibliye", left: "karaktè rete", del: "Efase",
        confirmDel: "Efase piblikasyon sa a?", empty: "Poko gen piblikasyon. Se ou ki ka kòmanse!",
        tNow: "Kounye a", tMin: "Gen {n} minit", tHour1: "Gen 1 èdtan", tHourN: "Gen {n} èdtan", tDay1: "Gen 1 jou", tDayN: "Gen {n} jou",
        mic: "Anrejistre yon vokal", cancel: "Anile", discard: "Jete",
        micDenied: "Mikwofòn lan bloke. Otorize l nan paramèt navigatè a.", micUnsupported: "Anrejistreman vokal pa sipòte sou aparèy sa a.",
        tooBig: "Vokal la two lou. Eseye yon vokal pi kout.", playErr: "Pa kapab jwe vokal la.",
        attach: "Voye yon foto", photoErr: "Foto a pa ka itilize. Eseye yon lòt.",
        all: "Tout", testimony: "Temwayaj", question: "Kesyon", prayer: "Lapriyè",
        newPost: "Nouvo piblikasyon", pickCat: "Chwazi yon kategori", catReq: "Chwazi yon kategori anvan ou pibliye.",
        needLogin: "Konekte pou patisipe.", comment: "Kòmantè", writeComment: "Ekri yon kòmantè...", noComments: "Poko gen kòmantè.",
        share: "Pataje", shareVoice: "Yon mesaj vokal nan Voyager à travers la Bible", sharePhoto: "Yon foto nan Voyager à travers la Bible",
        report: "Siyale", confirmReport: "Siyale piblikasyon sa a bay administratè a?", reported: "Siyale ✓",
        myProfile: "Pwofil", editTitle: "Modifye pwofil mwen", fullName: "Non konplè", bio: "Deskripsyon (opsyonèl)",
        bioPh: "Pale yon ti jan de ou...", choose: "Chwazi yon foto", removePhoto: "Retire foto a", save: "Anrejistre",
        close: "Fèmen", noBio: "Pa gen deskripsyon." },
  fr: { login: "Se connecter", signup: "Créer un compte", name: "Votre nom", email: "E-mail", password: "Mot de passe (6 caractères min.)",
        toSignup: "Pas encore de compte ? Créez-en un", toLogin: "Déjà un compte ? Connectez-vous", forgot: "Mot de passe oublié ?", logout: "Déconnexion",
        bad: "E-mail ou mot de passe incorrect.", used: "Cet e-mail est déjà utilisé.", weak: "Mot de passe trop court (6 caractères min.).",
        badEmail: "E-mail invalide.", nameReq: "Entrez votre nom (2 à 40 caractères).", generic: "Une erreur est survenue. Réessayez.",
        enterEmail: "Entrez d'abord votre e-mail ci-dessus.", resetSent: "Un lien pour changer le mot de passe a été envoyé à votre e-mail.", loading: "Chargement...",
        placeholder: "Écrivez ce que vous souhaitez partager...", send: "Publier", left: "caractères restants", del: "Supprimer",
        confirmDel: "Supprimer cette publication ?", empty: "Aucune publication. Soyez le premier !",
        tNow: "À l'instant", tMin: "Il y a {n} min", tHour1: "Il y a 1 heure", tHourN: "Il y a {n} heures", tDay1: "Il y a 1 jour", tDayN: "Il y a {n} jours",
        mic: "Enregistrer un vocal", cancel: "Annuler", discard: "Supprimer",
        micDenied: "Micro bloqué. Autorisez-le dans les paramètres du navigateur.", micUnsupported: "L'enregistrement vocal n'est pas pris en charge sur cet appareil.",
        tooBig: "Le vocal est trop lourd. Essayez un vocal plus court.", playErr: "Impossible de lire le vocal.",
        attach: "Envoyer une photo", photoErr: "Photo inutilisable. Essayez-en une autre.",
        all: "Tout", testimony: "Témoignages", question: "Questions", prayer: "Prière",
        newPost: "Nouvelle publication", pickCat: "Choisissez une catégorie", catReq: "Choisissez une catégorie avant de publier.",
        needLogin: "Connectez-vous pour participer.", comment: "Commentaire", writeComment: "Écrivez un commentaire...", noComments: "Aucun commentaire.",
        share: "Partager", shareVoice: "Un message vocal sur Voyager à travers la Bible", sharePhoto: "Une photo sur Voyager à travers la Bible",
        report: "Signaler", confirmReport: "Signaler cette publication à l'administrateur ?", reported: "Signalé ✓",
        myProfile: "Profil", editTitle: "Modifier mon profil", fullName: "Nom complet", bio: "Description (facultatif)",
        bioPh: "Parlez un peu de vous...", choose: "Choisir une photo", removePhoto: "Retirer la photo", save: "Enregistrer",
        close: "Fermer", noBio: "Aucune description." },
  en: { login: "Log in", signup: "Create an account", name: "Your name", email: "Email", password: "Password (min. 6 characters)",
        toSignup: "No account yet? Create one", toLogin: "Already have an account? Log in", forgot: "Forgot password?", logout: "Log out",
        bad: "Wrong email or password.", used: "This email is already in use.", weak: "Password too short (min. 6 characters).",
        badEmail: "Invalid email.", nameReq: "Enter your name (2 to 40 characters).", generic: "Something went wrong. Try again.",
        enterEmail: "Enter your email above first.", resetSent: "A password reset link was sent to your email.", loading: "Loading...",
        placeholder: "Write what you'd like to share...", send: "Post", left: "characters left", del: "Delete",
        confirmDel: "Delete this post?", empty: "No posts yet. Be the first!",
        tNow: "Just now", tMin: "{n} min ago", tHour1: "1 hour ago", tHourN: "{n} hours ago", tDay1: "1 day ago", tDayN: "{n} days ago",
        mic: "Record a voice message", cancel: "Cancel", discard: "Discard",
        micDenied: "Microphone blocked. Allow it in your browser settings.", micUnsupported: "Voice recording is not supported on this device.",
        tooBig: "Voice message too large. Try a shorter one.", playErr: "Unable to play the voice message.",
        attach: "Send a photo", photoErr: "Photo can't be used. Try another one.",
        all: "All", testimony: "Testimonies", question: "Questions", prayer: "Prayer",
        newPost: "New post", pickCat: "Choose a category", catReq: "Choose a category before posting.",
        needLogin: "Log in to take part.", comment: "Comment", writeComment: "Write a comment...", noComments: "No comments yet.",
        share: "Share", shareVoice: "A voice message on Voyager à travers la Bible", sharePhoto: "A photo on Voyager à travers la Bible",
        report: "Report", confirmReport: "Report this post to the administrator?", reported: "Reported ✓",
        myProfile: "Profile", editTitle: "Edit my profile", fullName: "Full name", bio: "Description (optional)",
        bioPh: "Tell us a little about yourself...", choose: "Choose a photo", removePhoto: "Remove photo", save: "Save",
        close: "Close", noBio: "No description." },
  es: { login: "Iniciar sesión", signup: "Crear una cuenta", name: "Tu nombre", email: "Correo", password: "Contraseña (mín. 6 caracteres)",
        toSignup: "¿Aún no tienes cuenta? Crea una", toLogin: "¿Ya tienes cuenta? Inicia sesión", forgot: "¿Olvidaste tu contraseña?", logout: "Salir",
        bad: "Correo o contraseña incorrectos.", used: "Este correo ya está en uso.", weak: "Contraseña muy corta (mín. 6 caracteres).",
        badEmail: "Correo no válido.", nameReq: "Escribe tu nombre (2 a 40 caracteres).", generic: "Ocurrió un error. Inténtalo de nuevo.",
        enterEmail: "Escribe primero tu correo arriba.", resetSent: "Enviamos un enlace a tu correo para cambiar la contraseña.", loading: "Cargando...",
        placeholder: "Escribe lo que quieras compartir...", send: "Publicar", left: "caracteres restantes", del: "Eliminar",
        confirmDel: "¿Eliminar esta publicación?", empty: "Aún no hay publicaciones. ¡Sé el primero!",
        tNow: "Ahora mismo", tMin: "Hace {n} min", tHour1: "Hace 1 hora", tHourN: "Hace {n} horas", tDay1: "Hace 1 día", tDayN: "Hace {n} días",
        mic: "Grabar un audio", cancel: "Cancelar", discard: "Descartar",
        micDenied: "Micrófono bloqueado. Permítelo en los ajustes del navegador.", micUnsupported: "La grabación de audio no es compatible con este dispositivo.",
        tooBig: "El audio es demasiado pesado. Prueba uno más corto.", playErr: "No se pudo reproducir el audio.",
        attach: "Enviar una foto", photoErr: "No se puede usar la foto. Prueba otra.",
        all: "Todo", testimony: "Testimonios", question: "Preguntas", prayer: "Oración",
        newPost: "Nueva publicación", pickCat: "Elige una categoría", catReq: "Elige una categoría antes de publicar.",
        needLogin: "Inicia sesión para participar.", comment: "Comentario", writeComment: "Escribe un comentario...", noComments: "Aún no hay comentarios.",
        share: "Compartir", shareVoice: "Un audio en Voyager à travers la Bible", sharePhoto: "Una foto en Voyager à travers la Bible",
        report: "Denunciar", confirmReport: "¿Denunciar esta publicación al administrador?", reported: "Denunciado ✓",
        myProfile: "Perfil", editTitle: "Editar mi perfil", fullName: "Nombre completo", bio: "Descripción (opcional)",
        bioPh: "Cuéntanos un poco sobre ti...", choose: "Elegir una foto", removePhoto: "Quitar foto", save: "Guardar",
        close: "Cerrar", noBio: "Sin descripción." }
};

const COLORS = ["#b5651d", "#2a7a8c", "#8e44ad", "#c0392b", "#27ae60", "#2c3e50", "#d35400"];
const EMOJIS = ["🙏", "❤️", "😊", "😇", "🙌", "✝️", "🕊️", "📖", "🔥", "✨", "👍", "👏", "😂", "😢", "😍", "🥰", "😮", "🤗", "💪", "🌟", "🌹", "🎉", "😅", "🤝", "😉", "😌", "🙂", "😁", "😎", "🤲", "💛", "😭", "🙄", "😴", "🤔", "👋", "💐", "☀️", "🌈", "😔"];

function icon(path, size) {
  const n = size || 22;
  return '<svg viewBox="0 0 24 24" width="' + n + '" height="' + n + '" fill="currentColor" aria-hidden="true">' + path + "</svg>";
}
const MIC_SVG = icon('<path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>');
const SEND_SVG = icon('<path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/>');
const CAM_SVG = icon('<circle cx="12" cy="12" r="3.2"/><path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>');
const LIKE_SVG = icon('<path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>', 20);
const CMT_SVG = icon('<path d="M21 6v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>', 20);
const SHARE_SVG = icon('<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>', 20);
const PEN_SVG = icon('<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>', 26);

let mode = "login";
let user = null;
let posts = [];
let comments = [];
let loaded = false;
let tab = "all";
let editing = false;
let sheetOpen = false;
let sheetCat = "";
let sheetErr = "";
let draft = "";
let busy = false;
let emojiOpen = false;
let menuOpen = null;
let note = "";
let info = "";
let feedDirty = false;
let renderTimer = null;
const openCm = {};
const cdraft = {};
const reportedIds = {};
const profiles = {};
const pendingProf = {};
const imgCache = {};
const cache = {};
const ed = { name: "", bio: "", photo: "", msg: "", saving: false };
const pic = { state: "idle", full: "", thumb: "" };
const rec = { state: "idle", mr: null, stream: null, chunks: [], t0: 0, tick: null, blob: null, url: "", dur: 0, mime: "" };
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
function ago(dt) {
  const s = t();
  if (!dt) return "…";
  const sec = Math.max(0, (Date.now() - dt.getTime()) / 1000);
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (sec < 60) return s.tNow;
  if (m < 60) return s.tMin.replace("{n}", m);
  if (h < 24) return (h === 1 ? s.tHour1 : s.tHourN).replace("{n}", h);
  if (d < 7) return (d === 1 ? s.tDay1 : s.tDayN).replace("{n}", d);
  return dt.toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
}

const top = el("div", "ktop");
const tabs = el("div", "ktabs");
const feed = el("div", "kfeed");
const fab = el("button", "kfab");
fab.type = "button";
fab.innerHTML = PEN_SVG;
const sheet = el("div", "ksheet");
root.appendChild(top);
root.appendChild(tabs);
root.appendChild(feed);
root.appendChild(fab);
root.appendChild(sheet);

/* ---------- Imaj ---------- */
function loadImage(file) {
  return new Promise(function (res, rej) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); res(img); };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
async function makeChatImage(file) {
  const img = await loadImage(file);
  function draw(max, q) {
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * k));
    c.height = Math.max(1, Math.round(img.height * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q).split(",")[1];
  }
  let full = "";
  const tf = [[1280, 0.72], [1024, 0.6], [800, 0.5]];
  for (let i = 0; i < tf.length; i++) {
    full = draw(tf[i][0], tf[i][1]);
    if (full.length <= 700000) break;
  }
  if (full.length > 700000) throw new Error("big");
  let thumb = "";
  const tt = [[360, 0.6], [280, 0.5], [200, 0.5], [160, 0.5]];
  for (let i = 0; i < tt.length; i++) {
    thumb = draw(tt[i][0], tt[i][1]);
    if (thumb.length <= 38000) break;
  }
  if (thumb.length > 38000) throw new Error("big");
  return { full: full, thumb: thumb };
}
function resetPic() { pic.state = "idle"; pic.full = ""; pic.thumb = ""; }
async function openPhoto(p) {
  const o = el("div", "klight");
  const im = document.createElement("img");
  im.src = imgCache[p.id] || ("data:image/jpeg;base64," + (p.thumb || ""));
  o.appendChild(im);
  o.onclick = function () { o.remove(); };
  document.body.appendChild(o);
  if (!imgCache[p.id]) {
    try {
      const snap = await getDoc(doc(db, "images", p.id));
      if (snap.exists()) {
        imgCache[p.id] = "data:image/jpeg;base64," + snap.data().data;
        im.src = imgCache[p.id];
      }
    } catch (e) {}
  }
}

/* ---------- Pwofil ---------- */
function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setTimeout(function () {
    renderTimer = null;
    if (user && !editing) renderTop();
    renderFeed();
  }, 0);
}
function fetchProfile(uid) {
  if (uid in profiles) return Promise.resolve();
  if (pendingProf[uid]) return pendingProf[uid];
  pendingProf[uid] = getDoc(doc(db, "profiles", uid))
    .then(function (s) { profiles[uid] = s.exists() ? s.data() : null; })
    .catch(function () { profiles[uid] = null; })
    .then(function () { delete pendingProf[uid]; scheduleRender(); });
  return pendingProf[uid];
}
function avatar(uid, name, cls) {
  const a = el("div", "kav" + (cls ? " " + cls : ""));
  const pr = profiles[uid];
  if (pr && pr.photo) {
    const im = document.createElement("img");
    im.src = "data:image/jpeg;base64," + pr.photo;
    im.alt = "";
    a.appendChild(im);
  } else {
    a.textContent = ((name || "?").trim().charAt(0) || "?").toUpperCase();
    a.style.background = colorFor(name || "?");
  }
  return a;
}
function shownName(uid, fallback) {
  return (profiles[uid] && profiles[uid].name) || fallback || "?";
}
function openProfile(uid, fallback) {
  fetchProfile(uid).then(function () {
    const pr = profiles[uid];
    const s = t();
    const shown = (pr && pr.name) || fallback || "?";
    const o = el("div", "kmodal");
    const box = el("div", "kbox");
    box.appendChild(avatar(uid, shown, "big"));
    box.appendChild(el("h3", "", shown));
    box.appendChild(el("p", "", (pr && pr.bio) || s.noBio));
    const c = el("button", "kbtn", s.close);
    c.type = "button";
    c.onclick = function () { o.remove(); };
    box.appendChild(c);
    o.appendChild(box);
    o.onclick = function (e) { if (e.target === o) o.remove(); };
    document.body.appendChild(o);
  });
}
async function avatarFromFile(file) {
  const img = await loadImage(file);
  const size = Math.min(img.width, img.height);
  const sx = (img.width - size) / 2;
  const sy = (img.height - size) / 2;
  const tries = [[160, 0.72], [128, 0.6], [96, 0.5]];
  for (let i = 0; i < tries.length; i++) {
    const d = tries[i][0];
    const c = document.createElement("canvas");
    c.width = d;
    c.height = d;
    c.getContext("2d").drawImage(img, sx, sy, size, size, 0, 0, d, d);
    const data = c.toDataURL("image/jpeg", tries[i][1]).split(",")[1];
    if (data.length <= 50000) return data;
  }
  throw new Error("big");
}
async function openEditor() {
  if (!user) return;
  await fetchProfile(user.uid);
  const pr = profiles[user.uid] || {};
  ed.name = pr.name || user.displayName || "";
  ed.bio = pr.bio || "";
  ed.photo = pr.photo || "";
  ed.msg = "";
  ed.saving = false;
  editing = true;
  renderTop();
  renderFab();
}
async function saveProfile() {
  const s = t();
  const name = ed.name.trim();
  if (name.length < 2 || name.length > 40) { ed.msg = s.nameReq; renderTop(); return; }
  ed.saving = true;
  ed.msg = "";
  renderTop();
  try {
    const bio = ed.bio.trim().slice(0, 200);
    await updateProfile(auth.currentUser, { displayName: name });
    await setDoc(doc(db, "profiles", user.uid), { name: name, bio: bio, photo: ed.photo || "", updatedAt: serverTimestamp() });
    profiles[user.uid] = { name: name, bio: bio, photo: ed.photo || "" };
    user = auth.currentUser;
    editing = false;
    ed.saving = false;
    renderTop();
    renderFeed();
    renderFab();
  } catch (e) {
    ed.saving = false;
    ed.msg = s.generic;
    renderTop();
  }
}
function editorBox() {
  const s = t();
  const box = el("div", "kprof");
  box.appendChild(el("h3", "", s.editTitle));

  const av = el("div", "kav big");
  if (ed.photo) {
    const im = document.createElement("img");
    im.src = "data:image/jpeg;base64," + ed.photo;
    av.appendChild(im);
  } else {
    av.textContent = ((ed.name || "?").trim().charAt(0) || "?").toUpperCase();
    av.style.background = colorFor(ed.name || "?");
  }
  box.appendChild(av);

  const pick = document.createElement("input");
  pick.type = "file";
  pick.accept = "image/*";
  pick.setAttribute("aria-label", s.choose);
  pick.onchange = async function () {
    const f = pick.files[0];
    if (!f) return;
    try { ed.photo = await avatarFromFile(f); ed.msg = ""; }
    catch (e) { ed.msg = s.photoErr; }
    renderTop();
  };
  box.appendChild(pick);
  if (ed.photo) {
    const rm = el("button", "kbtn", s.removePhoto);
    rm.type = "button";
    rm.onclick = function () { ed.photo = ""; renderTop(); };
    box.appendChild(rm);
  }

  box.appendChild(el("label", "", s.fullName));
  const nm = document.createElement("input");
  nm.type = "text";
  nm.maxLength = 40;
  nm.value = ed.name;
  nm.oninput = function () { ed.name = nm.value; };
  box.appendChild(nm);

  box.appendChild(el("label", "", s.bio));
  const bi = document.createElement("textarea");
  bi.maxLength = 200;
  bi.placeholder = s.bioPh;
  bi.value = ed.bio;
  const cnt = el("div", "kcount");
  function upd() { cnt.textContent = (200 - bi.value.length) + " " + s.left; }
  bi.oninput = function () { ed.bio = bi.value; upd(); };
  upd();
  box.appendChild(bi);
  box.appendChild(cnt);

  const sv = el("button", "kbtn", s.save);
  sv.type = "button";
  sv.disabled = ed.saving;
  sv.onclick = saveProfile;
  const cn = el("button", "kbtn", s.cancel);
  cn.type = "button";
  cn.disabled = ed.saving;
  cn.onclick = function () { editing = false; renderTop(); renderFab(); };
  box.appendChild(sv);
  box.appendChild(cn);
  if (ed.msg) box.appendChild(el("p", "knote", ed.msg));
  return box;
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
  const e = sheet.querySelector(".krectime");
  if (!e) return;
  const sec = Math.min(MAX_SEC, (Date.now() - rec.t0) / 1000);
  e.textContent = fmt(sec) + " / " + fmt(MAX_SEC);
}
async function startRec() {
  const s = t();
  sheetErr = "";
  const mime = pickMime();
  if (mime === null) { sheetErr = s.micUnsupported; renderSheet(); return; }
  try {
    rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) { sheetErr = s.micDenied; renderSheet(); return; }
  rec.chunks = [];
  const opts = { audioBitsPerSecond: 16000 };
  if (mime) opts.mimeType = mime;
  try {
    rec.mr = new MediaRecorder(rec.stream, opts);
  } catch (e) {
    stopStream();
    sheetErr = s.micUnsupported;
    renderSheet();
    return;
  }
  const mr = rec.mr;
  mr.ondataavailable = function (ev) { if (ev.data && ev.data.size) rec.chunks.push(ev.data); };
  mr.onstop = function () {
    stopStream();
    if (rec.state !== "stopping") return;
    if (rec.dur < 1) { resetRec(); renderSheet(); return; }
    const type = mr.mimeType || mime || "audio/webm";
    rec.blob = new Blob(rec.chunks, { type: type });
    rec.mime = type;
    rec.url = URL.createObjectURL(rec.blob);
    rec.state = "review";
    renderSheet();
  };
  rec.state = "recording";
  rec.t0 = Date.now();
  mr.start(1000);
  rec.tick = setInterval(function () {
    tickUI();
    if ((Date.now() - rec.t0) / 1000 >= MAX_SEC) stopRec();
  }, 250);
  renderSheet();
}
function stopRec() {
  if (rec.state !== "recording") return;
  clearInterval(rec.tick);
  rec.dur = Math.min(MAX_SEC, (Date.now() - rec.t0) / 1000);
  rec.state = "stopping";
  try { rec.mr.stop(); } catch (e) { resetRec(); renderSheet(); }
}
function cancelRec() {
  clearInterval(rec.tick);
  const mr = rec.mr;
  rec.state = "idle";
  try { if (mr && mr.state !== "inactive") mr.stop(); } catch (e) {}
  resetRec();
  renderSheet();
}
function blobToB64(blob) {
  return new Promise(function (res, rej) {
    const r = new FileReader();
    r.onload = function () { res(String(r.result).split(",")[1] || ""); };
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

/* ---------- Voye piblikasyon ---------- */
function baseName() { return (user.displayName || "").slice(0, 40) || "?"; }
function doneSending() {
  sheetOpen = false; sheetCat = ""; sheetErr = ""; emojiOpen = false; busy = false;
  renderSheet();
  renderFab();
}
async function sendText() {
  const s = t();
  const text = draft.trim();
  if (!sheetCat) { sheetErr = s.catReq; renderSheet(); return; }
  if (!text || text.length > MAX) return;
  busy = true; sheetErr = ""; renderSheet();
  try {
    await addDoc(collection(db, "posts"), {
      uid: user.uid, name: baseName(), type: "text", cat: sheetCat, text: text, likedBy: [], createdAt: serverTimestamp()
    });
    draft = "";
    doneSending();
  } catch (e) {
    busy = false; sheetErr = s.generic; renderSheet();
  }
}
async function sendVoice() {
  const s = t();
  if (!rec.blob || !user || rec.state !== "review") return;
  if (!sheetCat) { sheetErr = s.catReq; renderSheet(); return; }
  if (rec.blob.size > MAX_BYTES) { sheetErr = s.tooBig; renderSheet(); return; }
  rec.state = "sending"; sheetErr = ""; renderSheet();
  try {
    const b64 = await blobToB64(rec.blob);
    const postRef = doc(collection(db, "posts"));
    const batch = writeBatch(db);
    batch.set(doc(db, "audios", postRef.id), { uid: user.uid, mime: rec.mime, audio: b64, createdAt: serverTimestamp() });
    batch.set(postRef, {
      uid: user.uid, name: baseName(), type: "voice", cat: sheetCat,
      duration: Math.max(1, Math.round(rec.dur * 10) / 10), likedBy: [], createdAt: serverTimestamp()
    });
    await batch.commit();
    resetRec();
    doneSending();
  } catch (e) {
    rec.state = "review"; sheetErr = s.generic; renderSheet();
  }
}
async function sendPhoto() {
  const s = t();
  if (!user || pic.state !== "review") return;
  if (!sheetCat) { sheetErr = s.catReq; renderSheet(); return; }
  pic.state = "sending"; sheetErr = ""; renderSheet();
  try {
    const postRef = doc(collection(db, "posts"));
    const b = writeBatch(db);
    b.set(doc(db, "images", postRef.id), { uid: user.uid, data: pic.full, createdAt: serverTimestamp() });
    b.set(postRef, {
      uid: user.uid, name: baseName(), type: "image", cat: sheetCat, thumb: pic.thumb, likedBy: [], createdAt: serverTimestamp()
    });
    await b.commit();
    resetPic();
    doneSending();
  } catch (e) {
    pic.state = "review"; sheetErr = s.generic; renderSheet();
  }
}
function closeSheet() {
  if (rec.state === "recording") cancelRec(); else resetRec();
  resetPic();
  sheetOpen = false; sheetErr = ""; emojiOpen = false; busy = false;
  renderSheet();
  renderFab();
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

/* ---------- Aksyon sou piblikasyon ---------- */
async function toggleLike(p) {
  if (!user) { alert(t().needLogin); return; }
  const liked = Array.isArray(p.likedBy) && p.likedBy.indexOf(user.uid) >= 0;
  try {
    await updateDoc(doc(db, "posts", p.id), { likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
  } catch (e) {}
}
function sharePost(p) {
  const s = t();
  const body = p.type === "voice" ? s.shareVoice : (p.type === "image" ? s.sharePhoto : (p.text || ""));
  if (navigator.share) {
    navigator.share({ text: body, url: APP_URL }).catch(function () {});
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent(body + "\n" + APP_URL), "_blank", "noopener");
  }
}
async function deletePost(p) {
  if (!confirm(t().confirmDel)) return;
  try {
    if (p.type === "voice" || p.type === "image") {
      if (p.type === "voice" && cur.id === p.id && cur.audio) cur.audio.pause();
      const b = writeBatch(db);
      b.delete(doc(db, "posts", p.id));
      b.delete(doc(db, p.type === "voice" ? "audios" : "images", p.id));
      await b.commit();
    } else {
      await deleteDoc(doc(db, "posts", p.id));
    }
  } catch (e) {}
}
async function reportPost(p) {
  const s = t();
  if (!confirm(s.confirmReport)) return;
  try {
    await setDoc(doc(db, "reports", p.id + "_" + user.uid), {
      postId: p.id, postUid: p.uid, reporter: user.uid, createdAt: serverTimestamp()
    });
    reportedIds[p.id] = true;
  } catch (e) {}
  renderFeed();
}

/* ---------- Paj la ---------- */
function renderTop() {
  const s = t();
  top.textContent = "";
  root.classList.toggle("kedit", !!(user && editing));

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
          renderAll();
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

  const myName = shownName(user.uid, user.displayName);
  const bar = el("div", "kbar");
  const left = el("div", "kleft");
  const av = avatar(user.uid, myName, "mid");
  av.style.cursor = "pointer";
  av.onclick = openEditor;
  left.appendChild(av);
  left.appendChild(el("span", "", myName));
  const right = el("div", "kright");
  const pb = el("button", "kbtn", s.myProfile);
  pb.type = "button";
  pb.style.margin = "0";
  pb.onclick = openEditor;
  const out = el("button", "kbtn", s.logout);
  out.type = "button";
  out.style.margin = "0";
  out.onclick = function () { signOut(auth); };
  right.appendChild(pb);
  right.appendChild(out);
  bar.appendChild(left);
  bar.appendChild(right);
  top.appendChild(bar);
  if (editing) top.appendChild(editorBox());
}

function renderTabs() {
  const s = t();
  tabs.textContent = "";
  ["all"].concat(CATS).forEach(function (c) {
    const b = el("button", "ktab" + (tab === c ? " on" : ""), s[c]);
    b.type = "button";
    b.onclick = function () { tab = c; menuOpen = null; renderTabs(); renderFeed(); };
    tabs.appendChild(b);
  });
}

function renderFab() {
  fab.style.display = (user && !sheetOpen && !editing) ? "flex" : "none";
  fab.setAttribute("aria-label", t().newPost);
}
fab.onclick = function () { sheetOpen = true; sheetErr = ""; renderSheet(); renderFab(); };

function renderSheet() {
  const s = t();
  sheet.textContent = "";
  const open = !!(sheetOpen && user);
  sheet.style.display = open ? "flex" : "none";
  if (!open) return;

  const panel = el("div", "kpanel");
  const head = el("div", "kbar");
  head.appendChild(el("h3", "", s.newPost));
  const x = el("button", "kmic", "✕");
  x.type = "button";
  x.setAttribute("aria-label", s.close);
  x.onclick = closeSheet;
  head.appendChild(x);
  panel.appendChild(head);

  panel.appendChild(el("div", "klabel", s.pickCat));
  const chips = el("div", "kchips");
  CATS.forEach(function (c) {
    const b = el("button", "kchip2" + (sheetCat === c ? " on" : ""), s[c]);
    b.type = "button";
    b.onclick = function () { sheetCat = c; sheetErr = ""; renderSheet(); };
    chips.appendChild(b);
  });
  panel.appendChild(chips);

  const post = el("button", "kpost", busy || rec.state === "sending" || pic.state === "sending" ? "…" : s.send);
  post.type = "button";
  post.disabled = busy || rec.state === "sending" || pic.state === "sending";

  if (rec.state === "recording" || rec.state === "stopping") {
    const r = el("div", "krec");
    r.appendChild(el("span", "krecdot"));
    r.appendChild(el("span", "krectime", "0:00 / " + fmt(MAX_SEC)));
    const c = el("button", "kmic", "✕");
    c.type = "button";
    c.setAttribute("aria-label", s.cancel);
    c.onclick = cancelRec;
    const st = el("button", "ksend", "■");
    st.type = "button";
    st.onclick = stopRec;
    r.appendChild(c);
    r.appendChild(st);
    panel.appendChild(r);
    sheet.appendChild(panel);
    tickUI();
    return;
  }

  if (rec.state === "review" || rec.state === "sending") {
    const r = el("div", "kreview");
    const d = el("button", "kmic", "🗑");
    d.type = "button";
    d.disabled = rec.state === "sending";
    d.setAttribute("aria-label", s.discard);
    d.onclick = function () { resetRec(); renderSheet(); };
    const au = document.createElement("audio");
    au.controls = true;
    au.src = rec.url;
    r.appendChild(d);
    r.appendChild(au);
    panel.appendChild(r);
    post.onclick = sendVoice;
    const row = el("div", "ktools");
    row.appendChild(el("span", "spacer"));
    row.appendChild(post);
    panel.appendChild(row);
    if (sheetErr) panel.appendChild(el("p", "knote", sheetErr));
    sheet.appendChild(panel);
    return;
  }

  if (pic.state === "review" || pic.state === "sending") {
    const r = el("div", "kreview");
    const d = el("button", "kmic", "🗑");
    d.type = "button";
    d.disabled = pic.state === "sending";
    d.setAttribute("aria-label", s.discard);
    d.onclick = function () { resetPic(); renderSheet(); };
    const pv = el("div", "kpreview");
    const im = document.createElement("img");
    im.src = "data:image/jpeg;base64," + pic.thumb;
    im.alt = "";
    pv.appendChild(im);
    r.appendChild(d);
    r.appendChild(pv);
    panel.appendChild(r);
    post.onclick = sendPhoto;
    const row = el("div", "ktools");
    row.appendChild(el("span", "spacer"));
    row.appendChild(post);
    panel.appendChild(row);
    if (sheetErr) panel.appendChild(el("p", "knote", sheetErr));
    sheet.appendChild(panel);
    return;
  }

  const ta = document.createElement("textarea");
  ta.maxLength = MAX;
  ta.placeholder = s.placeholder;
  ta.value = draft;
  const cnt = el("div", "kcount");
  function upd() {
    const left = MAX - ta.value.length;
    cnt.textContent = left <= 200 ? left + " " + s.left : "";
  }
  ta.oninput = function () { draft = ta.value; upd(); };
  upd();
  panel.appendChild(ta);
  panel.appendChild(cnt);

  if (emojiOpen) {
    const grid = el("div", "kemojis");
    EMOJIS.forEach(function (em) {
      const b = el("button", "", em);
      b.type = "button";
      b.onclick = function () {
        const a = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
        const z = ta.selectionEnd == null ? a : ta.selectionEnd;
        if (ta.value.length - (z - a) + em.length > MAX) return;
        ta.value = ta.value.slice(0, a) + em + ta.value.slice(z);
        draft = ta.value;
        upd();
      };
      grid.appendChild(b);
    });
    panel.appendChild(grid);
  }

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.style.display = "none";
  file.onchange = async function () {
    const f = file.files[0];
    if (!f) return;
    draft = ta.value;
    try {
      const r = await makeChatImage(f);
      pic.full = r.full;
      pic.thumb = r.thumb;
      pic.state = "review";
      sheetErr = "";
    } catch (e) {
      pic.state = "idle";
      sheetErr = s.photoErr;
    }
    renderSheet();
  };

  const row = el("div", "ktools");
  const emo = el("button", "kmic", emojiOpen ? "⌨️" : "😊");
  emo.type = "button";
  emo.onclick = function () { draft = ta.value; emojiOpen = !emojiOpen; renderSheet(); };
  const cam = el("button", "kmic");
  cam.innerHTML = CAM_SVG;
  cam.type = "button";
  cam.setAttribute("aria-label", s.attach);
  cam.onclick = function () { file.click(); };
  const mic = el("button", "kmic");
  mic.innerHTML = MIC_SVG;
  mic.type = "button";
  mic.setAttribute("aria-label", s.mic);
  mic.onclick = function () { draft = ta.value; startRec(); };
  row.appendChild(emo);
  row.appendChild(cam);
  row.appendChild(mic);
  row.appendChild(el("span", "spacer"));
  post.onclick = sendText;
  row.appendChild(post);
  panel.appendChild(row);
  panel.appendChild(file);
  if (sheetErr) panel.appendChild(el("p", "knote", sheetErr));
  sheet.appendChild(panel);
}

function commentsBlock(p) {
  const s = t();
  const box = el("div", "kcm");
  const list = comments.filter(function (c) { return c.postId === p.id; }).slice().reverse();
  if (!list.length) box.appendChild(el("p", "snums", s.noComments));
  list.forEach(function (c) {
    fetchProfile(c.uid);
    const row = el("div", "kcmt");
    row.appendChild(el("b", "", shownName(c.uid, c.name)));
    row.appendChild(document.createTextNode(c.text || ""));
    const dt = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : null;
    const sm = el("small", "", ago(dt));
    if (user && (user.uid === c.uid || user.uid === ADMIN_UID)) {
      const d = el("button", "kdel", s.del);
      d.type = "button";
      d.onclick = async function () {
        if (!confirm(s.confirmDel)) return;
        try { await deleteDoc(doc(db, "comments", c.id)); } catch (e) {}
      };
      sm.appendChild(d);
    }
    row.appendChild(sm);
    box.appendChild(row);
  });
  if (!user) {
    box.appendChild(el("p", "snums", s.needLogin));
    return box;
  }
  const form = el("div", "kcin");
  const ta = document.createElement("textarea");
  ta.maxLength = MAX_CM;
  ta.rows = 1;
  ta.placeholder = s.writeComment;
  ta.value = cdraft[p.id] || "";
  ta.oninput = function () { cdraft[p.id] = ta.value; };
  const send = el("button", "");
  send.innerHTML = SEND_SVG;
  send.type = "button";
  send.setAttribute("aria-label", s.send);
  send.onclick = async function () {
    const text = ta.value.trim();
    if (!text) return;
    send.disabled = true;
    try {
      await addDoc(collection(db, "comments"), {
        postId: p.id, uid: user.uid, name: baseName(), text: text.slice(0, MAX_CM), createdAt: serverTimestamp()
      });
      cdraft[p.id] = "";
      ta.value = "";
      ta.blur();
      renderFeed();
    } catch (e) {
      send.disabled = false;
    }
  };
  form.appendChild(ta);
  form.appendChild(send);
  box.appendChild(form);
  return box;
}

function postCard(p) {
  const s = t();
  const own = !!(user && user.uid === p.uid);
  const isAdm = !!(user && user.uid === ADMIN_UID);
  fetchProfile(p.uid);
  const name = shownName(p.uid, p.name);
  const card = el("div", "kcard");

  const head = el("div", "kchead");
  const av = avatar(p.uid, name, "mid");
  av.style.cursor = "pointer";
  av.onclick = function () { openProfile(p.uid, name); };
  head.appendChild(av);
  const who = el("div", "who");
  who.onclick = function () { openProfile(p.uid, name); };
  who.appendChild(el("div", "nm", name));
  const dt = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate() : null;
  who.appendChild(el("div", "tm", ago(dt) + (p.cat && s[p.cat] ? " · " + s[p.cat] : "")));
  head.appendChild(who);

  if (user && (own || isAdm || !reportedIds[p.id])) {
    const more = el("button", "kmore", "⋮");
    more.type = "button";
    more.onclick = function () { menuOpen = menuOpen === p.id ? null : p.id; renderFeed(); };
    head.appendChild(more);
    if (menuOpen === p.id) {
      const menu = el("div", "kmenu");
      if (own || isAdm) {
        const d = el("button", "red", s.del);
        d.type = "button";
        d.onclick = function () { menuOpen = null; deletePost(p); };
        menu.appendChild(d);
      } else {
        const r = el("button", "", reportedIds[p.id] ? s.reported : s.report);
        r.type = "button";
        r.disabled = !!reportedIds[p.id];
        r.onclick = function () { menuOpen = null; reportPost(p); };
        menu.appendChild(r);
      }
      head.appendChild(menu);
    }
  }
  card.appendChild(head);

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
    card.appendChild(row);
  } else if (p.type === "image") {
    const im = document.createElement("img");
    im.className = "kimg";
    im.src = "data:image/jpeg;base64," + (p.thumb || "");
    im.alt = "";
    im.onclick = function () { openPhoto(p); };
    card.appendChild(im);
  } else {
    card.appendChild(el("div", "ktext", p.text || ""));
  }

  const likes = Array.isArray(p.likedBy) ? p.likedBy : [];
  const liked = !!(user && likes.indexOf(user.uid) >= 0);
  const nCm = comments.filter(function (c) { return c.postId === p.id; }).length;
  const acts = el("div", "kacts");

  const lb = el("button", "kact" + (liked ? " on" : ""));
  lb.type = "button";
  lb.innerHTML = LIKE_SVG;
  lb.appendChild(el("span", "", String(likes.length)));
  lb.onclick = function () { toggleLike(p); };

  const cb = el("button", "kact" + (openCm[p.id] ? " on" : ""));
  cb.type = "button";
  cb.innerHTML = CMT_SVG;
  cb.appendChild(el("span", "", String(nCm)));
  cb.onclick = function () { openCm[p.id] = !openCm[p.id]; renderFeed(); };

  const sb = el("button", "kact");
  sb.type = "button";
  sb.innerHTML = SHARE_SVG;
  sb.appendChild(el("span", "", s.share));
  sb.onclick = function () { sharePost(p); };

  acts.appendChild(lb);
  acts.appendChild(cb);
  acts.appendChild(sb);
  card.appendChild(acts);
  if (openCm[p.id]) card.appendChild(commentsBlock(p));
  return card;
}

function renderFeed() {
  const ae = document.activeElement;
  if (ae && feed.contains(ae) && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT")) { feedDirty = true; return; }
  feedDirty = false;
  const s = t();
  feed.textContent = "";
  if (!loaded) { feed.appendChild(el("p", "kempty", s.loading)); return; }
  const list = posts.filter(function (p) { return tab === "all" || p.cat === tab; });
  if (!list.length) { feed.appendChild(el("p", "kempty", s.empty)); return; }
  list.forEach(function (p) { feed.appendChild(postCard(p)); });
  refreshVoice();
}

function renderAll() {
  renderTop();
  renderTabs();
  renderFeed();
  renderFab();
  renderSheet();
}

document.addEventListener("click", function (e) {
  if (menuOpen && !(e.target.closest && e.target.closest(".kmenu, .kmore"))) {
    menuOpen = null;
    renderFeed();
  }
});

onAuthStateChanged(auth, function (u) {
  user = u;
  note = ""; info = "";
  editing = false;
  emojiOpen = false;
  menuOpen = null;
  sheetOpen = false;
  sheetCat = "";
  sheetErr = "";
  busy = false;
  resetPic();
  if (!u) {
    if (rec.state === "recording") cancelRec(); else resetRec();
    if (cur.audio) cur.audio.pause();
    cur = { id: null, audio: null, loading: false };
  } else {
    fetchProfile(u.uid);
  }
  renderAll();
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
  function () { loaded = true; posts = []; renderFeed(); }
);

onSnapshot(
  query(collection(db, "comments"), orderBy("createdAt", "desc"), limit(400)),
  function (snap) {
    comments = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }));
    });
    renderFeed();
  },
  function () {}
);

document.getElementById("lang-btn").addEventListener("click", renderAll);
setInterval(function () { renderFeed(); }, 60000);

renderAll();
