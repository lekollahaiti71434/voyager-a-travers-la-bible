import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_UID = "azWWZrzbaXa2KJFgAUluRi5BQqj1";
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const style = document.createElement("style");
style.textContent = `
#dash{margin-top:34px;padding-top:6px;border-top:3px solid #c9a24a}
#dash h2,#dash h3{margin:22px 0 10px}
.dchips{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.dchip{padding:8px 14px;border-radius:18px;border:1px solid #c9a24a;background:#fff;font:inherit;font-size:.85rem}
.dchip.on{background:#c9a24a;color:#fff;font-weight:bold}
.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}
.dstat{background:#fff;border:1px solid #e6dcc0;border-radius:10px;padding:12px}
.dstat b{display:block;font-size:1.1rem;color:#111;overflow-wrap:anywhere}
.dstat span{font-size:.75rem;color:#777}
.dproj{background:#fff;border:1px solid #e6dcc0;border-radius:10px;padding:12px;margin-bottom:10px}
.dproj h4{margin:0 0 6px}
.dbar{height:10px;background:#eee;border-radius:5px;overflow:hidden;margin:6px 0 8px}
.dbar i{display:block;height:100%;background:#c9a24a}
.dline{display:flex;justify-content:space-between;gap:10px;font-size:.88rem;padding:3px 0}
.dline span:last-child{text-align:right;font-weight:bold}
.drow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #f0ead8;font-size:.88rem}
.drow small{display:block;color:#888}
.drow b{white-space:nowrap}
#dash .dmsg{margin:10px 0;color:#777}
`;
document.head.appendChild(style);

const box = document.createElement("div");
box.id = "dash";
box.style.display = "none";
const anchor = document.getElementById("mod") || document.getElementById("sol");
if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);

let projects = [];
let donations = [];
let period = "all";
let updatedAt = null;
let loading = false;
let error = "";
const openProj = {};

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function money(n) { return Number(n || 0).toLocaleString("fr") + " HTG"; }
function dms(d) {
  const x = d.status === "confirmed" && d.confirmedAt ? d.confirmedAt : d.createdAt;
  return x && x.toMillis ? x.toMillis() : 0;
}
function inPeriod(d) {
  if (period === "all") return true;
  return dms(d) >= Date.now() - Number(period) * 86400000;
}
function sum(list) { return list.reduce(function (t, d) { return t + (Number(d.amount) || 0); }, 0); }
function stat(value, label) {
  const s = el("div", "dstat");
  s.appendChild(el("b", "", value));
  s.appendChild(el("span", "", label));
  return s;
}
function line(label, value) {
  const l = el("div", "dline");
  l.appendChild(el("span", "", label));
  l.appendChild(el("span", "", value));
  return l;
}
function projName(id) {
  const p = projects.find(function (x) { return x.id === id; });
  return p ? p.title : "(pwojè efase)";
}
function donorsOf(list) {
  const m = {};
  list.forEach(function (d) {
    const k = d.uid;
    if (!m[k]) m[k] = { uid: k, name: d.name || "?", count: 0, total: 0, last: 0 };
    m[k].count++;
    m[k].total += Number(d.amount) || 0;
    const t = dms(d);
    if (t >= m[k].last) { m[k].last = t; m[k].name = d.name || m[k].name; }
  });
  return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.total - a.total; });
}
function donorRow(x) {
  const r = el("div", "drow");
  const left = el("div");
  left.appendChild(document.createTextNode(x.name));
  left.appendChild(el("small", "", x.count + " don" + (x.last ? " · dènye: " + new Date(x.last).toLocaleDateString("fr") : "")));
  r.appendChild(left);
  r.appendChild(el("b", "", money(x.total)));
  return r;
}
function csvCell(v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }
function exportCsv() {
  const rows = [["Dat", "Pwojè", "Non", "Metòd", "Montan (HTG)", "Nimewo tranzaksyon", "Estati"]];
  donations.filter(inPeriod).sort(function (a, b) { return dms(b) - dms(a); }).forEach(function (d) {
    const t = dms(d);
    rows.push([t ? new Date(t).toLocaleDateString("fr") : "", projName(d.projectId), d.name, d.method === "moncash" ? "MonCash" : "NatCash", d.amount, d.reference, d.status]);
  });
  const text = "\ufeff" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dons-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function render() {
  box.textContent = "";
  box.appendChild(el("h2", "", "Tableau de bord"));

  const chips = el("div", "dchips");
  [["all", "Tout"], ["30", "30 dènye jou"], ["7", "7 dènye jou"]].forEach(function (c) {
    const b = el("button", "dchip" + (period === c[0] ? " on" : ""), c[1]);
    b.type = "button";
    b.onclick = function () { period = c[0]; render(); };
    chips.appendChild(b);
  });
  box.appendChild(chips);

  if (error) { box.appendChild(el("p", "dmsg", error)); }
  if (loading && !donations.length && !projects.length) { box.appendChild(el("p", "dmsg", "Chajman...")); return; }

  const list = donations.filter(inPeriod);
  const conf = list.filter(function (d) { return d.status === "confirmed"; });
  const pend = list.filter(function (d) { return d.status === "pending"; });
  const confSum = sum(conf);
  const donors = donorsOf(conf);
  const totalCollected = projects.reduce(function (t, p) { return t + (Number(p.collected) || 0); }, 0);
  const totalGoal = projects.reduce(function (t, p) { return t + (Number(p.goal) || 0); }, 0);
  const pct = totalGoal > 0 ? Math.min(100, Math.round((totalCollected / totalGoal) * 100)) : 0;

  const grid = el("div", "dgrid");
  grid.appendChild(stat(money(totalCollected), "Total kolekte (tout pwojè)"));
  grid.appendChild(stat(money(totalGoal) + " (" + pct + "%)", "Objektif total"));
  grid.appendChild(stat(money(confSum), "Don konfime (" + conf.length + ")"));
  grid.appendChild(stat(String(donors.length), "Moun ki bay"));
  grid.appendChild(stat(money(sum(pend)), "An atant (" + pend.length + ")"));
  grid.appendChild(stat(conf.length ? money(Math.round(confSum / conf.length)) : "—", "Mwayèn pa don"));
  box.appendChild(grid);

  const mc = sum(conf.filter(function (d) { return d.method === "moncash"; }));
  const nc = sum(conf.filter(function (d) { return d.method === "natcash"; }));
  const mcard = el("div", "dproj");
  mcard.appendChild(line("MonCash", money(mc)));
  mcard.appendChild(line("NatCash", money(nc)));
  box.appendChild(mcard);

  box.appendChild(el("h3", "", "Pa pwojè"));
  if (!projects.length) box.appendChild(el("p", "dmsg", "Poko gen pwojè."));
  projects.slice().sort(function (a, b) { return (Number(b.collected) || 0) - (Number(a.collected) || 0); }).forEach(function (p) {
    const pc = conf.filter(function (d) { return d.projectId === p.id; });
    const pp = pend.filter(function (d) { return d.projectId === p.id; });
    const goal = Number(p.goal) || 0;
    const got = Number(p.collected) || 0;
    const pr = goal > 0 ? Math.min(100, Math.round((got / goal) * 100)) : 0;
    const pd = donorsOf(pc);

    const card = el("div", "dproj");
    card.appendChild(el("h4", "", p.title + (p.status === "closed" ? " (fèmen)" : "")));
    const bar = el("div", "dbar");
    const fill = document.createElement("i");
    fill.style.width = pr + "%";
    bar.appendChild(fill);
    card.appendChild(bar);
    card.appendChild(line("Kolekte", money(got) + " / " + money(goal) + " (" + pr + "%)"));
    card.appendChild(line("Don konfime", money(sum(pc)) + " · " + pc.length + " don"));
    card.appendChild(line("Moun ki bay", String(pd.length)));
    card.appendChild(line("An atant", money(sum(pp)) + " · " + pp.length));
    const tg = el("button", "btn", openProj[p.id] ? "Kache donatè yo" : "Wè donatè yo");
    tg.type = "button";
    tg.onclick = function () { openProj[p.id] = !openProj[p.id]; render(); };
    card.appendChild(tg);
    if (openProj[p.id]) {
      if (!pd.length) card.appendChild(el("p", "dmsg", "Poko gen don konfime."));
      pd.forEach(function (x) { card.appendChild(donorRow(x)); });
    }
    box.appendChild(card);
  });

  box.appendChild(el("h3", "", "Pi gwo donatè yo"));
  if (!donors.length) box.appendChild(el("p", "dmsg", "Poko gen don konfime nan peryòd sa a."));
  const topBox = el("div", "dproj");
  donors.slice(0, 10).forEach(function (x) { topBox.appendChild(donorRow(x)); });
  if (donors.length) box.appendChild(topBox);

  const rf = el("button", "btn", "Rafrechi");
  rf.type = "button";
  rf.onclick = load;
  const csv = el("button", "btn", "Telechaje CSV");
  csv.type = "button";
  csv.onclick = exportCsv;
  box.appendChild(rf);
  box.appendChild(csv);
  if (updatedAt) box.appendChild(el("p", "dmsg", "Dènye mizajou: " + updatedAt.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })));
}

async function load() {
  loading = true;
  error = "";
  render();
  try {
    const res = await Promise.all([getDocs(collection(db, "projects")), getDocs(collection(db, "donations"))]);
    projects = res[0].docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    donations = res[1].docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    updatedAt = new Date();
  } catch (e) {
    error = "Erè: " + (e.code || e.message);
  }
  loading = false;
  render();
}

onAuthStateChanged(auth, function (u) {
  if (u && u.uid === ADMIN_UID) {
    box.style.display = "block";
    load();
  } else {
    box.style.display = "none";
  }
});
