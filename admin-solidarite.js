import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch, increment, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("sol");

const TR = ["title_fr", "title_en", "title_es", "description_fr", "description_en", "description_es"];
const TR_LABEL = {
  title_fr: "Tit an franse", title_en: "Tit an anglè", title_es: "Tit an espanyòl",
  description_fr: "Deskripsyon an franse", description_en: "Deskripsyon an anglè", description_es: "Deskripsyon an espanyòl"
};
const BOX = "width:100%;padding:10px;border:1px solid #c9a24a;border-radius:6px;font:inherit;background:#fff";

let editingId = null;
let projectsCache = [];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function input(type) { const i = document.createElement("input"); i.type = type; return i; }
function area() { const a = document.createElement("textarea"); return a; }
function select(opts) {
  const s = document.createElement("select");
  s.style.cssText = BOX;
  opts.forEach(function (o) {
    const op = document.createElement("option");
    op.value = o[0];
    op.textContent = o[1];
    s.appendChild(op);
  });
  return s;
}
function field(parent, label, node) {
  parent.appendChild(el("label", "", label));
  parent.appendChild(node);
  return node;
}
function money(n) { return Number(n || 0).toLocaleString("fr") + " HTG"; }

root.appendChild(el("h2", "", "Solidarite"));
root.appendChild(el("h3", "", "Pwojè"));

const f = {};
f.title = field(root, "Tit pwojè a", input("text"));
f.description = field(root, "Deskripsyon", area());
f.category = field(root, "Kategori", select([["school", "Ekolye"], ["food", "Manje pou prizonye"], ["family", "Fanmi nan bezwen"], ["other", "Lòt"]]));
f.goal = field(root, "Objektif (HTG)", input("number"));
f.collected = field(root, "Montan kolekte (HTG)", input("number"));
f.status = field(root, "Estati", select([["active", "Aktif"], ["closed", "Fèmen"]]));

const det = document.createElement("details");
det.style.marginTop = "14px";
det.appendChild(el("summary", "", "Tradiksyon (opsyonèl)"));
TR.forEach(function (k) {
  f[k] = field(det, TR_LABEL[k], k.indexOf("title") === 0 ? input("text") : area());
});
root.appendChild(det);

const saveBtn = el("button", "btn", "Anrejistre pwojè");
saveBtn.type = "button";
const newBtn = el("button", "btn", "Nouvo");
newBtn.type = "button";
root.appendChild(saveBtn);
root.appendChild(newBtn);
const msg = el("p", "");
msg.style.marginTop = "10px";
root.appendChild(msg);

root.appendChild(el("h3", "", "Lis pwojè yo"));
const projBox = el("div");
root.appendChild(projBox);

root.appendChild(el("h3", "", "Pibliye yon rapò"));
const repSel = select([]);
field(root, "Pwojè", repSel);
const repText = field(root, "Rapò a", area());
const repBtn = el("button", "btn", "Pibliye rapò");
repBtn.type = "button";
root.appendChild(repBtn);
const repMsg = el("p", "");
root.appendChild(repMsg);

root.appendChild(el("h3", "", "Don an atant"));
const donBox = el("div");
root.appendChild(donBox);

function clearForm() {
  editingId = null;
  f.title.value = ""; f.description.value = ""; f.category.value = "school";
  f.goal.value = ""; f.collected.value = "0"; f.status.value = "active";
  TR.forEach(function (k) { f[k].value = ""; });
  msg.textContent = "";
}
newBtn.onclick = clearForm;
clearForm();

saveBtn.onclick = async function () {
  const title = f.title.value.trim();
  if (!title) { msg.textContent = "Tit la obligatwa."; return; }
  const data = {
    title: title,
    description: f.description.value.trim(),
    category: f.category.value,
    goal: Number(f.goal.value) || 0,
    collected: Number(f.collected.value) || 0,
    status: f.status.value,
    updatedAt: serverTimestamp()
  };
  TR.forEach(function (k) { data[k] = f[k].value.trim(); });
  try {
    if (editingId) {
      await setDoc(doc(db, "projects", editingId), data, { merge: true });
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "projects"), data);
    }
    msg.textContent = "Anrejistre ✅";
    clearForm();
    msg.textContent = "Anrejistre ✅";
    loadAll();
  } catch (e) {
    msg.textContent = "Erè: " + (e.code || e.message);
  }
};

async function loadProjects() {
  projBox.textContent = "Chajman...";
  try {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
    projectsCache = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    projBox.textContent = "";
    if (!projectsCache.length) projBox.appendChild(el("p", "", "Poko gen pwojè."));
    repSel.textContent = "";
    projectsCache.forEach(function (p) {
      const op = document.createElement("option");
      op.value = p.id;
      op.textContent = p.title;
      repSel.appendChild(op);

      const row = el("div", "item");
      row.appendChild(el("div", "", p.title + " · " + money(p.collected) + " / " + money(p.goal) + (p.status === "closed" ? " · fèmen" : "")));
      const btns = el("div");
      const ed = el("button", "btn", "Modifye");
      ed.type = "button";
      ed.onclick = function () {
        editingId = p.id;
        f.title.value = p.title || "";
        f.description.value = p.description || "";
        f.category.value = p.category || "other";
        f.goal.value = p.goal || 0;
        f.collected.value = p.collected || 0;
        f.status.value = p.status || "active";
        TR.forEach(function (k) { f[k].value = p[k] || ""; });
        msg.textContent = "Ap modifye: " + p.title;
        f.title.scrollIntoView();
      };
      const del = el("button", "btn danger", "Efase");
      del.type = "button";
      del.onclick = async function () {
        if (!confirm("Efase pwojè " + p.title + " ?")) return;
        try { await deleteDoc(doc(db, "projects", p.id)); loadAll(); }
        catch (e) { msg.textContent = "Erè: " + (e.code || e.message); }
      };
      btns.appendChild(ed);
      btns.appendChild(del);
      row.appendChild(btns);
      projBox.appendChild(row);
    });
  } catch (e) {
    projBox.textContent = "Erè: " + (e.code || e.message);
  }
}

repBtn.onclick = async function () {
  const text = repText.value.trim();
  if (!repSel.value || !text) { repMsg.textContent = "Chwazi yon pwojè epi ekri rapò a."; return; }
  try {
    await addDoc(collection(db, "updates"), { projectId: repSel.value, text: text, createdAt: serverTimestamp() });
    repText.value = "";
    repMsg.textContent = "Rapò pibliye ✅";
  } catch (e) {
    repMsg.textContent = "Erè: " + (e.code || e.message);
  }
};

async function loadDonations() {
  donBox.textContent = "Chajman...";
  try {
    const snap = await getDocs(query(collection(db, "donations"), where("status", "==", "pending")));
    const list = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    list.sort(function (a, b) {
      return (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0) - (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0);
    });
    donBox.textContent = "";
    if (!list.length) { donBox.appendChild(el("p", "", "Pa gen don an atant. ✅")); return; }
    list.forEach(function (d) {
      const proj = projectsCache.find(function (p) { return p.id === d.projectId; });
      const card = el("div", "card");
      card.appendChild(el("div", "ref", (proj ? proj.title : "(pwojè efase)") + " · " + money(d.amount)));
      card.appendChild(el("p", "", d.name + " · " + (d.method === "moncash" ? "MonCash" : "NatCash") + "\nTranzaksyon: " + d.reference));
      card.lastChild.style.whiteSpace = "pre-wrap";

      const ok = el("button", "btn", "Konfime");
      ok.type = "button";
      ok.onclick = async function () {
        if (!confirm("Ou verifye peman an nan " + (d.method === "moncash" ? "MonCash" : "NatCash") + " ? Konfime " + money(d.amount) + " ?")) return;
        try {
          const b = writeBatch(db);
          b.update(doc(db, "donations", d.id), { status: "confirmed", confirmedAt: serverTimestamp() });
          b.update(doc(db, "projects", d.projectId), { collected: increment(d.amount), updatedAt: serverTimestamp() });
          await b.commit();
          loadAll();
        } catch (e) {
          alert("Erè: " + (e.code || e.message));
        }
      };
      const no = el("button", "btn danger", "Refize");
      no.type = "button";
      no.onclick = async function () {
        if (!confirm("Refize don sa a ?")) return;
        try {
          await updateDoc(doc(db, "donations", d.id), { status: "rejected", confirmedAt: serverTimestamp() });
          loadAll();
        } catch (e) {
          alert("Erè: " + (e.code || e.message));
        }
      };
      card.appendChild(ok);
      card.appendChild(no);
      donBox.appendChild(card);
    });
  } catch (e) {
    donBox.textContent = "Erè: " + (e.code || e.message);
  }
}

async function loadAll() {
  await loadProjects();
  await loadDonations();
}

onAuthStateChanged(auth, function (u) {
  if (u && u.uid === ADMIN_UID) loadAll();
});
