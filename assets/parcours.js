/* Apprensia : votre parcours. Notions lues, expériences vécues, meilleur score
   au Vrai ou faux, guides menés au bout, jours d'affilée : une progression, un
   niveau (de la veilleuse au plein soleil) et huit badges à débloquer.
   Tout reste dans ce navigateur (localStorage) : rien n'est envoyé, rien n'est
   mesuré. Les repères (titres, totaux) viennent de donnees/reperes.js. */
(function () {
  "use strict";
  var A = (window.Apprensia = window.Apprensia || {});
  var R = window.APPRENSIA_REPERES || { notions: [], chapitres: [], experiences: [], guides: [] };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return A.esc ? A.esc(s) : String(s); };
  var fr = function (s) { return A.fr ? A.fr(s) : esc(s); };

  function vide() { return { n: {}, e: {}, g: {}, q: 0, j: [], b: {} }; }
  function lire() {
    var s = (A.lire && A.lire("parcours")) || vide(), v = vide();
    for (var k in v) if (s[k] == null) s[k] = v[k];
    return s;
  }
  var S = lire();
  function garder() { if (A.stocker) A.stocker("parcours", S); }
  function nb(o) { return Object.keys(o).length; }
  function jour(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  // ── Les jours d'affilée : la série en cours, jusqu'à aujourd'hui (ou hier) ──
  function serie() {
    var jours = {}, n = 0, d = new Date();
    S.j.forEach(function (x) { jours[x] = 1; });
    if (!jours[jour(d)]) d.setDate(d.getDate() - 1);
    while (jours[jour(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ── Progression : notions 50 %, expériences 20 %, guides 20 %, Vrai ou faux 10 % ──
  var T = { n: R.notions.length || 24, e: R.experiences.length || 5, g: R.guides.length || 7, q: 10 };
  function pourcent() {
    return Math.round(50 * Math.min(1, nb(S.n) / T.n) + 20 * Math.min(1, nb(S.e) / T.e) +
                      20 * Math.min(1, nb(S.g) / T.g) + 10 * Math.min(1, S.q / T.q));
  }
  var NIVEAUX = [[0, "Veilleuse"], [10, "Lanterne"], [35, "Projecteur"], [70, "Phare"], [100, "Plein soleil"]];
  function niveau(p) { var x = NIVEAUX[0]; NIVEAUX.forEach(function (n) { if (p >= n[0]) x = n; }); return x[1]; }

  function chapitreComplet() {
    return R.chapitres.some(function (c) {
      var ici = R.notions.filter(function (n) { return n[2] === c[0]; });
      return ici.length && ici.every(function (n) { return S.n[n[0]]; });
    });
  }

  var I = {
    etincelle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    oeil: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bouclier: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    livre: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    coche: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    flamme: '<path d="M12 22c4 0 7-2.7 7-6.6 0-3.4-2.4-5.4-4-7.4-.4 2-1.5 3.2-2.8 3.6C12.6 8.5 11.5 5 9 2c-.3 4.2-4 6.7-4 11.4C5 18.6 8 22 12 22z"/>',
    etoile: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  function icone(nom) {
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + I[nom] + "</svg>";
  }

  var BADGES = [
    { id: "lueur", nom: "Première lueur", quoi: "Lire une première notion jusqu'au bout", icone: "etincelle", ok: function () { return nb(S.n) >= 1; } },
    { id: "vecu", nom: "Vécu de l'intérieur", quoi: "Vivre une expérience", icone: "oeil", ok: function () { return nb(S.e) >= 1; } },
    { id: "mythes", nom: "Chasseur de mythes", quoi: "8 sur 10 ou plus au Vrai ou faux", icone: "bouclier", ok: function () { return S.q >= 8; } },
    { id: "chapitre", nom: "Chapitre éclairé", quoi: "Lire toutes les notions d'un chapitre", icone: "livre", ok: chapitreComplet },
    { id: "routine", nom: "Routine en place", quoi: "Cocher toutes les étapes d'un guide", icone: "coche", ok: function () { return nb(S.g) >= 1; } },
    { id: "serie", nom: "Trois jours d'affilée", quoi: "Revenir trois jours de suite", icone: "flamme", ok: function () { return serie() >= 3; } },
    { id: "cinq", nom: "Cinq sens en éveil", quoi: "Vivre les cinq expériences", icone: "etoile", ok: function () { return nb(S.e) >= T.e; } },
    { id: "phare", nom: "Plein phare", quoi: "Lire les " + T.n + " notions", icone: "soleil", ok: function () { return nb(S.n) >= T.n; } }
  ];

  // ── Les annonces : une pastille pour un pas, une médaille pour un badge ──
  var pile = null;
  function annoncer(html, classe, duree) {
    if (!pile) {
      pile = document.createElement("div");
      pile.className = "annonces"; pile.setAttribute("role", "status"); pile.setAttribute("aria-live", "polite");
      document.body.appendChild(pile);
    }
    var el = document.createElement("div");
    el.className = "annonce " + (classe || "");
    el.innerHTML = html;
    pile.appendChild(el);
    if (classe === "medaille" && !calme) eclats(el.querySelector(".medaille-rond"));
    setTimeout(function () { el.classList.add("part"); setTimeout(function () { el.remove(); }, 600); }, duree || 3200);
  }
  function eclats(cible) {
    if (!cible) return;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("i");
      s.className = "eclat";
      s.style.setProperty("--a", (i / 14 * 360 + Math.random() * 18) + "deg");
      s.style.setProperty("--d", (38 + Math.random() * 30) + "px");
      s.style.setProperty("--t", (500 + Math.random() * 400) + "ms");
      cible.appendChild(s);
    }
  }

  function verifierBadges() {
    BADGES.forEach(function (b) {
      if (S.b[b.id] || !b.ok()) return;
      S.b[b.id] = jour();
      garder();
      annoncer('<span class="medaille-rond">' + icone(b.icone) + '</span><span><small>Badge débloqué</small><b>' + esc(b.nom) + "</b><span>" + esc(b.quoi) + "</span></span>", "medaille", 5200);
    });
  }

  // ── Le bouton de l'en-tête : un anneau qui se remplit ──
  function majBouton(gagne) {
    var p = pourcent();
    document.querySelectorAll("[data-parcours]").forEach(function (b) {
      b.style.setProperty("--p", (p / 100).toFixed(3));
      b.setAttribute("aria-label", "Votre parcours : " + p + " %, niveau " + niveau(p));
      b.title = "Votre parcours : " + p + " %";
      if (gagne && !calme) { b.classList.remove("gagne"); void b.offsetWidth; b.classList.add("gagne"); }
    });
  }

  var LIBELLES = { n: ["Notion lue", "notions"], e: ["Expérience vécue", "expériences"], g: ["Guide mené au bout", "guides"] };
  A.parcours = {
    fait: function (type, id) { return !!(S[type] && S[type][id]); },
    // marquer("n", "effet-test"), marquer("e", "stroop"), marquer("g", "reviser"), marquer("q", null, 8)
    marquer: function (type, id, valeur) {
      S = lire();
      if (type === "q") {
        if (!(valeur > S.q)) return;
        S.q = valeur; garder();
        annoncer("<b>Nouveau record</b> au Vrai ou faux : " + valeur + " sur 10", "pas");
      } else {
        if (!S[type] || S[type][id]) return;
        S[type][id] = jour(); garder();
        annoncer("<b>" + LIBELLES[type][0] + "</b> · " + nb(S[type]) + " sur " + T[type] + " " + LIBELLES[type][1], "pas");
      }
      majBouton(true);
      setTimeout(verifierBadges, 700);
      document.dispatchEvent(new CustomEvent("apprensia:parcours"));
    },
    // Une notion compte comme lue quand on arrive à ses sources.
    guetter: function (el) {
      if (!el || !("IntersectionObserver" in window)) return;
      var o = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { o.disconnect(); A.parcours.marquer("n", el.getAttribute("data-lu-repere")); }
      });
      o.observe(el);
    }
  };

  // ── La fenêtre « Votre parcours » ──
  var fenetre = null;
  function barre(libelle, fait, total, lien) {
    return '<a class="parcours-ligne" href="' + (A.racine || "") + lien + '"><span>' + libelle + "</span><span class=\"parcours-barre\"><i style=\"--v:" +
      Math.min(1, fait / total).toFixed(3) + '"></i></span><b>' + fait + " / " + total + "</b></a>";
  }
  function prochaine() {
    for (var i = 0; i < R.notions.length; i++) if (!S.n[R.notions[i][0]]) return R.notions[i];
    return null;
  }
  function remplir() {
    S = lire();
    var p = pourcent(), ser = serie(), suite = prochaine(), obtenus = BADGES.filter(function (b) { return S.b[b.id]; }).length;
    fenetre.querySelector("[data-parcours-corps]").innerHTML =
      '<div class="parcours-tete"><div class="grand-anneau" style="--p:' + (p / 100) + '"><div><b data-compte-pct>' + p + ' %</b><span>du parcours</span></div></div>' +
      '<div><p class="kicker">Niveau</p><h2 id="parcours-titre">' + niveau(p) + "</h2>" +
      '<p class="doux">' + (p === 0 ? "Lisez une notion jusqu'au bout ou vivez une expérience : l'anneau commence à se remplir." :
        p === 100 ? "Tout est éclairé. Revenez dans quelques jours : c'est l'espacement qui installe la mémoire." :
        "Chaque notion lue, chaque expérience vécue fait avancer la lumière.") + "</p>" +
      '<p class="serie">' + icone("flamme") + "<span><b>" + ser + (ser > 1 ? " jours" : " jour") + "</b> d'affilée</span></p></div></div>" +
      '<div class="parcours-barres">' +
      barre("Notions lues", nb(S.n), T.n, "notions/") + barre("Expériences vécues", nb(S.e), T.e, "experiences/") +
      barre("Guides menés au bout", nb(S.g), T.g, "ressources/guides/") + barre("Meilleur Vrai ou faux", S.q, T.q, "quiz/") + "</div>" +
      '<h3 class="badges-titre">Badges <small>' + obtenus + " sur " + BADGES.length + "</small></h3>" +
      '<ul class="badges">' + BADGES.map(function (b) {
        var ok = !!S.b[b.id];
        return '<li class="badge-carte' + (ok ? " obtenu" : "") + '"><span class="medaille-rond">' + icone(b.icone) + "</span><b>" + esc(b.nom) +
          "</b><span>" + esc(b.quoi) + '</span><span class="vu-lecteur">' + (ok ? "Obtenu" : "À débloquer") + "</span></li>";
      }).join("") + "</ul>" +
      '<div class="boutons">' + (suite ? '<a class="btn or" href="' + (A.racine || "") + "notions/" + suite[0] + '/">Continuer : ' + fr(suite[1]) + "</a>" :
        '<a class="btn or" href="' + (A.racine || "") + 'quiz/">Se tester à nouveau</a>') +
      '<button type="button" class="bouton-plat" data-effacer>Tout effacer</button></div>' +
      '<p class="doux petite">Votre parcours reste dans ce navigateur : il n\'est jamais envoyé, et personne d\'autre ne le voit.</p>';
  }
  function ouvrir() {
    if (!fenetre) {
      fenetre = document.createElement("dialog");
      fenetre.className = "fenetre parcours-fenetre";
      fenetre.setAttribute("aria-labelledby", "parcours-titre");
      fenetre.innerHTML = '<div class="fenetre-barre"><p class="kicker">Votre parcours</p><button type="button" class="rond fermer" data-fermer aria-label="Fermer">×</button></div>' +
        '<div class="parcours-corps" data-parcours-corps></div>';
      document.body.appendChild(fenetre);
      fenetre.addEventListener("click", function (e) {
        if (e.target === fenetre || e.target.closest("[data-fermer]")) fenetre.close();
        if (e.target.closest("[data-effacer]") && confirm("Effacer tout votre parcours dans ce navigateur ? Notions lues, expériences, badges et cases cochées des guides repartent de zéro.")) {
          S = vide(); S.j = [jour()]; garder();
          if (A.stocker) { A.stocker("guides", {}); A.stocker("quiz.meilleur", null); }
          remplir(); majBouton(false);
          document.dispatchEvent(new CustomEvent("apprensia:parcours"));
        }
      });
    }
    remplir();
    fenetre.showModal();
  }

  document.addEventListener("click", function (e) { if (e.target.closest("[data-parcours]")) ouvrir(); });

  document.addEventListener("DOMContentLoaded", function () {
    // La visite du jour compte pour la série ; on garde les 60 derniers jours.
    if (S.j.indexOf(jour()) < 0) { S.j.push(jour()); S.j = S.j.slice(-60); garder(); }
    // Le meilleur score déjà fait au Vrai ou faux (avant les badges) compte aussi.
    var ancien = A.lire && A.lire("quiz.meilleur");
    if (ancien > S.q) { S.q = ancien; garder(); }
    majBouton(false);
    document.querySelectorAll("[data-lu-repere]").forEach(A.parcours.guetter);
    setTimeout(verifierBadges, 1200);
  });
})();
