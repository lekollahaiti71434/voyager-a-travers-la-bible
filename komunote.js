import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const MAX = 1000;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("komunote-content");

const L = {
  ht: { login: "Konekte", signup: "Kreye yon kont", name: "Non ou", email: "Imèl", password: "Modpas (omwen 6 karaktè)",
        toSignup: "Ou poko gen kont? Kreye youn", toLogin: "Ou deja gen kont? Konekte", forgot: "Bliye modpas?",
        logout: "Soti", hello: "Bonjou", placeholder: "Ekri mesaj ou la...", send: "Voye", left: "karaktè rete",
        del: "Efase", confirmDel: "Efase mesaj sa a?", empty: "Poko gen mesaj. Se ou ki ka kòmanse!",
        bad: "Imèl oswa modpas pa bon.", used: "Imèl sa a deja itilize.", weak: "Modpas la two kout (omwen 6 karaktè).",
        badEmail: "Imèl la pa valid.", nameReq: "Mete non ou (2 a 40 karaktè).", generic: "Yon erè rive. Eseye ankò.",
        enterEmail: "Mete imèl ou anwo a dabò.", resetSent: "Nou voye yon lyen nan imèl ou pou chanje modpas la.",
        loading: "Chajman..." },
  fr: { login: "Se connecter", signup: "Créer un compte", name: "Votre nom", email: "E-mail", password: "Mot de passe (6 caractères min.)",
        toSignup: "Pas encore de compte ? Créez-en un", toLogin: "Déjà un compte ? Connectez-vous", forgot: "Mot de passe oublié ?",
        logout: "Déconnexion", hello: "Bonjour", placeholder: "Écrivez votre message ici...", send: "Envoyer", left: "caractères restants",
        del: "Supprimer", confirmDel: "Supprimer ce message ?", empty: "Aucun message. Soyez le premier !",
        bad: "E-mail ou mot de passe incorrect.", used: "Cet e-mail est déjà utilisé.", weak: "Mot de passe trop court (6 caractères min.).",
        badEmail: "E-mail invalide.", nameReq: "Entrez votre nom (2 à 40 caractères).", generic: "Une erreur est survenue. Réessayez.",
        enterEmail: "Entrez d'abord votre e-mail ci-dessus.", resetSent: "Un lien pour changer le mot de passe a été envoyé à votre e-mail.",
        loading: "Chargement..." },
  en: { login: "Log in", signup: "Create an account", name: "Your name", email: "Email", password: "Password (min. 6 characters)",
        toSignup: "No account yet? Create one", toLogin: "Already have an account? Log in", forgot: "Forgot password?",
        logout: "Log out", hello: "Hello", placeholder: "Write your message here...", send: "Send", left: "characters left",
        del: "Delete", confirmDel: "Delete this message?", empty: "No messages yet. Be the first!",
        bad: "Wrong email or password.", used: "This email is already in use.", weak: "Password too short (min. 6 characters).",
        badEmail: "Invalid email.", nameReq: "Enter your name (2 to 40 characters).", generic: "Something went wrong. Try again.",
        enterEmail: "Enter your email above first.", resetSent: "A password reset link was sent to your email.",
        loading: "Loading..." },
  es: { login: "Iniciar sesión", signup: "Crear una cuenta", name: "Tu nombre", email: "Correo", password: "Contraseña (mín. 6 caracteres)",
        toSignup: "¿Aún no tienes cuenta? Crea una", toLogin: "¿Ya tienes cuenta? Inicia sesión", forgot: "¿Olvidaste tu contraseña?",
        logout: "Salir", hello: "Hola", placeholder: "Escribe tu mensaje aquí...", send: "Enviar", left: "caracteres restantes",
        del: "Eliminar", confirmDel: "¿Eliminar este mensaje?", empty: "Aún no hay mensajes. ¡Sé el primero!",
        bad: "Correo o contraseña incorrectos.", used: "Este correo ya está en uso.", weak: "Contraseña muy corta (mín. 6 caracteres).",
        badEmail: "Correo no válido.", nameReq: "Escribe tu nombre (2 a 40 caracteres).", generic: "Ocurrió un error. Inténtalo de nuevo.",
        enterEmail: "Escribe primero tu correo arriba.", resetSent: "Enviamos un enlace a tu correo para cambiar la contraseña.",
        loading: "Cargando..." }
};

let mode = "login";
let user = null;
let posts = [];
let draft = "";
let note = "";
let info = "";
let loaded = false;

function lang() {
  let l = "ht";
  try { l = localStorage.getItem("lang") || "ht"; } catch (e) {}
  return L[l] ? l : "ht";
}
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
function errText(e) {
  const s = t();
  const c = e && e.code;
  if (c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") return s.bad;
  if (c === "auth/email-already-in-use") return s.used;
  if (c === "auth/weak-password") return s.weak;
  if (c === "auth/invalid-email") return s.badEmail;
  return s.generic;
}

const top = el("div");
const feed = el("div", "kfeed");
root.appendChild(top);
root.appendChild(feed);

function renderTop() {
  const s = t();
  top.textContent = "";

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
          renderTop(); renderFeed();
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

  const box = el("div", "kcomposer");
  const ta = document.createElement("textarea");
  ta.maxLength = MAX;
  ta.placeholder = s.placeholder;
  ta.value = draft;
  const count = el("div", "kcount");
  function upd() { count.textContent = (MAX - ta.value.length) + " " + s.left; }
  ta.addEventListener("input", function () { draft = ta.value; upd(); });
  upd();
  box.appendChild(ta);
  box.appendChild(count);

  const send = el("button", "kbtn", s.send);
  send.type = "button";
  send.onclick = async function () {
    const text = ta.value.trim();
    if (!text || text.length > MAX) return;
    send.disabled = true;
    note = "";
    try {
      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        name: (user.displayName || "").slice(0, 40) || "?",
        type: "text",
        text: text,
        createdAt: serverTimestamp()
      });
      draft = "";
      ta.value = "";
      upd();
    } catch (e) {
      note = s.generic;
    }
    send.disabled = false;
    renderTop();
  };
  box.appendChild(send);
  if (note) box.appendChild(el("p", "knote", note));
  top.appendChild(box);
}

function renderFeed() {
  const s = t();
  feed.textContent = "";
  if (!loaded) { feed.appendChild(el("p", "", s.loading)); return; }
  if (!posts.length) { feed.appendChild(el("p", "", s.empty)); return; }
  posts.forEach(function (p) {
    const card = el("div", "kpost");
    const meta = el("div", "kmeta");
    const when = p.createdAt && p.createdAt.toDate
      ? p.createdAt.toDate().toLocaleString(lang() === "ht" ? "fr" : lang(), { dateStyle: "short", timeStyle: "short" })
      : "...";
    const b = el("b", "", p.name || "?");
    meta.appendChild(b);
    meta.appendChild(document.createTextNode(" · " + when));
    card.appendChild(meta);
    card.appendChild(el("div", "ktext", p.text || ""));
    if (user && (user.uid === p.uid || user.uid === ADMIN_UID)) {
      const d = el("button", "klink", s.del);
      d.type = "button";
      d.onclick = async function () {
        if (!confirm(s.confirmDel)) return;
        try { await deleteDoc(doc(db, "posts", p.id)); } catch (e) {}
      };
      card.appendChild(d);
    }
    feed.appendChild(card);
  });
}

onAuthStateChanged(auth, function (u) {
  user = u;
  note = ""; info = "";
  renderTop();
  renderFeed();
});

onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)),
  function (snap) {
    posts = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
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
  renderFeed();
});

renderTop();
renderFeed();
