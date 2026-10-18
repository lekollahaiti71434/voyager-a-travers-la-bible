const T = {
  ht: {
    akey: "Akèy",
    pawol: "Pawòl Bondye",
    komunote: "Kominote",
    solidarite: "Solidarite",
    welcome: "Byenveni nan Voyager à travers la Bible.",
    soon: "Seksyon sa a ap disponib talè."
  },
  fr: {
    akey: "Accueil",
    pawol: "Parole de Dieu",
    komunote: "Communauté",
    solidarite: "Solidarité",
    welcome: "Bienvenue dans Voyager à travers la Bible.",
    soon: "Cette section sera bientôt disponible."
  }
};

let lang = "ht";
try { lang = localStorage.getItem("lang") || "ht"; } catch (e) {}

function render() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = T[lang][el.dataset.i18n];
  });
  document.getElementById("lang-btn").textContent = lang === "ht" ? "FR" : "KR";
}

document.getElementById("lang-btn").addEventListener("click", function () {
  lang = lang === "ht" ? "fr" : "ht";
  try { localStorage.setItem("lang", lang); } catch (e) {}
  render();
});

document.querySelectorAll("nav button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
    document.querySelectorAll("nav button").forEach(function (b) { b.classList.remove("active"); });
    document.getElementById(btn.dataset.page).classList.add("active");
    btn.classList.add("active");
  });
});

render();
