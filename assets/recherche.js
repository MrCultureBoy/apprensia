/* Apprensia : chercher dans tout le site (⌘K, Ctrl+K, « / », ou la loupe).
   Notions, expériences, mots du glossaire, guides, fiches, sources et pages.
   Le contenu (donnees/contenu.js) n'est chargé qu'à la première ouverture.
   Tout se passe dans le navigateur : rien n'est envoyé. */
(function () {
  "use strict";
  var A = window.Apprensia || {}, r = A.racine || "";
  var esc = A.esc || function (s) { return String(s); };
  var fr = A.fr || esc;
  function plat(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

  var PAGES = [
    ["Les 24 notions", "notions/", "Ce que la recherche sait de l'attention"],
    ["Les expériences", "experiences/", "Cinq expériences de moins de deux minutes"],
    ["Vrai ou faux", "quiz/", "Dix idées reçues, expliquées et sourcées"],
    ["Ressources", "ressources/", "Fiches, guides, glossaire et sources"],
    ["Fiches « À retenir »", "ressources/fiches/", "Un chapitre sur une page, à imprimer"],
    ["Guides pratiques", "ressources/guides/", "Des routines à cocher"],
    ["Glossaire", "ressources/glossaire/", "Les mots de l'attention"],
    ["Sources", "ressources/sources/", "Chaque étude, commentée"],
    ["Qui sommes-nous", "qui-sommes-nous/", "L'histoire d'Apprensia et de son fondateur"],
    ["Les ateliers", "ateliers/", "Pour une équipe enseignante ou une classe de lycée"],
    ["Tarifs et conditions", "tarifs/", "Ateliers offerts aux 10 premiers établissements, ensuite sur devis"],
    ["Supports d'atelier", "ateliers/supports/", "Invitations, affiches et carnets à imprimer"],
    ["L'app Apprensia", "app/", "iPhone et Mac, sans compte"],
    ["Nous écrire", "index.html#contact", "Un atelier, une question"],
    ["Confidentialité de l'app", "app/confidentialite/", "Aucune donnée collectée"],
    ["Assistance", "app/assistance/", "Questions fréquentes sur l'app"],
    ["Mentions légales", "mentions-legales/", "Qui publie ce site"]
  ];

  var index = null, fenetre, champ, liste, resultats = [], choisi = 0, retour = null;

  function construireIndex() {
    var C = window.APPRENSIA, t = [];
    PAGES.forEach(function (p) { t.push({ type: "Page", titre: p[0], sous: p[2], lien: r + p[1] }); });
    if (C) {
      var chap = {};
      C.chapitres.forEach(function (c) { chap[c.id] = c; });
      C.notions.forEach(function (n) {
        t.push({ type: "Notion", titre: n.titre, sous: n.phrase, lien: r + "notions/" + n.id + "/",
                 texte: [n.recherche, n.nuances, n.auQuotidien].join(" ") });
      });
      C.experiences.forEach(function (e) {
        t.push({ type: "Expérience", titre: e.titre, sous: e.promesse || e.consigne || "", lien: r + "experiences/#" + e.id });
      });
      (C.glossaire || []).forEach(function (m) {
        t.push({ type: "Glossaire", titre: m.mot, sous: m.definition, lien: r + "ressources/glossaire/#mot-" + m.id });
      });
      (C.guides || []).forEach(function (g) {
        t.push({ type: "Guide", titre: g.titre, sous: g.quand, lien: r + "ressources/guides/#" + g.id,
                 texte: g.etapes.map(function (e) { return e.titre + " " + e.texte; }).join(" ") });
      });
      (C.fiches || []).forEach(function (f) {
        var c = chap[f.chapitre];
        if (c) t.push({ type: "Fiche", titre: "À retenir : " + c.titre, sous: c.sousTitre, lien: r + "ressources/fiches/#fiche-" + c.id });
      });
      (C.references || []).forEach(function (s) {
        t.push({ type: "Source", titre: s.auteurs + " (" + s.annee + ")", sous: s.montre, lien: r + "ressources/sources/#ref-" + s.id, texte: s.reference });
      });
    }
    t.forEach(function (x) { x._titre = plat(x.titre); x._tout = plat(x.titre + " " + x.sous + " " + (x.texte || "")); });
    return t;
  }

  function charger(fini) {
    if (window.APPRENSIA) return fini();
    var s = document.createElement("script");
    s.src = r + "donnees/contenu.js";
    s.onload = fini; s.onerror = fini;            // sans contenu : les pages restent cherchables
    document.head.appendChild(s);
  }

  function score(x, mots) {
    var s = 0;
    for (var i = 0; i < mots.length; i++) {
      var m = mots[i];
      if (x._tout.indexOf(m) < 0) return -1;
      if (x._titre.indexOf(m) === 0) s += 6; else if (x._titre.indexOf(" " + m) >= 0) s += 4; else if (x._titre.indexOf(m) >= 0) s += 3; else s += 1;
    }
    return s + (x.type === "Notion" ? 0.5 : 0);
  }

  function afficher() {
    var q = plat(champ.value).trim(), mots = q.split(/\s+/).filter(Boolean);
    if (!index) index = construireIndex();
    if (!mots.length) {
      resultats = index.filter(function (x) { return x.type === "Page"; }).slice(0, 8);
    } else {
      resultats = index.map(function (x) { return { x: x, s: score(x, mots) }; })
        .filter(function (o) { return o.s >= 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 24).map(function (o) { return o.x; });
    }
    choisi = 0;
    if (!resultats.length) {
      liste.innerHTML = '<li class="palette-rien">Rien ne correspond à « ' + esc(champ.value.trim()) + " ». Essayez un mot plus court.</li>";
      champ.removeAttribute("aria-activedescendant");
      return;
    }
    liste.innerHTML = (mots.length ? "" : '<li class="palette-groupe" role="presentation">Aller à</li>') +
      resultats.map(function (x, i) {
        return '<li role="option" id="palette-' + i + '" aria-selected="' + (i === 0) + '"><a href="' + esc(x.lien) + '" tabindex="-1">' +
          '<span class="palette-type">' + esc(x.type) + '</span><span class="palette-titre">' + fr(x.titre) + "</span>" +
          (x.sous ? '<span class="palette-sous">' + fr(x.sous) + "</span>" : "") + "</a></li>";
      }).join("");
    champ.setAttribute("aria-activedescendant", "palette-0");
  }

  function marquer(i) {
    var opts = liste.querySelectorAll('[role="option"]');
    if (!opts.length) return;
    choisi = (i + opts.length) % opts.length;
    opts.forEach(function (o, k) { o.setAttribute("aria-selected", String(k === choisi)); });
    champ.setAttribute("aria-activedescendant", "palette-" + choisi);
    opts[choisi].scrollIntoView({ block: "nearest" });
  }

  function aller(x) {
    fermer();
    var ici = location.pathname, cible = new URL(x.lien, location.href);
    location.href = cible.href;
    // Même page, autre ancre : le navigateur ne recharge pas, l'ancre suffit.
    if (cible.pathname === ici && cible.hash) dispatchEvent(new HashChangeEvent("hashchange"));
  }

  function creer() {
    fenetre = document.createElement("dialog");
    fenetre.className = "palette";
    fenetre.setAttribute("aria-label", "Rechercher dans le site");
    fenetre.innerHTML =
      '<div class="palette-champ">' + (document.querySelector(".cherche-bouton svg") || { outerHTML: "" }).outerHTML +
      '<input type="search" placeholder="Une notion, un mot, une étude, une page…" autocomplete="off" spellcheck="false" ' +
      'role="combobox" aria-expanded="true" aria-controls="palette-liste" aria-autocomplete="list" aria-label="Rechercher">' +
      '<kbd>Échap</kbd></div><ul class="palette-liste" id="palette-liste" role="listbox"></ul>' +
      '<p class="palette-aide"><span><kbd>↑</kbd><kbd>↓</kbd> choisir</span><span><kbd>Entrée</kbd> ouvrir</span><span>Tout reste dans votre navigateur.</span></p>';
    document.body.appendChild(fenetre);
    champ = fenetre.querySelector("input"); liste = fenetre.querySelector("ul");
    champ.addEventListener("input", afficher);
    champ.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); marquer(choisi + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); marquer(choisi - 1); }
      else if (e.key === "Enter") { e.preventDefault(); if (resultats[choisi]) aller(resultats[choisi]); }
    });
    liste.addEventListener("click", function (e) {
      var o = e.target.closest('[role="option"]');
      if (!o) return;
      e.preventDefault();
      aller(resultats[+o.id.replace("palette-", "")]);
    });
    liste.addEventListener("pointermove", function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) { var i = +o.id.replace("palette-", ""); if (i !== choisi) marquer(i); }
    });
    fenetre.addEventListener("click", function (e) { if (e.target === fenetre) fermer(); });
    fenetre.addEventListener("close", function () { if (retour && retour.focus) retour.focus(); });
  }

  function ouvrir() {
    if (!fenetre) creer();
    if (fenetre.open) return;
    retour = document.activeElement;
    fenetre.showModal();
    champ.value = ""; champ.focus();
    afficher();
    charger(function () { index = null; afficher(); });
  }
  function fermer() { if (fenetre && fenetre.open) fenetre.close(); }

  document.addEventListener("click", function (e) { if (e.target.closest("[data-palette]")) { e.preventDefault(); ouvrir(); } });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) { e.preventDefault(); if (fenetre && fenetre.open) fermer(); else ouvrir(); return; }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.target.closest("input, textarea, select, [contenteditable], dialog")) { e.preventDefault(); ouvrir(); }
  });
  // Hors Mac, le raccourci affiché est Ctrl K.
  document.addEventListener("DOMContentLoaded", function () {
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
      document.querySelectorAll(".cherche-bouton kbd").forEach(function (k) { k.textContent = "Ctrl K"; });
    }
  });
})();
