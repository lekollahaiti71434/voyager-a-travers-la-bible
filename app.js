const T = {
  ht: {
    akey: "Akèy", pawol: "Pawòl Bondye", komunote: "Kominote", solidarite: "Solidarite",
    welcome: "Byenveni nan Voyager à travers la Bible.",
    soon: "Seksyon sa a ap disponib talè."
  },
  fr: {
    akey: "Accueil", pawol: "Parole de Dieu", komunote: "Communauté", solidarite: "Solidarité",
    welcome: "Bienvenue dans Voyager à travers la Bible.",
    soon: "Cette section sera bientôt disponible."
  },
  en: {
    akey: "Home", pawol: "Word of God", komunote: "Community", solidarite: "Solidarity",
    welcome: "Welcome to Voyager à travers la Bible.",
    soon: "This section will be available soon."
  },
  es: {
    akey: "Inicio", pawol: "Palabra de Dios", komunote: "Comunidad", solidarite: "Solidaridad",
    welcome: "Bienvenido a Voyager à travers la Bible.",
    soon: "Esta sección estará disponible pronto."
  }
};

const LANGS = ["ht", "fr", "en", "es"];
const LABEL = { ht: "KR", fr: "FR", en: "EN", es: "ES" };

let lang = "ht";
try { lang = localStorage.getItem("lang") || "ht"; } catch (e) {}
if (!T[lang]) lang = "ht";

function render() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = T[lang][el.dataset.i18n];
  });
  document.getElementById("lang-btn").textContent = LABEL[lang];
}

document.getElementById("lang-btn").addEventListener("click", function () {
  lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
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
