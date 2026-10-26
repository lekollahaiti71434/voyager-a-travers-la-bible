import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, getDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const MAX = 1000;
const root = document.getElementById("komunote-content");

const L = {
  ht: { posts: "Piblikasyon", chat: "Diskisyon", placeholder: "Ekri yon mesaj...", send: "Voye", left: "karaktè rete",
        del: "Efase", confirmDel: "Efase mesaj sa a?", empty: "Poko gen mesaj. Kòmanse diskisyon an!",
        today: "Jodi a", yesterday: "Yè", needLogin: "Konekte pou ekri nan diskisyon an.",
        generic: "Yon erè rive. Eseye ankò.", loading: "Chajman..." },
  fr: { posts: "Publications", chat: "Discussion", placeholder: "Écrivez un message...", send: "Envoyer", left: "caractères restants",
        del: "Supprimer", confirmDel: "Supprimer ce message ?", empty: "Aucun message. Lancez la discussion !",
        today: "Aujourd'hui", yesterday: "Hier", needLogin: "Connectez-vous pour écrire dans la discussion.",
        generic: "Une erreur est survenue. Réessayez.", loading: "Chargement..." },
  en: { posts: "Posts", chat: "Chat", placeholder: "Write a message...", send: "Send", left: "characters left",
        del: "Delete", confirmDel: "Delete this message?", empty: "No messages yet. Start the conversation!",
        today: "Today", yesterday: "Yesterday", needLogin: "Log in to write in the chat.",
        generic: "Something went wrong. Try again.", loading: "Loading..." },
  es: { posts: "Publicaciones", chat: "Conversación", placeholder: "Escribe un mensaje...", send: "Enviar", left: "caracteres restantes",
        del: "Eliminar", confirmDel: "¿Eliminar este mensaje?", empty: "Aún no hay mensajes. ¡Inicia la conversación!",
        today: "Hoy", yesterday: "Ayer", needLogin: "Inicia sesión para escribir en la conversación.",
        generic: "Ocurrió un error. Inténtalo de nuevo.", loading: "Cargando..." }
};

const COLORS = ["#b5651d", "#2a7a8c", "#8e44ad", "#c0392b", "#27ae60", "#2c3e50", "#d35400"];
const EMOJIS = ["🙏", "❤️", "😊", "😇", "🙌", "✝️", "🕊️", "📖", "🔥", "✨", "👍", "👏", "😂", "😢", "😍", "🥰", "😮", "🤗", "💪", "🌟", "🌹", "🎉", "😅", "🤝", "😉", "😌", "🙂", "😁", "😎", "🤲", "💛", "😭", "🙄", "😴", "🤔", "👋", "💐", "☀️", "🌈", "😔"];
const SEND_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

function start() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user = null;
  let msgs = [];
  let loaded = false;
  let view = "posts";
  let draft = "";
  let emojiOpen = false;
  let forceScroll = true;
  const profiles = {};
  const pending = {};

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
  function fetchProfile(uid) {
    if (uid in profiles) return;
    if (pending[uid]) return;
    pending[uid] = getDoc(doc(db, "profiles", uid))
      .then(function (s) { profiles[uid] = s.exists() ? s.data() : null; })
      .catch(function () { profiles[uid] = null; })
      .then(function () { delete pending[uid]; renderFeed(); });
  }
  function nameOf(uid, fallback) { return (profiles[uid] && profiles[uid].name) || fallback || "?"; }
  function avatar(uid, name) {
    const a = el("div", "kav");
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

  const sw = el("div", "cswitch");
  const topEl = root.querySelector(".ktop");
  if (topEl) topEl.after(sw); else root.prepend(sw);
  const panel = el("div", "cchat");
  const feed = el("div", "cfeed");
  const bottom = el("div", "cbottom");
  panel.appendChild(feed);
  panel.appendChild(bottom);
  root.appendChild(panel);

  function renderSwitch() {
    const s = t();
    sw.textContent = "";
    [["posts", s.posts], ["chat", s.chat]].forEach(function (v) {
      const b = el("button", view === v[0] ? "on" : "", v[1]);
      b.type = "button";
      b.onclick = function () { setView(v[0]); };
      sw.appendChild(b);
    });
  }
  function setView(v) {
    view = v;
    root.classList.toggle("kchat", v === "chat");
    renderSwitch();
    if (v === "chat") { forceScroll = true; renderBottom(); renderFeed(); }
  }

  function renderBottom() {
    const s = t();
    bottom.textContent = "";
    if (!user) { bottom.appendChild(el("p", "cnote", s.needLogin)); return; }

    const ta = document.createElement("textarea");
    ta.rows = 1;
    ta.maxLength = MAX;
    ta.placeholder = s.placeholder;
    ta.value = draft;

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
          const pos = a + em.length;
          ta.setSelectionRange(pos, pos);
          draft = ta.value;
          grow();
          upd();
        };
        grid.appendChild(b);
      });
      bottom.appendChild(grid);
    }

    const row = el("div", "ccomposer");
    const pill = el("div", "cpill");
    const emo = el("button", "cemo", emojiOpen ? "⌨️" : "😊");
    emo.type = "button";
    emo.onclick = function () { draft = ta.value; emojiOpen = !emojiOpen; renderBottom(); };
    pill.appendChild(emo);
    pill.appendChild(ta);
    const send = el("button", "csend");
    send.innerHTML = SEND_SVG;
    send.type = "button";
    send.setAttribute("aria-label", s.send);
    row.appendChild(pill);
    row.appendChild(send);
    const line = el("div", "kcount");
    bottom.appendChild(row);
    bottom.appendChild(line);

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
        await addDoc(collection(db, "chat"), {
          uid: user.uid,
          name: (user.displayName || "").slice(0, 40) || "?",
          text: text,
          createdAt: serverTimestamp()
        });
        draft = "";
        emojiOpen = false;
        renderBottom();
        return;
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
    if (!loaded) { feed.appendChild(el("p", "cnote", s.loading)); return; }
    if (!msgs.length) { feed.appendChild(el("p", "cnote", s.empty)); return; }

    let lastDay = null;
    msgs.forEach(function (m) {
      const dt = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : null;
      if (dt && (!lastDay || !sameDay(dt, lastDay))) {
        lastDay = dt;
        feed.appendChild(el("div", "cday", dayLabel(dt)));
      }
      const own = !!(user && user.uid === m.uid);
      const box = el("div", "cmsg" + (own ? " own" : ""));
      if (!own) {
        fetchProfile(m.uid);
        const shown = nameOf(m.uid, m.name);
        const head = el("div", "chead");
        head.appendChild(avatar(m.uid, shown));
        const n = el("div", "cname", shown);
        n.style.color = colorFor(shown);
        head.appendChild(n);
        box.appendChild(head);
      }
      box.appendChild(el("div", "ctext", m.text || ""));
      const foot = el("div", "cfoot");
      if (user && (own || user.uid === ADMIN_UID)) {
        const d = el("button", "cdel", s.del);
        d.type = "button";
        d.onclick = async function () {
          if (!confirm(s.confirmDel)) return;
          try { await deleteDoc(doc(db, "chat", m.id)); } catch (e) {}
        };
        foot.appendChild(d);
      }
      foot.appendChild(el("span", "", dt ? dt.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" }) : ""));
      box.appendChild(foot);
      feed.appendChild(box);
    });

    if (forceScroll || nearBottom) {
      feed.scrollTop = feed.scrollHeight;
      if (feed.clientHeight > 0) forceScroll = false;
    }
  }

  onAuthStateChanged(auth, function (u) {
    user = u;
    emojiOpen = false;
    renderBottom();
    renderFeed();
  });

  onSnapshot(
    query(collection(db, "chat"), orderBy("createdAt", "desc"), limit(100)),
    function (snap) {
      msgs = snap.docs.map(function (d) {
        return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }));
      }).reverse();
      loaded = true;
      renderFeed();
    },
    function () { loaded = true; msgs = []; renderFeed(); }
  );

  document.getElementById("lang-btn").addEventListener("click", function () {
    renderSwitch();
    renderBottom();
    renderFeed();
  });

  const navK = document.querySelector('nav button[data-page="komunote"]');
  if (navK) {
    navK.addEventListener("click", function () {
      if (view === "chat") {
        forceScroll = true;
        setTimeout(function () { feed.scrollTop = feed.scrollHeight; forceScroll = false; }, 50);
      }
    });
  }

  renderSwitch();
  renderBottom();
  renderFeed();
}

if (root) start();
