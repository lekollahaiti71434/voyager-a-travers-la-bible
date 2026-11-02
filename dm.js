import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, deleteDoc, writeBatch, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const MAX = 1000;
const root = document.getElementById("komunote-content");

const L = {
  ht: { writeAdmin: "Ekri Administratè a", admin: "Administratè", empty: "Poko gen konvèsasyon prive. Peze sou foto oswa non yon manb pou ekri l an prive.",
        back: "Retounen", placeholder: "Ekri yon mesaj prive...", send: "Voye", left: "karaktè rete", del: "Efase",
        confirmDel: "Efase mesaj sa a?", today: "Jodi a", yesterday: "Yè", needLogin: "Konekte pou itilize mesaj prive yo.",
        generic: "Yon erè rive. Eseye ankò.", loading: "Chajman...", secure: "🔒 Se sèlman ou ak {name} ki wè mesaj sa yo.",
        noMsgs: "Poko gen mesaj. Di bonjou!", you: "Ou: " },
  fr: { writeAdmin: "Écrire à l'administrateur", admin: "Administrateur", empty: "Aucune conversation privée. Touchez la photo ou le nom d'un membre pour lui écrire en privé.",
        back: "Retour", placeholder: "Écrivez un message privé...", send: "Envoyer", left: "caractères restants", del: "Supprimer",
        confirmDel: "Supprimer ce message ?", today: "Aujourd'hui", yesterday: "Hier", needLogin: "Connectez-vous pour utiliser les messages privés.",
        generic: "Une erreur est survenue. Réessayez.", loading: "Chargement...", secure: "🔒 Seuls vous et {name} voyez ces messages.",
        noMsgs: "Aucun message. Dites bonjour !", you: "Vous : " },
  en: { writeAdmin: "Message the administrator", admin: "Administrator", empty: "No private conversations yet. Tap a member's photo or name to message them privately.",
        back: "Back", placeholder: "Write a private message...", send: "Send", left: "characters left", del: "Delete",
        confirmDel: "Delete this message?", today: "Today", yesterday: "Yesterday", needLogin: "Log in to use private messages.",
        generic: "Something went wrong. Try again.", loading: "Loading...", secure: "🔒 Only you and {name} can see these messages.",
        noMsgs: "No messages yet. Say hello!", you: "You: " },
  es: { writeAdmin: "Escribir al administrador", admin: "Administrador", empty: "Aún no hay conversaciones privadas. Toca la foto o el nombre de un miembro para escribirle en privado.",
        back: "Volver", placeholder: "Escribe un mensaje privado...", send: "Enviar", left: "caracteres restantes", del: "Eliminar",
        confirmDel: "¿Eliminar este mensaje?", today: "Hoy", yesterday: "Ayer", needLogin: "Inicia sesión para usar los mensajes privados.",
        generic: "Ocurrió un error. Inténtalo de nuevo.", loading: "Cargando...", secure: "🔒 Solo tú y {name} pueden ver estos mensajes.",
        noMsgs: "Aún no hay mensajes. ¡Saluda!", you: "Tú: " }
};

const COLORS = ["#b5651d", "#2a7a8c", "#8e44ad", "#c0392b", "#27ae60", "#2c3e50", "#d35400"];
const EMOJIS = ["🙏", "❤️", "😊", "😇", "🙌", "✝️", "🕊️", "📖", "🔥", "✨", "👍", "👏", "😂", "😢", "😍", "🥰", "😮", "🤗", "💪", "🌟", "🌹", "🎉", "😅", "🤝", "😉", "😌", "🙂", "😁", "😎", "🤲", "💛", "😭", "🙄", "😴", "🤔", "👋", "💐", "☀️", "🌈", "😔"];
const SEND_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

const st = document.createElement("style");
st.textContent = "nav button.has-dm::after{content:'';display:inline-block;width:9px;height:9px;margin-left:6px;border-radius:50%;background:#f2b632;box-shadow:0 0 0 2px rgba(242,182,50,.35);vertical-align:super}";
document.head.appendChild(st);

function start() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user = null;
  let convs = [];
  let loadedC = false;
  let active = null;
  let msgs = [];
  let loadedM = false;
  let draft = "";
  let emojiOpen = false;
  let forceScroll = true;
  let unsubC = null;
  let unsubM = null;
  let cvFeed = null;
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
  function timeLabel(d) {
    if (!d) return "";
    if (sameDay(d, new Date())) return d.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString(loc(), { day: "numeric", month: "short" });
  }
  function fetchProfile(uid) {
    if (uid in profiles || pending[uid]) return;
    pending[uid] = getDoc(doc(db, "profiles", uid))
      .then(function (s) { profiles[uid] = s.exists() ? s.data() : null; })
      .catch(function () { profiles[uid] = null; })
      .then(function () { delete pending[uid]; if (active) renderHeaderOnly(); else if (user) renderList(); });
  }
  function nameOf(uid, fallback) { return (profiles[uid] && profiles[uid].name) || fallback || ""; }
  function displayName(uid, fallback) {
    const base = nameOf(uid, fallback);
    if (uid === ADMIN_UID) {
      const a = t().admin;
      return base && base !== a ? base + " · " + a : a;
    }
    return base || "?";
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

  function seenKey(id) { return "dmseen_" + id; }
  function getSeen(id) { try { return Number(localStorage.getItem(seenKey(id))) || 0; } catch (e) { return 0; } }
  function markSeen(id, ms) { try { localStorage.setItem(seenKey(id), String(Math.max(Date.now(), ms || 0))); } catch (e) {} }
  function lastMs(c) { return c.lastAt && c.lastAt.toMillis ? c.lastAt.toMillis() : 0; }
  function isUnread(c) { return !!(user && c.lastBy && c.lastBy !== user.uid && lastMs(c) > getSeen(c.id)); }
  function otherOf(c) {
    return (c.members || []).find(function (x) { return user && x !== user.uid; }) || null;
  }
  function updateBadge() {
    const n = user ? convs.filter(isUnread).length : 0;
    const b = document.querySelector('nav button[data-page="komunote"]');
    if (b) b.classList.toggle("has-dm", n > 0);
  }

  const panel = el("div", "dmpanel");
  root.appendChild(panel);

  function render() {
    panel.textContent = "";
    cvFeed = null;
    if (!user) { panel.appendChild(el("p", "cnote", t().needLogin)); return; }
    if (active) renderConv(); else renderList();
  }

  function renderList() {
    if (active) return;
    const s = t();
    panel.textContent = "";
    const wrap = el("div", "dmlist");
    if (user.uid !== ADMIN_UID) {
      const b = el("button", "kbtn", "🛡️ " + s.writeAdmin);
      b.type = "button";
      b.onclick = function () { openConv(ADMIN_UID, ""); };
      wrap.appendChild(b);
    }
    if (!loadedC) wrap.appendChild(el("p", "cnote", s.loading));
    else if (!convs.length) wrap.appendChild(el("p", "cnote", s.empty));
    convs.forEach(function (c) {
      const ou = otherOf(c);
      if (!ou) return;
      fetchProfile(ou);
      const fb = (c.names && c.names[ou]) || "";
      const nm = displayName(ou, fb);
      const row = el("div", "dmrow");
      row.onclick = function () { openConv(ou, fb); };
      row.appendChild(avatar(ou, nameOf(ou, fb) || nm, "mid"));
      const body = el("div", "dmbody");
      body.appendChild(el("div", "dmname", nm));
      body.appendChild(el("div", "dmprev", (c.lastBy === user.uid ? s.you : "") + (c.lastText || "")));
      row.appendChild(body);
      const meta = el("div", "dmmeta");
      meta.appendChild(el("span", "", timeLabel(c.lastAt && c.lastAt.toDate ? c.lastAt.toDate() : null)));
      if (isUnread(c)) meta.appendChild(el("span", "dmdot"));
      row.appendChild(meta);
      wrap.appendChild(row);
    });
    panel.appendChild(wrap);
  }

  let headTitle = null;
  let headAvatarBox = null;
  function renderHeaderOnly() {
    if (!active || !headTitle) return;
    const nm = displayName(active.uid, active.name);
    headTitle.textContent = nm;
    headAvatarBox.textContent = "";
    headAvatarBox.appendChild(avatar(active.uid, nameOf(active.uid, active.name) || nm, "mid"));
    renderMsgs();
  }

  function renderConv() {
    const s = t();
    const bar = el("div", "dmbar");
    const back = el("button", "kmic", "←");
    back.type = "button";
    back.setAttribute("aria-label", s.back);
    back.onclick = closeConv;
    bar.appendChild(back);
    headAvatarBox = el("div");
    bar.appendChild(headAvatarBox);
    headTitle = el("div", "dmtitle");
    bar.appendChild(headTitle);
    panel.appendChild(bar);
    cvFeed = el("div", "cfeed");
    const bottom = el("div", "cbottom");
    panel.appendChild(cvFeed);
    panel.appendChild(bottom);
    renderComposer(bottom);
    renderHeaderOnly();
  }

  function renderMsgs() {
    if (!cvFeed || !active) return;
    const s = t();
    const nearBottom = cvFeed.scrollHeight - cvFeed.scrollTop - cvFeed.clientHeight < 150;
    cvFeed.textContent = "";
    const nm = displayName(active.uid, active.name);
    cvFeed.appendChild(el("div", "cnote", s.secure.replace("{name}", nm)));
    if (!loadedM) { cvFeed.appendChild(el("p", "cnote", s.loading)); return; }
    if (!msgs.length) { cvFeed.appendChild(el("p", "cnote", s.noMsgs)); return; }
    let lastDay = null;
    msgs.forEach(function (m) {
      const dt = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : null;
      if (dt && (!lastDay || !sameDay(dt, lastDay))) {
        lastDay = dt;
        cvFeed.appendChild(el("div", "cday", dayLabel(dt)));
      }
      const own = m.uid === user.uid;
      const box = el("div", "cmsg" + (own ? " own" : ""));
      box.appendChild(el("div", "ctext", m.text || ""));
      const foot = el("div", "cfoot");
      if (own) {
        const d = el("button", "cdel", s.del);
        d.type = "button";
        d.onclick = async function () {
          if (!confirm(s.confirmDel)) return;
          try { await deleteDoc(doc(db, "convs", active.id, "msgs", m.id)); } catch (e) {}
        };
        foot.appendChild(d);
      }
      foot.appendChild(el("span", "", dt ? dt.toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" }) : ""));
      box.appendChild(foot);
      cvFeed.appendChild(box);
    });
    if (forceScroll || nearBottom) {
      cvFeed.scrollTop = cvFeed.scrollHeight;
      if (cvFeed.clientHeight > 0) forceScroll = false;
    }
  }

  async function sendMsg(text) {
    const me = user.uid;
    const other = active.uid;
    const id = active.id;
    const myName = (user.displayName || "").slice(0, 40) || "?";
    const otherName = (nameOf(other, active.name) || "?").slice(0, 40);
    const names = {};
    names[me] = myName;
    names[other] = otherName;
    const b = writeBatch(db);
    b.set(doc(db, "convs", id), {
      members: [me, other].sort(),
      names: names,
      lastText: text.slice(0, 100),
      lastBy: me,
      lastAt: serverTimestamp()
    }, { merge: true });
    b.set(doc(collection(db, "convs", id, "msgs")), {
      uid: me, name: myName, text: text, createdAt: serverTimestamp()
    });
    forceScroll = true;
    await b.commit();
  }

  function renderComposer(bottom) {
    const s = t();
    bottom.textContent = "";
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
    emo.onclick = function () { draft = ta.value; emojiOpen = !emojiOpen; renderComposer(bottom); };
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
        await sendMsg(text);
        draft = "";
        emojiOpen = false;
        renderComposer(bottom);
        return;
      } catch (e) {
        line.className = "knote";
        line.textContent = s.generic;
      }
      send.disabled = false;
    };
  }

  function openConv(uid, name) {
    if (!user || uid === user.uid) return;
    const id = [user.uid, uid].sort().join("_");
    active = { id: id, uid: uid, name: name || "" };
    msgs = [];
    loadedM = false;
    draft = "";
    emojiOpen = false;
    forceScroll = true;
    if (unsubM) unsubM();
    fetchProfile(uid);
    const c = convs.find(function (x) { return x.id === id; });
    markSeen(id, c ? lastMs(c) : 0);
    updateBadge();
    render();
    unsubM = onSnapshot(
      query(collection(db, "convs", id, "msgs"), orderBy("createdAt", "desc"), limit(100)),
      function (snap) {
        if (!active || active.id !== id) return;
        msgs = snap.docs.map(function (d) {
          return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }));
        }).reverse();
        loadedM = true;
        markSeen(id, 0);
        updateBadge();
        renderMsgs();
      },
      function () { loadedM = true; msgs = []; renderMsgs(); }
    );
  }
  function closeConv() {
    if (unsubM) { unsubM(); unsubM = null; }
    active = null;
    msgs = [];
    emojiOpen = false;
    updateBadge();
    render();
  }

  function subscribeConvs() {
    if (unsubC) { unsubC(); unsubC = null; }
    convs = [];
    loadedC = false;
    if (!user) return;
    unsubC = onSnapshot(
      query(collection(db, "convs"), where("members", "array-contains", user.uid)),
      function (snap) {
        convs = snap.docs.map(function (d) {
          return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" }));
        }).sort(function (a, b) { return lastMs(b) - lastMs(a); });
        loadedC = true;
        if (active) {
          const c = convs.find(function (x) { return x.id === active.id; });
          if (c) markSeen(active.id, lastMs(c));
        }
        updateBadge();
        if (!active) renderList();
      },
      function () { loadedC = true; convs = []; if (!active) renderList(); }
    );
  }

  onAuthStateChanged(auth, function (u) {
    user = u;
    if (unsubM) { unsubM(); unsubM = null; }
    active = null;
    msgs = [];
    emojiOpen = false;
    subscribeConvs();
    updateBadge();
    render();
  });

  window.addEventListener("kview", function (e) {
    if (e.detail === "dm") render();
  });
  window.addEventListener("open-dm", function (e) {
    if (!e.detail) return;
    if (!user) { alert(t().needLogin); return; }
    if (e.detail.uid === user.uid) return;
    const btns = document.querySelectorAll(".cswitch button");
    if (btns[2]) btns[2].click();
    openConv(e.detail.uid, e.detail.name);
  });
  document.getElementById("lang-btn").addEventListener("click", function () {
    if (active) { render(); } else { renderList(); }
  });

  render();
}

if (root) start();
