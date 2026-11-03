/* Apprensia : le mouvement (voir mouvement.css). Poussière dorée dans le
   faisceau, lueur qui suit le pointeur dans les cartes, boutons attirés par le
   pointeur, apparitions en cascade, en-tête qui se resserre.
   Rien ne bouge pour qui a demandé moins d'animations ; rien n'est mesuré. */
(function () {
  "use strict";
  var A = window.Apprensia || {};
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var souris = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ── En-tête : plus dense dès qu'on défile ──
  function entete() {
    var e = document.querySelector(".entete");
    if (!e) return;
    var etat = null;
    function maj() { var d = scrollY > 12; if (d !== etat) { etat = d; e.classList.toggle("defile", d); } }
    addEventListener("scroll", maj, { passive: true });
    maj();
  }

  // ── Cascade : dans une grille, chaque carte arrive un peu après la précédente ──
  function cascade() {
    document.querySelectorAll(".grille, .chapitres, .chiffres, .etapes, .ressources-cartes").forEach(function (g) {
      var k = 0;
      Array.prototype.forEach.call(g.children, function (c) { if (c.classList.contains("apparait")) c.style.setProperty("--r", k++ % 4); });
    });
  }

  // ── La lueur suit le pointeur dans les cartes (une seule écoute pour tout le site) ──
  function lueurs() {
    if (!souris) return;
    var SEL = "a.carte, .chapitre, .notion-carte, .exp-carte, .source-ref";
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(SEL);
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      c.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    }, { passive: true });
  }

  // ── Boutons aimantés : ils suivent un peu le pointeur, puis reviennent ──
  function aimants() {
    if (calme || !souris) return;
    document.querySelectorAll(".btn.or, .btn.encre, .nav a.bouton").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
        b.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    });
  }

  // ── La poussière dans le faisceau : des grains d'or qui flottent dans la lumière ──
  function poussiere() {
    if (calme) return;
    document.querySelectorAll(".heros .faisceau").forEach(function (f) {
      var toile = document.createElement("canvas"), ctx = toile.getContext("2d");
      if (!ctx) return;
      f.appendChild(toile);
      var dpr = Math.min(2, devicePixelRatio || 1), L = 0, H = 0, grains = [], visible = true, id = 0, t0 = 0;
      function taille() {
        L = f.clientWidth; H = f.clientHeight;
        toile.width = Math.round(L * dpr); toile.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(Math.min(70, L * H / 9000));
        grains = [];
        for (var i = 0; i < n; i++) grains.push(grain(true));
      }
      function grain(partout) {
        return { x: Math.random() * L, y: partout ? Math.random() * H : H + 10, r: 0.5 + Math.random() * 1.7,
                 v: 6 + Math.random() * 16, a: 0.25 + Math.random() * 0.55, p: Math.random() * 6.28, o: 0.4 + Math.random() * 1.2 };
      }
      function dessine(t) {
        id = 0;
        if (!visible) return;
        var dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0; t0 = t;
        ctx.clearRect(0, 0, L, H);
        for (var i = 0; i < grains.length; i++) {
          var g = grains[i];
          g.y -= g.v * dt; g.p += g.o * dt;
          if (g.y < -10) grains[i] = g = grain(false);
          var x = g.x + Math.sin(g.p) * 14, eclat = g.a * (0.65 + 0.35 * Math.sin(g.p * 2.3));
          ctx.beginPath(); ctx.arc(x, g.y, g.r, 0, 6.2832);
          ctx.fillStyle = "rgba(255, 214, 130," + eclat.toFixed(3) + ")";
          ctx.fill();
        }
        id = requestAnimationFrame(dessine);
      }
      taille();
      addEventListener("resize", function () { taille(); });
      // On ne dessine que quand le héros est à l'écran et l'onglet visible.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (e) {
          visible = e[0].isIntersecting && !document.hidden;
          if (visible && !id) { t0 = 0; id = requestAnimationFrame(dessine); }
        }).observe(f.parentElement);
      }
      document.addEventListener("visibilitychange", function () {
        visible = !document.hidden;
        if (visible && !id) { t0 = 0; id = requestAnimationFrame(dessine); }
      });
      id = requestAnimationFrame(dessine);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    entete(); cascade(); lueurs(); aimants(); poussiere();
  });
})();
