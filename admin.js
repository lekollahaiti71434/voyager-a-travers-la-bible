import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = function (id) { return document.getElementById(id); };

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
  msg("");
  preview();
}

function preview() {
  const box = $("preview");
  box.textContent = "";
  const verset = $("verset").value.trim();
  if (!verset) return;
  const ref = $("ref").value.trim();
  const card = el("div", "card");
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
  try {
    await setDoc(doc(db, "pawol", date), {
      date: date,
      reference: $("ref").value.trim(),
      verset: verset,
      reflexion: $("reflexion").value.trim()
    }, { merge: true });
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
      row.appendChild(el("div", "", d.date + " · " + (d.reference || "")));
      const btns = el("div");
      const ed = el("button", "btn", "Modifye");
      ed.type = "button";
      ed.onclick = function () {
        $("date").value = d.date;
        $("ref").value = d.reference || "";
        $("verset").value = d.verset || "";
        $("reflexion").value = d.reflexion || "";
        preview();
        window.scrollTo(0, 0);
      };
      const del = el("button", "btn danger", "Efase");
      del.type = "button";
      del.onclick = async function () {
        if (!confirm("Efase piblikasyon " + d.date + " ?")) return;
        try { await deleteDoc(doc(db, "pawol", s.id)); loadList(); }
        catch (e) { msg("Erè: " + (e.code || e.message)); }
      };
      btns.appendChild(ed); btns.appendChild(del);
      row.appendChild(btns);
      list.appendChild(row);
    });
  } catch (e) {
    msg("Pa kapab chaje lis la: " + (e.code || e.message));
  }
    }
