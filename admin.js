import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, writeBatch, collection, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = function (id) { return document.getElementById(id); };
const EXTRA = ["verset_fr", "verset_en", "verset_es", "reflexion_fr", "reflexion_en", "reflexion_es"];

let photoData = null;
let photoSrc = null;
let photoExisting = false;
let photoRemove = false;
let loadedDate = null;

function msg(t) { $("msg").textContent = t; }
function today() {
  const n = new Date();
  const p = function (x) { return String(x).padStart(2, "0"); };
  return n.getFullYear() + "-" + p(n.getMonth() + 1) + "-" + p(n.getDate());
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

/* ---------- Foto vèsè a ---------- */
const pBlock = el("div");
pBlock.appendChild(el("label", "", "Foto vèsè a (opsyonèl)"));
const pFile = document.createElement("input");
pFile.type = "file";
pFile.accept = "image/*";
pBlock.appendChild(pFile);
const pImg = document.createElement("img");
pImg.style.cssText = "display:none;width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-top:8px";
pBlock.appendChild(pImg);
const pRm = el("button", "btn danger", "Retire foto a");
pRm.type = "button";
pRm.style.display = "none";
pBlock.appendChild(pRm);
const pMsg = el("p", "");
pBlock.appendChild(pMsg);
$("save").parentNode.insertBefore(pBlock, $("save"));

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
function drawPhoto() {
  if (photoSrc) { pImg.src = photoSrc; pImg.style.display = "block"; pRm.style.display = "inline-block"; }
  else { pImg.removeAttribute("src"); pImg.style.display = "none"; pRm.style.display = "none"; }
  preview();
}
pFile.onchange = async function () {
  const file = pFile.files[0];
  pFile.value = "";
  if (!file) return;
  pMsg.textContent = "Ap prepare foto a...";
  try {
    photoData = await compress(file);
    photoSrc = "data:image/jpeg;base64," + photoData;
    photoRemove = false;
    pMsg.textContent = "";
  } catch (e) {
    pMsg.textContent = "Foto a pa ka itilize. Eseye yon lòt.";
  }
  drawPhoto();
};
pRm.onclick = function () {
  photoData = null;
  photoSrc = null;
  photoRemove = photoExisting;
  drawPhoto();
};

/* ---------- Koneksyon ---------- */
$("in").onclick = async function () {
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("pass").value);
  } catch (e) {
    alert("Koneksyon echwe: " + (e.code || e.message));
  }
};
$("out").onclick = function () { signOut(auth); };

onAuthStateChanged(auth, function (user) {
  $("login").style.display = user ? "none" : "block";
  $("panel").style.display = user ? "block" : "none";
  $("out").style.display = user ? "inline-block" : "none";
  if (user) { clearForm(); loadList(); }
});

function clearForm() {
  $("date").value = today();
  $("ref").value = "";
  $("verset").value = "";
  $("reflexion").value = "";
  EXTRA.forEach(function (id) { $(id).value = ""; });
  photoData = null; photoSrc = null; photoExisting = false; photoRemove = false; loadedDate = null;
  pMsg.textContent = "";
  msg("");
  drawPhoto();
}

function preview() {
  const box = $("preview");
  box.textContent = "";
  const verset = $("verset").value.trim();
  if (!verset) return;
  const ref = $("ref").value.trim();
  const card = el("div", "card");
  if (photoSrc) {
    const im = document.createElement("img");
    im.className = "vphoto";
    im.src = photoSrc;
    card.appendChild(im);
  }
  card.appendChild(el("div", "ref", ref));
  card.appendChild(el("p", "verse", verset));
  const refl = $("reflexion").value.trim();
  if (refl) { card.appendChild(el("h3", "", "Reflèksyon")); card.appendChild(el("p", "", refl)); }
  const text = verset + " (" + ref + ") - Voyager à travers la Bible";
  const share = el("div", "share");
  const wa = el("a", "", "WhatsApp");
  wa.href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + location.origin);
  wa.target = "_blank"; wa.rel = "noopener";
  const fb = el("a", "", "Facebook");
  fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(location.origin);
  fb.target = "_blank"; fb.rel = "noopener";
  share.appendChild(wa); share.appendChild(fb);
  if (navigator.share) {
    const nb = el("a", "", "Pataje...");
    nb.href = "#";
    nb.onclick = function (e) {
      e.preventDefault();
      navigator.share({ text: text, url: location.origin }).catch(function () {});
    };
    share.appendChild(nb);
  }
  card.appendChild(share);
  box.appendChild(card);
}
["ref", "verset", "reflexion"].forEach(function (id) { $(id).addEventListener("input", preview); });
$("clear").onclick = clearForm;

$("save").onclick = async function () {
  const date = $("date").value;
  const verset = $("verset").value.trim();
  if (!date || !verset) { msg("Dat la ak vèsè a obligatwa."); return; }
  const keep = photoExisting && date === loadedDate && !photoRemove;
  const hasPhoto = !!photoData || keep;
  const data = {
    date: date,
    reference: $("ref").value.trim(),
    verset: verset,
    reflexion: $("reflexion").value.trim(),
    photo: hasPhoto
  };
  EXTRA.forEach(function (id) { data[id] = $(id).value.trim(); });
  try {
    const b = writeBatch(db);
    b.set(doc(db, "pawol", date), data, { merge: true });
    if (photoData) {
      b.set(doc(db, "media", "verse_" + date), { data: photoData, createdAt: serverTimestamp() });
    } else if (photoRemove && date === loadedDate) {
      b.delete(doc(db, "media", "verse_" + date));
    }
    await b.commit();
    photoExisting = hasPhoto;
    loadedDate = date;
    photoData = null;
    photoRemove = false;
    msg("Anrejistre ✅");
    loadList();
  } catch (e) {
    msg("Erè: " + (e.code || e.message));
  }
};

async function loadList() {
  const list = $("list");
  list.textContent = "";
  try {
    const snap = await getDocs(query(collection(db, "pawol"), orderBy("date", "desc"), limit(30)));
    snap.forEach(function (s) {
      const d = s.data();
      const row = el("div", "item");
      row.appendChild(el("div", "", d.date + " · " + (d.reference || "") + (d.photo ? " · 📷" : "")));
      const btns = el("div");
      const ed = el("button", "btn", "Modifye");
      ed.type = "button";
      ed.onclick = async function () {
        $("date").value = d.date;
        $("ref").value = d.reference || "";
        $("verset").value = d.verset || "";
        $("reflexion").value = d.reflexion || "";
        EXTRA.forEach(function (id) { $(id).value = d[id] || ""; });
        photoData = null; photoSrc = null; photoRemove = false;
        photoExisting = !!d.photo;
        loadedDate = d.date;
        pMsg.textContent = "";
        drawPhoto();
        window.scrollTo(0, 0);
        if (d.photo) {
          try {
            const m = await getDoc(doc(db, "media", "verse_" + d.date));
            if (m.exists() && loadedDate === d.date && !photoData) {
              photoSrc = "data:image/jpeg;base64," + m.data().data;
              drawPhoto();
            }
          } catch (e) {}
        }
      };
      const del = el("button", "btn danger", "Efase");
      del.type = "button";
      del.onclick = async function () {
        if (!confirm("Efase piblikasyon " + d.date + " ?")) return;
        try {
          const b = writeBatch(db);
          b.delete(doc(db, "pawol", s.id));
          if (d.photo) b.delete(doc(db, "media", "verse_" + s.id));
          await b.commit();
          loadList();
        } catch (e) { msg("Erè: " + (e.code || e.message)); }
      };
      btns.appendChild(ed); btns.appendChild(del);
      row.appendChild(btns);
      list.appendChild(row);
    });
  } catch (e) {
    msg("Pa kapab chaje lis la: " + (e.code || e.message));
  }
  }
