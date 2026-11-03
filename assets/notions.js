/* Apprensia : les 24 notions. Recherche, filtres par chapitre, fiche complète
   dans une fenêtre, et une adresse par notion (notions/#effet-test) qu'on peut
   partager. Le contenu vient de l'app (donnees/contenu.js), sans retouche. */
(function () {
  "use strict";
  var A = window.Apprensia, C = window.APPRENSIA;
  if (!A || !C) return;

  var liste = document.querySelector("[data-notions]"), filtres = document.querySelector("[data-filtres]");
  var champ = document.querySelector("[data-recherche]"), compte = document.querySelector("[data-compte-notions]");
  var fiche = document.querySelector("[data-fiche]"), corps = document.querySelector("[data-fiche-corps]");
  if (!liste) return;

  var chapitreDe = {}, parId = {}, chapitre = null, ordre = C.notions.slice();
  C.chapitres.forEach(function (c, i) { chapitreDe[c.id] = { titre: c.titre, sousTitre: c.sousTitre, rang: i + 1 }; });
  ordre.sort(function (a, b) { return chapitreDe[a.chapitre].rang - chapitreDe[b.chapitre].rang || a.rang - b.rang; });
  ordre.forEach(function (n) { parId[n.id] = n; });
  var experienceDe = {};
  C.experiences.forEach(function (e) { experienceDe[e.id] = e; });

  // Recherche sans accents ni majuscules, dans tout le texte de la notion.
  function plat(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  ordre.forEach(function (n) {
    n._texte = plat([n.titre, n.phrase].concat(n.recherche || [], n.nuances || [], n.auQuotidien || [], n.sources || []).join(" "));
  });

  function surligner(html, mots) {
    if (!mots.length) return html;
    // On surligne dans le texte brut (sans balises), mot par mot, accents compris.
    return html.replace(/(^|>)([^<]+)/g, function (_, a, texte) {
      var p = plat(texte), sortie = "", i = 0, trouve;
      while (i < texte.length) {
        trouve = 0;
        for (var k = 0; k < mots.length; k++) if (p.substr(i, mots[k].length) === mots[k]) { trouve = mots[k].length; break; }
        if (trouve) { sortie += "<mark>" + texte.substr(i, trouve) + "</mark>"; i += trouve; } else { sortie += texte[i]; i++; }
      }
      return a + sortie;
    });
  }

  function puces() {
    var t = '<button type="button" class="puce" aria-pressed="' + (chapitre === null) + '" data-chap="">Tous</button>';
    C.chapitres.forEach(function (c) {
      t += '<button type="button" class="puce" aria-pressed="' + (chapitre === c.id) + '" data-chap="' + c.id + '">' + A.fr(c.titre) + "</button>";
    });
    filtres.innerHTML = t;
  }

  function afficher() {
    var mots = plat(champ.value).split(/\s+/).filter(function (m) { return m.length > 1; });
    var vues = ordre.filter(function (n) {
      return (!chapitre || n.chapitre === chapitre) && mots.every(function (m) { return n._texte.indexOf(m) >= 0; });
    });
    compte.textContent = vues.length === ordre.length ? ordre.length + " notions" :
      vues.length + (vues.length > 1 ? " notions trouvées" : " notion trouvée") + " sur " + ordre.length;
    if (!vues.length) { liste.innerHTML = '<p class="rien">Aucune notion ne parle de cela. Essayez un autre mot, ou « Tous ».</p>'; return; }
    var html = "";
    C.chapitres.forEach(function (c) {
      var ici = vues.filter(function (n) { return n.chapitre === c.id; });
      if (!ici.length) return;
      var lues = C.notions.filter(function (n) { return n.chapitre === c.id && A.parcours && A.parcours.fait("n", n.id); }).length;
      var toutes = C.notions.filter(function (n) { return n.chapitre === c.id; }).length;
      html += '<section class="groupe" id="chapitre-' + c.id + '"><h2><small>Chapitre ' + chapitreDe[c.id].rang + "</small>" + A.fr(c.titre) +
        (lues ? '<span class="lues' + (lues === toutes ? " toutes" : "") + '">' + lues + " / " + toutes + " lues</span>" : "") +
        "</h2><p>" + A.fr(c.sousTitre) + '</p><div class="cartes-notions">';
      ici.forEach(function (n) {
        // Un vrai lien vers la page de la notion (moteurs de recherche, clic du milieu) ;
        // un clic simple ouvre la fiche dans la fenêtre, sans quitter la liste.
        var lue = A.parcours && A.parcours.fait("n", n.id);
        html += '<a class="notion-carte' + (lue ? " lue" : "") + '" href="' + A.racine + "notions/" + n.id + '/" data-notion="' + n.id + '">' +
          '<span class="rang">' + chapitreDe[n.chapitre].rang + "." + n.rang + "</span>" +
          '<span class="nt">' + surligner(A.fr(n.titre), mots) + '</span><span class="np">' + surligner(A.fr(n.phrase), mots) + "</span>" +
          (n.experience && experienceDe[n.experience] ? '<span class="vivre">Avec une expérience à vivre</span>' : "") + "</a>";
      });
      html += "</div></section>";
    });
    liste.innerHTML = html;
  }

  function bloc(titre, items, classe) {
    if (!items || !items.length) return "";
    return "<h3>" + titre + "</h3><ul" + (classe ? ' class="' + classe + '"' : "") + ">" +
      items.map(function (x) { return "<li>" + A.fr(x) + "</li>"; }).join("") + "</ul>";
  }

  var courante = null, retour = null;
  function ouvrir(id, depuisAdresse) {
    var n = parId[id];
    if (!n || !fiche) return;
    courante = n;
    var c = chapitreDe[n.chapitre], e = n.experience && experienceDe[n.experience];
    var liees = (n.liees || []).filter(function (x) { return parId[x]; }).map(function (x) {
      return '<button type="button" class="puce" data-notion="' + x + '">' + A.fr(parId[x].titre) + "</button>";
    }).join("");
    // Les renvois vers les Ressources : les mots du glossaire et les guides qui citent cette notion.
    var mots = (C.glossaire || []).filter(function (m) { return (m.notions || []).indexOf(n.id) >= 0; }).map(function (m) {
      return '<a class="puce" href="' + A.racine + "ressources/glossaire/#mot-" + m.id + '">' + A.fr(m.mot) + "</a>";
    }).join("");
    var pratique = (C.guides || []).filter(function (g) {
      return g.etapes.some(function (e) { return (e.notions || []).indexOf(n.id) >= 0; });
    }).map(function (g) {
      return '<a class="puce" href="' + A.racine + "ressources/guides/#" + g.id + '">' + A.fr(g.titre) + "</a>";
    }).join("");
    corps.innerHTML =
      '<p class="kicker">Chapitre ' + c.rang + " · " + A.fr(c.titre) + "</p>" +
      '<h2 id="fiche-titre" tabindex="-1">' + A.fr(n.titre) + "</h2>" +
      '<p class="phrase">' + A.fr(n.phrase) + "</p>" +
      bloc("Ce que dit la recherche", n.recherche) +
      bloc("Les nuances", n.nuances) +
      bloc("Au quotidien", n.auQuotidien) +
      bloc("Sources", n.sources, "sources") +
      '<span class="lu-repere" data-lu-repere="' + n.id + '" aria-hidden="true"></span>' +
      (liees ? '<h3>Pour aller plus loin</h3><div class="liees">' + liees + "</div>" : "") +
      (pratique ? '<h3>Mise en pratique</h3><div class="liees">' + pratique + "</div>" : "") +
      (mots ? '<h3>Dans le glossaire</h3><div class="liees">' + mots + "</div>" : "") +
      '<div class="actions">' +
      (e ? '<a class="btn or" href="' + A.racine + "experiences/#" + e.id + '">Vivre l\'expérience : ' + A.fr(e.titre) + "</a>" : "") +
      '<a class="btn contour" href="' + A.racine + "ressources/fiches/#fiche-" + n.chapitre + '">La fiche du chapitre</a>' +
      '<a class="btn contour" href="' + A.racine + 'quiz/">Se tester : Vrai ou faux</a></div>';
    corps.scrollTop = 0;
    if (A.parcours) A.parcours.guetter(corps.querySelector("[data-lu-repere]"));   // lue une fois les sources atteintes
    if (!depuisAdresse) history.replaceState(null, "", "#" + n.id);
    document.title = n.titre + " · Apprensia";
    if (!fiche.open) { retour = document.activeElement; fiche.showModal(); }
    corps.querySelector("h2").focus({ preventScroll: true });
  }
  function fermer() {
    if (fiche.open) fiche.close();
  }
  function voisine(pas) {
    if (!courante) return;
    var i = ordre.indexOf(courante);
    ouvrir(ordre[(i + pas + ordre.length) % ordre.length].id);
  }

  if (fiche) {
    fiche.addEventListener("close", function () {
      if (fiche.open) return;
      courante = null;
      history.replaceState(null, "", location.pathname + location.search);
      document.title = "Les 24 notions · Apprensia";
      if (retour && retour.focus) retour.focus();
    });
    fiche.addEventListener("click", function (e) { if (e.target === fiche) fermer(); });
    fiche.querySelector("[data-fermer]").addEventListener("click", fermer);
    fiche.querySelector("[data-precedente]").addEventListener("click", function () { voisine(-1); });
    fiche.querySelector("[data-suivante]").addEventListener("click", function () { voisine(1); });
    fiche.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") voisine(1);
      if (e.key === "ArrowLeft") voisine(-1);
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-notion]");
    if (b) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // nouvel onglet : la page
      e.preventDefault(); ouvrir(b.getAttribute("data-notion")); return;
    }
    var p = e.target.closest("[data-chap]");
    if (p) { chapitre = p.getAttribute("data-chap") || null; puces(); afficher(); }
  });
  champ.addEventListener("input", afficher);
  document.addEventListener("apprensia:parcours", afficher);

  // L'adresse décide : #effet-test ouvre la fiche, #chapitre-ecrans filtre.
  function depuisAdresse() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (parId[h]) { ouvrir(h, true); return; }
    var m = h.match(/^chapitre-(.+)$/);
    if (m && chapitreDe[m[1]]) {
      chapitre = m[1]; puces(); afficher();
      var g = document.getElementById(h);
      if (g) g.scrollIntoView({ block: "start" });
    }
  }
  addEventListener("hashchange", depuisAdresse);

  puces(); afficher(); depuisAdresse();
})();
