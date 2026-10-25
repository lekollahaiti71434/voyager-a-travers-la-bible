import "./admin-dashboard.js";
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, writeBatch, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const root = document.getElementById("mod");

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

root.appendChild(el("h2", "", "Siyalman"));
const refresh = el("button", "btn", "Rafrechi");
refresh.type = "button";
root.appendChild(refresh);
const list = el("div");
root.appendChild(list);
root.appendChild(el("h3", "", "Itilizatè bloke"));
const blockedBox = el("div");
root.appendChild(blockedBox);

async function loadReports() {
  list.textContent = "Chajman...";
  try {
    const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)));
    const groups = {};
    snap.forEach(function (s) {
      const d = s.data();
      if (!groups[d.postId]) groups[d.postId] = { postId: d.postId, postUid: d.postUid, ids: [] };
      groups[d.postId].ids.push(s.id);
    });
    list.textContent = "";
    const keys = Object.keys(groups);
    if (!keys.length) { list.appendChild(el("p", "", "Pa gen siyalman. ✅")); return; }

    for (const k of keys) {
      const g = groups[k];
      const ps = await getDoc(doc(db, "posts", g.postId));
      if (!ps.exists()) {
        const b = writeBatch(db);
        g.ids.forEach(function (id) { b.delete(doc(db, "reports", id)); });
        await b.commit();
        continue;
      }
      const p = ps.data();
      const card = el("div", "card");
      card.appendChild(el("div", "ref", (p.name || "?") + " · " + g.ids.length + " siyalman"));
      card.appendChild(el("p", "verse", p.type === "voice" ? "🎤 Vokal (" + Math.round(p.duration || 0) + " s)" : (p.type === "image" ? "🖼️ Foto" : (p.text || ""))));
      if (p.type === "image" && p.thumb) {
        const im = document.createElement("img");
        im.src = "data:image/jpeg;base64," + p.thumb;
        im.style.cssText = "max-width:180px;border-radius:8px;display:block;margin:8px 0";
        card.appendChild(im);
      }

      const del = el("button", "btn danger", "Efase mesaj");
      del.type = "button";
      del.onclick = async function () {
        if (!confirm("Efase mesaj sa a?")) return;
        const b = writeBatch(db);
        b.delete(doc(db, "posts", g.postId));
        if (p.type === "voice") b.delete(doc(db, "audios", g.postId));
        if (p.type === "image") b.delete(doc(db, "images", g.postId));
        g.ids.forEach(function (id) { b.delete(doc(db, "reports", id)); });
        await b.commit();
        loadReports();
      };
      const blk = el("button", "btn danger", "Bloke itilizatè");
      blk.type = "button";
      blk.onclick = async function () {
        if (!confirm("Bloke " + (p.name || "itilizatè sa a") + " ? Li pap ka voye mesaj ankò.")) return;
        await setDoc(doc(db, "blocked", g.postUid), { name: p.name || "?", createdAt: serverTimestamp() });
        loadBlocked();
      };
      const ign = el("button", "btn", "Ignore");
      ign.type = "button";
      ign.onclick = async function () {
        const b = writeBatch(db);
        g.ids.forEach(function (id) { b.delete(doc(db, "reports", id)); });
        await b.commit();
        loadReports();
      };
      card.appendChild(del);
      card.appendChild(blk);
      card.appendChild(ign);
      list.appendChild(card);
    }
  } catch (e) {
    list.textContent = "Erè: " + (e.code || e.message);
  }
}

async function loadBlocked() {
  blockedBox.textContent = "Chajman...";
  try {
    const snap = await getDocs(collection(db, "blocked"));
    blockedBox.textContent = "";
    if (snap.empty) { blockedBox.appendChild(el("p", "", "Pesonn pa bloke.")); return; }
    snap.forEach(function (s) {
      const row = el("div", "item");
      row.appendChild(el("div", "", (s.data().name || "?") + " (" + s.id.slice(0, 6) + "…)"));
      const un = el("button", "btn", "Debloke");
      un.type = "button";
      un.onclick = async function () {
        const b = writeBatch(db);
        b.delete(doc(db, "blocked", s.id));
        await b.commit();
        loadBlocked();
      };
      row.appendChild(un);
      blockedBox.appendChild(row);
    });
  } catch (e) {
    blockedBox.textContent = "Erè: " + (e.code || e.message);
  }
}

refresh.onclick = function () { loadReports(); loadBlocked(); };

onAuthStateChanged(auth, function (u) {
  if (u && u.uid === ADMIN_UID) { loadReports(); loadBlocked(); }
});
