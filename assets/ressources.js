/* Apprensia : les pages Ressources (fiches, guides, glossaire, sources). Leur
   contenu est déjà dans la page, écrit par construire.py ; ce script n'ajoute
   que la recherche, le filtre par type, les cases des guides et l'impression.
   Les cases cochées restent dans ce navigateur (localStorage), nulle part ailleurs. */
(function () {
  "use strict";
  var A = window.Apprensia || {};
  function plat(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  // ── Imprimer une fiche, un guide, ou tout ──
  function impression() {
    var cible = null;
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-imprimer]");
      if (!b) return;
      var id = b.getAttribute("data-imprimer");
      cible = id === "tout" ? null : document.getElementById(id);
      if (cible) { document.documentElement.classList.add("impression-une"); cible.classList.add("a-imprimer"); }
      window.print();
    });
    addEventListener("afterprint", function () {
      document.documentElement.classList.remove("impression-une");
      if (cible) cible.classList.remove("a-imprimer");
      cible = null;
    });
  }

  // ── Les cases des guides ──
  function guides() {
    var guides = document.querySelectorAll("[data-guide]");
    if (!guides.length) return;
    var fait = (A.lire && A.lire("guides")) || {};
    function compter(g) {
      var cases = g.querySelectorAll("[data-etape]"), n = 0;
      cases.forEach(function (c) { if (c.checked) n++; });
      var t = n === cases.length ? "Toutes les étapes sont faites. Bravo." :
        n + (n > 1 ? " étapes faites" : " étape faite") + " sur " + cases.length;
      g.querySelector("[data-avance]").textContent = t;
      g.querySelector("[data-decocher]").hidden = n === 0;
      g.classList.toggle("fini", n === cases.length);
      if (n === cases.length && A.parcours) A.parcours.marquer("g", g.getAttribute("data-guide"));
    }
    guides.forEach(function (g) {
      g.querySelectorAll("[data-etape]").forEach(function (c) { c.checked = !!fait[c.getAttribute("data-etape")]; });
      compter(g);
      g.addEventListener("change", function (e) {
        var c = e.target.closest("[data-etape]");
        if (!c) return;
        if (c.checked) fait[c.getAttribute("data-etape")] = true; else delete fait[c.getAttribute("data-etape")];
        if (A.stocker) A.stocker("guides", fait);
        compter(g);
      });
      g.querySelector("[data-decocher]").addEventListener("click", function () {
        g.querySelectorAll("[data-etape]").forEach(function (c) { c.checked = false; delete fait[c.getAttribute("data-etape")]; });
        if (A.stocker) A.stocker("guides", fait);
        compter(g);
      });
    });
  }

  // ── Recherche dans le glossaire et les sources, filtre par type ──
  function filtres() {
    var champ = document.querySelector("[data-filtre-texte]");
    if (!champ) return;
    var items = document.querySelectorAll("[data-texte]"), groupes = document.querySelectorAll("[data-groupe]");
    var compte = document.querySelector("[data-compte]"), rien = document.querySelector("[data-rien]");
    var puces = document.querySelectorAll("button[data-type]"), type = "";
    var unite = document.querySelector(".glossaire") ? ["mots", "mot trouvé", "mots trouvés"] : ["sources", "source trouvée", "sources trouvées"];
    function afficher() {
      var mots = plat(champ.value).split(/\s+/).filter(function (m) { return m.length > 1; }), vus = 0;
      items.forEach(function (el) {
        var t = el.getAttribute("data-texte");
        var ok = (!type || el.getAttribute("data-type") === type) && mots.every(function (m) { return t.indexOf(m) >= 0; });
        el.hidden = !ok;
        if (ok) vus++;
      });
      // Une lettre du glossaire sans mot visible disparaît avec son titre.
      groupes.forEach(function (g) { if (!g.hasAttribute("data-texte")) g.hidden = !g.querySelector("[data-texte]:not([hidden])"); });
      var total = items.length;
      compte.textContent = vus === total ? total + " " + unite[0] : vus + " " + unite[vus > 1 ? 2 : 1] + " sur " + total;
      rien.hidden = vus > 0;
    }
    champ.addEventListener("input", afficher);
    puces.forEach(function (p) {
      p.addEventListener("click", function () {
        type = p.getAttribute("data-type");
        puces.forEach(function (q) { q.setAttribute("aria-pressed", String(q === p)); });
        afficher();
      });
    });
    // Arriver sur #mot-… ou #ref-… : l'élément doit être visible, même filtré.
    addEventListener("hashchange", function () {
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el && el.hidden) { champ.value = ""; type = ""; puces.forEach(function (q) { q.setAttribute("aria-pressed", String(!q.getAttribute("data-type"))); }); afficher(); el.scrollIntoView(); }
    });
  }

  document.addEventListener("DOMContentLoaded", function () { impression(); guides(); filtres(); });
})();
