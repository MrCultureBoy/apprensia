/* Apprensia : le socle commun à toutes les pages. Menu sur téléphone, barre de
   lecture, projecteur qui suit le pointeur, apparitions au défilement, chiffres
   qui comptent, chapitres et notion du jour de l'accueil.
   Aucune ressource tierce, aucune mesure d'audience. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Petits outils partagés avec les autres scripts du site.
  var A = (window.Apprensia = window.Apprensia || {});
  A.calme = calme;
  A.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  // Espaces insécables à la française, et *italique* du contenu de l'app.
  A.fr = function (s) {
    return A.esc(s)
      .replace(/\*([^*]+)\*/g, "<i>$1</i>")
      .replace(/« /g, "« ").replace(/ »/g, " »")
      .replace(/ ([:;?!])/g, " $1");
  };
  A.racine = (function () {                        // chemin relatif vers la racine du site
    var s = document.querySelector('script[src$="assets/site.js"]');
    return s ? s.getAttribute("src").replace(/assets\/site\.js$/, "") : "";
  })();
  A.melanger = function (t) {
    t = t.slice();
    for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = t[i]; t[i] = t[j]; t[j] = x; }
    return t;
  };
  A.stocker = function (cle, valeur) { try { localStorage.setItem("apprensia." + cle, JSON.stringify(valeur)); } catch (e) {} };
  A.lire = function (cle) { try { return JSON.parse(localStorage.getItem("apprensia." + cle)); } catch (e) { return null; } };

  function menu() {
    var b = document.querySelector(".menu-bouton"), nav = document.getElementById("nav-principale");
    if (!b || !nav) return;
    b.addEventListener("click", function () {
      var ouvert = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(ouvert));
      nav.classList.toggle("ouverte", ouvert);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { b.setAttribute("aria-expanded", "false"); nav.classList.remove("ouverte"); }
    });
  }

  function barreLecture() {
    var barre = document.querySelector(".progression");
    if (!barre) return;
    var attente = false;
    function maj() {
      attente = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      barre.style.setProperty("--lu", h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
    }
    addEventListener("scroll", function () { if (!attente) { attente = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
  }

  // Le projecteur : l'attention éclaire une zone à la fois. Il suit le pointeur,
  // avec un peu de retard, comme un faisceau qu'on déplace.
  function projecteurs() {
    document.querySelectorAll("[data-projecteur]").forEach(function (zone) {
      if (calme) return;
      var cible = { x: 70, y: 30 }, pos = { x: 70, y: 30 }, actif = false;
      function boucle() {
        pos.x += (cible.x - pos.x) * 0.12; pos.y += (cible.y - pos.y) * 0.12;
        zone.style.setProperty("--x", pos.x.toFixed(2) + "%");
        zone.style.setProperty("--y", pos.y.toFixed(2) + "%");
        if (Math.abs(cible.x - pos.x) + Math.abs(cible.y - pos.y) > 0.05) requestAnimationFrame(boucle); else actif = false;
      }
      zone.addEventListener("pointermove", function (e) {
        var r = zone.getBoundingClientRect();
        cible.x = ((e.clientX - r.left) / r.width) * 100;
        cible.y = ((e.clientY - r.top) / r.height) * 100;
        zone.classList.add("pointe");
        if (!actif) { actif = true; requestAnimationFrame(boucle); }
      });
      zone.addEventListener("pointerleave", function () { zone.classList.remove("pointe"); });
    });
  }

  function titreMots() {
    if (calme) return;
    document.querySelectorAll(".titre-mots").forEach(function (h) {
      var mots = h.textContent.trim().split(/\s+/);
      h.setAttribute("aria-label", h.textContent.trim());
      h.innerHTML = mots.map(function (m, i) {
        return '<span class="mot" aria-hidden="true" style="--m:' + i + '">' + A.esc(m) + "</span>";
      }).join(" ");
    });
  }

  var guetteur = "IntersectionObserver" in window ? new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      guetteur.unobserve(e.target);
      if (e.target.hasAttribute("data-compte")) compter(e.target); else e.target.classList.add("vu");
    });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  A.guetter = function (el) { if (guetteur) guetteur.observe(el); else el.classList.add("vu"); };

  function compter(el) {
    var fin = parseFloat(el.getAttribute("data-compte"));
    if (calme || !isFinite(fin)) return;
    var t0 = null, duree = 1400;
    el.textContent = "0";
    function pas(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / duree), e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(fin * e));
      if (p < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }

  function inclinaison() {
    if (calme || !matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll("[data-incline]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2) + "deg");
        el.style.setProperty("--rx", (((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); });
    });
  }

  // Accueil : les cinq chapitres, tirés du contenu de l'app.
  function chapitres() {
    var zone = document.querySelector("[data-chapitres]"), C = window.APPRENSIA;
    if (!zone || !C) return;
    zone.innerHTML = C.chapitres.map(function (c, i) {
      var nb = C.notions.filter(function (n) { return n.chapitre === c.id; }).length;
      return '<a class="chapitre apparait" href="' + A.racine + "notions/#chapitre-" + c.id + '">' +
        '<span class="num">' + (i + 1) + "</span><h3>" + A.fr(c.titre) + "</h3><p>" + A.fr(c.sousTitre) + "</p>" +
        '<span class="nb">' + nb + " notions</span></a>";
    }).join("");
    zone.querySelectorAll(".apparait").forEach(A.guetter);
  }

  // Accueil : une notion par jour, la même pour tout le monde ce jour-là.
  function notionDuJour() {
    var zone = document.querySelector("[data-notion-du-jour]"), C = window.APPRENSIA;
    if (!zone || !C || !C.notions.length) return;
    var d = new Date(), jour = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    var n = C.notions[jour % C.notions.length];
    zone.querySelector('[data-champ="titre"]').innerHTML = A.fr(n.titre);
    zone.querySelector('[data-champ="phrase"]').innerHTML = A.fr(n.phrase);
    zone.querySelector('[data-champ="lien"]').href = A.racine + "notions/#" + n.id;
    zone.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    menu(); barreLecture(); projecteurs(); titreMots(); inclinaison(); chapitres(); notionDuJour();
    document.querySelectorAll(".apparait, [data-compte]").forEach(A.guetter);
  });
})();
