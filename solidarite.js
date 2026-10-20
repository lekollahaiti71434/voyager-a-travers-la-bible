import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const MONCASH = "+509 3608 7837";
const NATCASH = "+509 5621 9097";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("solidarite-content");

const L = {
  ht: { intro: "Ede moun ki nan bezwen atravè pwojè solidarite yo.", goal: "Objektif", raised: "Kolekte",
        donate: "Fè yon don", close: "Fèmen",
        how: "1) Voye lajan an sou MonCash oswa NatCash nan nimewo ki anba a. 2) Antre montan an ak nimewo tranzaksyon an nan fòm nan. 3) Administratè a verifye peman an anvan l konte l nan total la.",
        copy: "Kopye", copied: "Kopye ✓", method: "Metòd", amount: "Montan (HTG)", reference: "Nimewo tranzaksyon",
        submit: "Voye don an", needLogin: "Konekte nan seksyon Kominote a pou fè yon don.",
        sent: "Mèsi! Don ou an anrejistre, li an atant verifikasyon.", myDon: "Don mwen yo",
        pending: "An atant", confirmed: "Konfime", rejected: "Refize", reports: "Rapò", noReports: "Poko gen rapò.",
        empty: "Poko gen pwojè pou kounye a.", loading: "Chajman...", closedLbl: "Pwojè sa a fèmen.",
        generic: "Yon erè rive. Eseye ankò.", invalid: "Verifye montan an ak nimewo tranzaksyon an (omwen 3 karaktè).",
        cats: { school: "Ekolye", food: "Manje pou prizonye", family: "Fanmi nan bezwen", other: "Lòt" } },
  fr: { intro: "Aidez les personnes dans le besoin grâce aux projets de solidarité.", goal: "Objectif", raised: "Collecté",
        donate: "Faire un don", close: "Fermer",
        how: "1) Envoyez l'argent par MonCash ou NatCash au numéro ci-dessous. 2) Saisissez le montant et le numéro de transaction dans le formulaire. 3) L'administrateur vérifie le paiement avant de l'ajouter au total.",
        copy: "Copier", copied: "Copié ✓", method: "Méthode", amount: "Montant (HTG)", reference: "Numéro de transaction",
        submit: "Envoyer le don", needLogin: "Connectez-vous dans la section Communauté pour faire un don.",
        sent: "Merci ! Votre don est enregistré, en attente de vérification.", myDon: "Mes dons",
        pending: "En attente", confirmed: "Confirmé", rejected: "Refusé", reports: "Rapports", noReports: "Aucun rapport pour le moment.",
        empty: "Aucun projet pour le moment.", loading: "Chargement...", closedLbl: "Ce projet est clôturé.",
        generic: "Une erreur est survenue. Réessayez.", invalid: "Vérifiez le montant et le numéro de transaction (3 caractères min.).",
        cats: { school: "Écoliers", food: "Nourriture pour prisonniers", family: "Familles dans le besoin", other: "Autre" } },
  en: { intro: "Help people in need through our solidarity projects.", goal: "Goal", raised: "Raised",
        donate: "Donate", close: "Close",
        how: "1) Send the money by MonCash or NatCash to the number below. 2) Enter the amount and transaction number in the form. 3) The administrator verifies the payment before adding it to the total.",
        copy: "Copy", copied: "Copied ✓", method: "Method", amount: "Amount (HTG)", reference: "Transaction number",
        submit: "Submit donation", needLogin: "Log in from the Community section to donate.",
        sent: "Thank you! Your donation is recorded and awaiting verification.", myDon: "My donations",
        pending: "Pending", confirmed: "Confirmed", rejected: "Rejected", reports: "Reports", noReports: "No reports yet.",
        empty: "No projects yet.", loading: "Loading...", closedLbl: "This project is closed.",
        generic: "Something went wrong. Try again.", invalid: "Check the amount and transaction number (min. 3 characters).",
        cats: { school: "Schoolchildren", food: "Food for prisoners", family: "Families in need", other: "Other" } },
  es: { intro: "Ayuda a quienes lo necesitan con nuestros proyectos de solidaridad.", goal: "Meta", raised: "Recaudado",
        donate: "Donar", close: "Cerrar",
        how: "1) Envía el dinero por MonCash o NatCash al número de abajo. 2) Escribe el monto y el número de transacción en el formulario. 3) El administrador verifica el pago antes de sumarlo al total.",
        copy: "Copiar", copied: "Copiado ✓", method: "Método", amount: "Monto (HTG)", reference: "Número de transacción",
        submit: "Enviar donación", needLogin: "Inicia sesión en la sección Comunidad para donar.",
        sent: "¡Gracias! Tu donación quedó registrada y está pendiente de verificación.", myDon: "Mis donaciones",
        pending: "Pendiente", confirmed: "Confirmada", rejected: "Rechazada", reports: "Informes", noReports: "Aún no hay informes.",
        empty: "Aún no hay proyectos.", loading: "Cargando...", closedLbl: "Este proyecto está cerrado.",
        generic: "Ocurrió un error. Inténtalo de nuevo.", invalid: "Revisa el monto y el número de transacción (mín. 3 caracteres).",
        cats: { school: "Escolares", food: "Comida para presos", family: "Familias necesitadas", other: "Otro" } }
};

let user = null;
let projects = [];
let updates = [];
let myDon = [];
let loaded = false;
let openId = null;
let form = { method: "moncash", amount: "", ref: "" };
let note = "";
let info = "";
let unsubDon = null;

function lang() {
  let l = "ht";
  try { l = localStorage.getItem("lang") || "ht"; } catch (e) {}
  return L[l] ? l : "ht";
}
function loc() { return lang() === "ht" ? "fr" : lang(); }
function t() { return L[lang()]; }
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
function money(n) { return Number(n || 0).toLocaleString(loc()) + " HTG"; }
function tsMs(x) { return x && x.toMillis ? x.toMillis() : 0; }

function phoneRow(label, number) {
  const s = t();
  const row = el("div", "sphone");
  row.appendChild(el("span", "", label + ": " + number));
  const b = el("button", "ssmall", s.copy);
  b.type = "button";
  b.onclick = function () {
    try {
      navigator.clipboard.writeText(number.replace(/\s/g, "")).then(function () { b.textContent = s.copied; });
    } catch (e) {}
  };
  row.appendChild(b);
  return row;
}

function donatePanel(p) {
  const s = t();
  const panel = el("div", "spanel");
  if (!user) {
    panel.appendChild(el("p", "", s.needLogin));
    return panel;
  }
  panel.appendChild(el("p", "", s.how));
  panel.appendChild(phoneRow("MonCash", MONCASH));
  panel.appendChild(phoneRow("NatCash", NATCASH));

  const sel = document.createElement("select");
  [["moncash", "MonCash"], ["natcash", "NatCash"]].forEach(function (o) {
    const op = document.createElement("option");
    op.value = o[0];
    op.textContent = o[1];
    sel.appendChild(op);
  });
  sel.value = form.method;
  sel.onchange = function () { form.method = sel.value; };

  const am = document.createElement("input");
  am.type = "number";
  am.inputMode = "numeric";
  am.min = "1";
  am.placeholder = s.amount;
  am.value = form.amount;
  am.oninput = function () { form.amount = am.value; };

  const rf = document.createElement("input");
  rf.type = "text";
  rf.maxLength = 60;
  rf.placeholder = s.reference;
  rf.value = form.ref;
  rf.oninput = function () { form.ref = rf.value; };

  panel.appendChild(sel);
  panel.appendChild(am);
  panel.appendChild(rf);

  const send = el("button", "sbtn", s.submit);
  send.type = "button";
  send.onclick = async function () {
    note = ""; info = "";
    const amount = Number(form.amount);
    const ref = form.ref.trim();
    if (!(amount >= 1) || ref.length < 3) { note = s.invalid; render(); return; }
    send.disabled = true;
    try {
      await addDoc(collection(db, "donations"), {
        projectId: p.id,
        uid: user.uid,
        name: (user.displayName || "").slice(0, 40) || "?",
        amount: amount,
        method: form.method,
        reference: ref,
        status: "pending",
        createdAt: serverTimestamp()
      });
      form = { method: form.method, amount: "", ref: "" };
      info = s.sent;
    } catch (e) {
      note = s.generic;
    }
    render();
  };
  panel.appendChild(send);
  if (note) panel.appendChild(el("p", "snote", note));
  if (info) panel.appendChild(el("p", "sinfo", info));
  return panel;
}

const ML = {
  ht: { photos: "Wè foto yo", video: "Gade videyo", loadErr: "Pa kapab chaje foto yo." },
  fr: { photos: "Voir les photos", video: "Regarder la vidéo", loadErr: "Impossible de charger les photos." },
  en: { photos: "View photos", video: "Watch video", loadErr: "Unable to load photos." },
  es: { photos: "Ver fotos", video: "Ver video", loadErr: "No se pudieron cargar las fotos." }
};
const photoCache = {};

function ytId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : null; }

function lightbox(src) {
  const o = el("div", "slight");
  const im = document.createElement("img");
  im.src = src;
  o.appendChild(im);
  o.onclick = function () { o.remove(); };
  document.body.appendChild(o);
}

function mediaBlock(u) {
  const m = ML[lang()];
  const box = el("div", "smedia");
  const n = Number(u.photoCount) || 0;
  if (n > 0) {
    const grid = el("div", "sgrid");
    const b = el("button", "ssmall", "📷 " + m.photos + " (" + n + ")");
    b.type = "button";
    b.onclick = async function () {
      b.disabled = true;
      b.textContent = "...";
      try {
        const srcs = [];
        for (let i = 0; i < n; i++) {
          const key = u.id + "_" + i;
          if (!photoCache[key]) {
            const snap = await getDoc(doc(db, "media", key));
            if (snap.exists()) photoCache[key] = "data:image/jpeg;base64," + snap.data().data;
          }
          if (photoCache[key]) srcs.push(photoCache[key]);
        }
        grid.textContent = "";
        srcs.forEach(function (src) {
          const im = document.createElement("img");
          im.src = src;
          im.onclick = function () { lightbox(src); };
          grid.appendChild(im);
        });
        b.remove();
      } catch (e) {
        b.disabled = false;
        b.textContent = m.loadErr;
      }
    };
    box.appendChild(b);
    box.appendChild(grid);
  }
  (u.videos || []).forEach(function (url) {
    const href = safeUrl(url);
    if (!href) return;
    const id = ytId(url);
    const holder = el("div", "svideo");
    const b = el("button", "ssmall", "🎬 " + m.video);
    b.type = "button";
    b.onclick = function () {
      if (id) {
        const fr = document.createElement("iframe");
        fr.src = "https://www.youtube-nocookie.com/embed/" + id;
        fr.allow = "encrypted-media; picture-in-picture; fullscreen";
        fr.allowFullscreen = true;
        holder.textContent = "";
        holder.appendChild(fr);
      } else {
        window.open(href, "_blank", "noopener");
      }
    };
    holder.appendChild(b);
    box.appendChild(holder);
  });
  return box;
}
function card(p) {
  const s = t();
  const c = el("div", "scard");
  c.appendChild(el("div", "scat", s.cats[p.category] || s.cats.other));
  c.appendChild(el("h3", "", pick(p, "title")));
  c.appendChild(el("p", "sdesc", pick(p, "description")));

  const goal = Number(p.goal) || 0;
  const got = Number(p.collected) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((got / goal) * 100)) : 0;
  const bar = el("div", "sbar");
  const fill = document.createElement("i");
  fill.style.width = pct + "%";
  bar.appendChild(fill);
  c.appendChild(bar);
  c.appendChild(el("div", "snums", s.raised + ": " + money(got) + " / " + s.goal + ": " + money(goal) + " (" + pct + "%)"));

  if (p.status === "closed") {
    c.appendChild(el("p", "snums", s.closedLbl));
  } else {
    const isOpen = openId === p.id;
    const b = el("button", "sbtn", isOpen ? s.close : s.donate);
    b.type = "button";
    b.onclick = function () {
      openId = isOpen ? null : p.id;
      note = ""; info = "";
      form = { method: "moncash", amount: "", ref: "" };
      render();
    };
    c.appendChild(b);
    if (isOpen) c.appendChild(donatePanel(p));
  }

  const reps = updates.filter(function (u) { return u.projectId === p.id; });
  const det = document.createElement("details");
  det.appendChild(el("summary", "", s.reports + " (" + reps.length + ")"));
  if (!reps.length) det.appendChild(el("p", "snums", s.noReports));
  reps.forEach(function (u) {
    const r = el("div", "srep", u.text || "");
    const when = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString(loc(), { day: "numeric", month: "long", year: "numeric" }) : "";
    r.appendChild(el("small", "", when));
    r.appendChild(mediaBlock(u));
    det.appendChild(r);
  });
  c.appendChild(det);
  return c;
}

function render() {
  const s = t();
  root.textContent = "";
  root.appendChild(el("p", "sintro", s.intro));
  if (!loaded) { root.appendChild(el("p", "", s.loading)); return; }
  if (!projects.length) { root.appendChild(el("p", "", s.empty)); }
  projects.forEach(function (p) { root.appendChild(card(p)); });

  if (user && myDon.length) {
    root.appendChild(el("h3", "", s.myDon));
    myDon.slice().sort(function (a, b) { return tsMs(b.createdAt) - tsMs(a.createdAt); }).forEach(function (d) {
      const proj = projects.find(function (p) { return p.id === d.projectId; });
      const row = el("div", "sdon");
      row.appendChild(el("span", "", (proj ? pick(proj, "title") : "—") + " · " + money(d.amount)));
      const st = { pending: s.pending, confirmed: s.confirmed, rejected: s.rejected }[d.status] || d.status;
      row.appendChild(el("b", "s-" + d.status, st));
      root.appendChild(row);
    });
  }
}

onSnapshot(
  query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(50)),
  function (snap) {
    projects = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" })); });
    loaded = true;
    render();
  },
  function () { loaded = true; projects = []; render(); }
);

onSnapshot(
  query(collection(db, "updates"), orderBy("createdAt", "desc"), limit(100)),
  function (snap) {
    updates = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" })); });
    render();
  },
  function () {}
);

onAuthStateChanged(auth, function (u) {
  user = u;
  if (unsubDon) { unsubDon(); unsubDon = null; }
  myDon = [];
  if (u) {
    unsubDon = onSnapshot(
      query(collection(db, "donations"), where("uid", "==", u.uid)),
      function (snap) {
        myDon = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" })); });
        render();
      },
      function () {}
    );
  }
  render();
});

document.getElementById("lang-btn").addEventListener("click", render);
render();
