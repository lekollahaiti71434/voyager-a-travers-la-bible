import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch, increment, query, orderBy, where, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
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
const MAX_PHOTOS = 6;

let editingId = null;
let projectsCache = [];
const photos = [];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function input(type) { const i = document.createElement("input"); i.type = type; return i; }
function area() { return document.createElement("textarea"); }
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
function projTitle(id) {
  const p = projectsCache.find(function (x) { return x.id === id; });
  return p ? p.title : "(pwojè efase)";
}

/* ---------- Pwojè ---------- */
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
root.appendChild(msg);

root.appendChild(el("h3", "", "Lis pwojè yo"));
const projBox = el("div");
root.appendChild(projBox);

function clearForm() {
  editingId = null;
  f.title.value = ""; f.description.value = ""; f.category.value = "school";
  f.goal.value = ""; f.collected.value = "0"; f.status.value = "active";
  TR.forEach(function (k) { f[k].value = ""; });
}
newBtn.onclick = function () { clearForm(); msg.textContent = ""; };
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
    clearForm();
    msg.textContent = "Anrejistre ✅";
    loadAll();
  } catch (e) {
    msg.textContent = "Erè: " + (e.code || e.message);
  }
};

/* ---------- Rapò (foto + videyo) ---------- */
root.appendChild(el("h3", "", "Pibliye yon rapò (foto ak videyo)"));
const repSel = select([]);
field(root, "Pwojè", repSel);
const repText = field(root, "Rapò a (egzanp: nou bay pat ak savon nan prizon)", area());
const fileI = field(root, "Foto (maksimòm " + MAX_PHOTOS + ")", input("file"));
fileI.accept = "image/*";
fileI.multiple = true;
const thumbs = el("div");
thumbs.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px";
root.appendChild(thumbs);
const vidI = field(root, "Lyen videyo (YouTube, Facebook, Google Drive...). Yon lyen pa liy, maksimòm 3.", area());
vidI.style.minHeight = "70px";
const repBtn = el("button", "btn", "Pibliye rapò");
repBtn.type = "button";
root.appendChild(repBtn);
const repMsg = el("p", "");
root.appendChild(repMsg);

function loadImage(file) {
  return new Promise(function (res, rej) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); res(img); };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
async function compress(file) {
  const img = await loadImage(file);
  const tries = [[1280, 0.72], [1024, 0.6], [800, 0.5]];
  for (let i = 0; i < tries.length; i++) {
    const k = Math.min(1, tries[i][0] / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/jpeg", tries[i][1]).split(",")[1];
    if (data.length <= 700000) return data;
  }
  throw new Error("big");
}
function drawThumbs() {
  thumbs.textContent = "";
  photos.forEach(function (p, i) {
    const w = el("div");
    w.style.position = "relative";
    const im = document.createElement("img");
    im.src = "data:image/jpeg;base64," + p;
    im.style.cssText = "width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px";
    const x = el("button", "btn danger", "✕");
    x.type = "button";
    x.style.cssText = "position:absolute;top:2px;right:2px;margin:0;padding:2px 8px;font-size:.8rem";
    x.onclick = function () { photos.splice(i, 1); drawThumbs(); };
    w.appendChild(im);
    w.appendChild(x);
    thumbs.appendChild(w);
  });
}
fileI.onchange = async function () {
  repMsg.textContent = "Ap prepare foto yo...";
  const files = Array.from(fileI.files);
  for (let i = 0; i < files.length; i++) {
    if (photos.length >= MAX_PHOTOS) break;
    try { photos.push(await compress(files[i])); } catch (e) {}
  }
  fileI.value = "";
  drawThumbs();
  repMsg.textContent = photos.length >= MAX_PHOTOS ? "Maksimòm " + MAX_PHOTOS + " foto." : "";
};

repBtn.onclick = async function () {
  const text = repText.value.trim();
  const vids = vidI.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
  if (!repSel.value || (!text && !photos.length && !vids.length)) {
    repMsg.textContent = "Chwazi yon pwojè epi ajoute tèks, foto oswa videyo.";
    return;
  }
  if (vids.some(function (u) { return !/^https?:\/\//i.test(u); })) {
    repMsg.textContent = "Lyen videyo a dwe kòmanse ak https://";
    return;
  }
  repBtn.disabled = true;
  repMsg.textContent = "Ap pibliye...";
  try {
    const upRef = doc(collection(db, "updates"));
    const b = writeBatch(db);
    photos.forEach(function (p, i) {
      b.set(doc(db, "media", upRef.id + "_" + i), { updateId: upRef.id, n: i, data: p, createdAt: serverTimestamp() });
    });
    b.set(upRef, {
      projectId: repSel.value,
      text: text,
      photoCount: photos.length,
      videos: vids,
      createdAt: serverTimestamp()
    });
    await b.commit();
    repText.value = "";
    vidI.value = "";
    photos.length = 0;
    drawThumbs();
    repMsg.textContent = "Rapò pibliye ✅";
    loadReports();
  } catch (e) {
    repMsg.textContent = "Erè: " + (e.code || e.message);
  }
  repBtn.disabled = false;
};

root.appendChild(el("h3", "", "Dènye rapò yo"));
const repBox = el("div");
root.appendChild(repBox);

async function loadReports() {
  repBox.textContent = "Chajman...";
  try {
    const snap = await getDocs(query(collection(db, "updates"), orderBy("createdAt", "desc"), limit(20)));
    repBox.textContent = "";
    if (snap.empty) { repBox.appendChild(el("p", "", "Poko gen rapò.")); return; }
    snap.forEach(function (s) {
      const u = s.data();
      const when = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString("fr") : "";
      const n = Number(u.photoCount) || 0;
      const v = (u.videos || []).length;
      const label = projTitle(u.projectId) + " · " + when + (n ? " · 📷" + n : "") + (v ? " · 🎬" + v : "") + "\n" + (u.text || "").slice(0, 80);
      const row = el("div", "item");
      const info = el("div", "", label);
      info.style.whiteSpace = "pre-wrap";
      row.appendChild(info);
      const del = el("button", "btn danger", "Efase");
      del.type = "button";
      del.onclick = async function () {
        if (!confirm("Efase rapò sa a (ak foto yo)?")) return;
        try {
          const b = writeBatch(db);
          b.delete(doc(db, "updates", s.id));
          for (let i = 0; i < n; i++) b.delete(doc(db, "media", s.id + "_" + i));
          await b.commit();
          loadReports();
        } catch (e) {
          repMsg.textContent = "Erè: " + (e.code || e.message);
        }
      };
      row.appendChild(del);
      repBox.appendChild(row);
    });
  } catch (e) {
    repBox.textContent = "Erè: " + (e.code || e.message);
  }
}

/* ---------- Pwojè: lis ---------- */
async function loadProjects() {
  projBox.textContent = "Chajman...";
  try {
    const snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
    projectsCache = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    projBox.textContent = "";
    if (!projectsCache.length) projBox.appendChild(el("p", "", "Poko gen pwojè."));
    const keep = repSel.value;
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
    if (keep) repSel.value = keep;
  } catch (e) {
    projBox.textContent = "Erè: " + (e.code || e.message);
  }
}

/* ---------- Don an atant ---------- */
root.appendChild(el("h3", "", "Don an atant"));
const donBox = el("div");
root.appendChild(donBox);

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
      const card = el("div", "card");
      card.appendChild(el("div", "ref", projTitle(d.projectId) + " · " + money(d.amount)));
      const info = el("p", "", d.name + " · " + (d.method === "moncash" ? "MonCash" : "NatCash") + "\nTranzaksyon: " + d.reference);
      info.style.whiteSpace = "pre-wrap";
      card.appendChild(info);

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
  await loadReports();
  await loadDonations();
}

onAuthStateChanged(auth, function (u) {
  if (u && u.uid === ADMIN_UID) loadAll();
});
