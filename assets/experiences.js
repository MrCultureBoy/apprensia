/* Apprensia : les cinq expériences, jouables dans le navigateur. Mêmes règles
   que l'app (ApprensiaCore/Engine/Experiences.swift) : Stroop en deux manches
   de 12 essais, croix invisible de 15 s (croix noire de 5 à 10 s, d'après
   Most et al., 2001), multitâche ATTENTION / 123456789, soupir cyclique de
   63 s (cycles de 9 s), 5-4-3-2-1 par pas de 20 s. Rien n'est envoyé : les
   temps restent dans la page. */
(function () {
  "use strict";
  var A = window.Apprensia, C = window.APPRENSIA;
  if (!A || !C) return;

  var COULEURS = [
    { id: "rouge", mot: "ROUGE", nom: "Rouge", c: "#C8423B" },
    { id: "bleu", mot: "BLEU", nom: "Bleu", c: "#2F6FD0" },
    { id: "vert", mot: "VERT", nom: "Vert", c: "#2E8B57" },
    { id: "violet", mot: "VIOLET", nom: "Violet", c: "#8455C9" }
  ];
  var notionDe = {}, experienceDe = {};
  C.notions.forEach(function (n) { notionDe[n.id] = n; });
  C.experiences.forEach(function (e) { experienceDe[e.id] = e; });

  function lienNotion(id, texte) {
    var n = notionDe[id];
    if (!n) return "";
    return '<a class="btn contour" href="' + A.racine + "notions/#" + id + '">' + (texte || "Comprendre : " + A.fr(n.titre)) + "</a>";
  }
  function ms(x) { return Math.round(x) + " ms"; }
  function secondes(x) { return (x / 1000).toFixed(1).replace(".", ",") + " s"; }
  function moyenne(t) { return t.length ? t.reduce(function (a, b) { return a + b; }, 0) / t.length : 0; }
  function minutes(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function mesure(valeur, libelle, mise) {
    return '<div class="mesure' + (mise ? " mise" : "") + '"><b>' + valeur + "</b><span>" + libelle + "</span></div>";
  }

  // Une « vie » par expérience : tout ce qu'elle lance s'arrête quand on ferme.
  function Vie() {
    var minuteries = [], ecoutes = [], v = { vivant: true };
    v.attendre = function (d, f) { minuteries.push(setTimeout(function () { if (v.vivant) f(); }, d)); };
    v.image = function (f) { requestAnimationFrame(function (t) { if (v.vivant) f(t); }); };
    v.ecouter = function (cible, type, f) { cible.addEventListener(type, f); ecoutes.push([cible, type, f]); };
    v.fin = function () {
      v.vivant = false;
      minuteries.forEach(clearTimeout);
      ecoutes.forEach(function (x) { x[0].removeEventListener(x[1], x[2]); });
    };
    return v;
  }
  function decompte(zone, vie, titre, suite) {
    var n = 3;
    function pas() {
      if (n === 0) { suite(); return; }
      zone.innerHTML = '<div class="plateau"><p class="consigne">' + titre + '</p><div class="decompte" aria-live="assertive">' + n + "</div></div>";
      n--; vie.attendre(900, pas);
    }
    pas();
  }
  // Un hasard rejouable : la croix invisible est la même pour tout le monde.
  function hasard(graine) {
    return function () {
      graine |= 0; graine = (graine + 0x6d2b79f5) | 0;
      var t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cle(e) { return e.target && e.target.closest && e.target.closest("input, textarea, select"); }

  // ───────────────────────── Stroop ─────────────────────────
  // Chaque couleur d'encre autant de fois, jamais deux fois de suite la même
  // bonne réponse ; congruente = le mot de sa couleur, incongruente = jamais.
  function mancheStroop(congruente, nombre) {
    var base = [];
    for (var i = 0; i < nombre; i++) base.push(COULEURS[i % COULEURS.length]);
    var encres = base;
    for (var essai = 0; essai < 500; essai++) {
      encres = A.melanger(base);
      if (encres.every(function (c, k) { return k === 0 || c !== encres[k - 1]; })) break;
    }
    return encres.map(function (encre) {
      if (congruente) return { mot: encre, encre: encre };
      var autres = COULEURS.filter(function (c) { return c !== encre; });
      return { mot: autres[Math.floor(Math.random() * autres.length)], encre: encre };
    });
  }

  // Joue une manche ; rend les temps et les réponses justes.
  function jouerManche(zone, vie, essais, entete, fini) {
    var i = 0, temps = [], justes = [], t0 = 0, attend = false;
    zone.innerHTML = '<div class="plateau"><p class="etat" aria-live="polite">' + entete + "</p>" +
      '<div class="mot-couleur attente" aria-live="assertive">Prêt…</div><div class="couleurs">' +
      COULEURS.map(function (c, k) {
        return '<button type="button" class="couleur" data-c="' + c.id + '" style="--c:' + c.c + '"><i></i>' + c.nom + "<kbd>" + (k + 1) + "</kbd></button>";
      }).join("") + "</div></div>";
    var mot = zone.querySelector(".mot-couleur"), etat = zone.querySelector(".etat");
    function montrer() {
      if (i >= essais.length) { fini(temps, justes); return; }
      var e = essais[i];
      mot.className = "mot-couleur";
      mot.style.color = e.encre.c;
      mot.textContent = e.mot.mot;
      etat.textContent = entete + " · " + (i + 1) + " sur " + essais.length;
      // Le chrono part quand le mot est vraiment à l'écran (deux images plus
      // tard) ; repli si le navigateur retient ses images (onglet en fond).
      var ici = i;
      function partir() { if (!attend && i === ici) { t0 = performance.now(); attend = true; } }
      vie.image(function () { vie.image(partir); });
      vie.attendre(150, partir);
    }
    function repondre(id) {
      if (!attend) return;
      attend = false;
      var dt = performance.now() - t0, juste = id === essais[i].encre.id;
      temps.push(dt); justes.push(juste);
      mot.classList.add(juste ? "eclair-juste" : "eclair-faux");
      i++;
      vie.attendre(juste ? 260 : 520, function () { mot.textContent = ""; vie.attendre(140, montrer); });
    }
    vie.ecouter(zone, "click", function (e) { var b = e.target.closest("[data-c]"); if (b) repondre(b.getAttribute("data-c")); });
    vie.ecouter(document, "keydown", function (e) {
      if (cle(e) || e.repeat) return;
      var k = parseInt(e.key, 10);
      if (k >= 1 && k <= 4 && attend) { e.preventDefault(); repondre(COULEURS[k - 1].id); }
    });
    vie.attendre(700, montrer);
  }
  function resultat(temps, justes) {
    var t = temps.filter(function (_, k) { return justes[k]; });  // une erreur ne dit rien du temps de lecture
    return { moyenne: moyenne(t), erreurs: justes.filter(function (j) { return !j; }).length };
  }

  function stroop(zone, vie) {
    var n = notionDe.stroop;
    zone.innerHTML = '<div class="plateau"><h2 class="verdict">Lisez la couleur de l\'encre, pas le mot.</h2><ul class="consigne-liste">' +
      "<li>Un mot de couleur s'affiche. Touchez la couleur de son <b>encre</b>.</li>" +
      "<li>Deux manches de 12 mots : d'abord des mots assortis à leur encre, puis des mots qui ne le sont pas.</li>" +
      "<li>Allez vite, sans vous tromper. Au clavier : touches 1 à 4.</li></ul>" +
      '<button type="button" class="btn or" data-go>Commencer</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", function () {
      jouerManche(zone, vie, mancheStroop(true, 12), "Manche 1 : mots assortis", function (t1, j1) {
        var r1 = resultat(t1, j1);
        zone.innerHTML = '<div class="plateau"><h2 class="verdict">Manche 2</h2><p class="consigne">Maintenant, le mot et son encre ne correspondent plus. Répondez toujours à la couleur de l\'encre.</p>' +
          '<button type="button" class="btn or" data-go>Continuer</button></div>';
        zone.querySelector("[data-go]").addEventListener("click", function () {
          jouerManche(zone, vie, mancheStroop(false, 12), "Manche 2 : mots trompeurs", function (t2, j2) {
            var r2 = resultat(t2, j2);
            var ecart = r1.moyenne > 0 ? Math.round(((r2.moyenne - r1.moyenne) / r1.moyenne) * 100) : 0;
            zone.innerHTML = '<div class="plateau"><p class="kicker">Votre résultat</p><h2 class="verdict">' +
              (ecart > 0 ? "Freiner la lecture vous a demandé " + ecart + " % de temps en plus." : "Pas d'écart cette fois : rejouez pour voir si cela se confirme.") +
              '</h2><div class="mesures">' + mesure(ms(r1.moyenne), "mots assortis") + mesure(ms(r2.moyenne), "mots trompeurs") +
              mesure((ecart > 0 ? "+" : "") + ecart + " %", "écart", true) + mesure(r1.erreurs + r2.erreurs, "erreurs") + "</div>" +
              '<p class="explique">' + A.fr(n ? n.phrase : "") + "</p>" +
              '<div class="boutons"><button type="button" class="btn or" data-rejouer>Rejouer</button>' + lienNotion("stroop") + "</div></div>";
            zone.querySelector("[data-rejouer]").addEventListener("click", function () { stroop(zone, vie); });
          });
        });
      });
    });
  }

  // La version éclair de l'accueil : six mots trompeurs.
  function stroopEclair(zone) {
    var vie = Vie();
    function accueil() {
      zone.innerHTML = '<div class="plateau"><div class="mot-couleur" style="color:' + COULEURS[1].c + '">ROUGE</div>' +
        '<p class="consigne">Ici, la bonne réponse est « bleu ». Prêt pour six mots ?</p>' +
        '<button type="button" class="btn or" data-go>Commencer</button></div>';
      zone.querySelector("[data-go]").addEventListener("click", function () {
        jouerManche(zone, vie, mancheStroop(false, 6).slice(0, 6), "Mots trompeurs", function (t, j) {
          var r = resultat(t, j);
          zone.innerHTML = '<div class="plateau"><p class="kicker">Votre temps</p><div class="mesures">' +
            mesure(ms(r.moyenne), "par mot, en moyenne", true) + mesure(r.erreurs, r.erreurs > 1 ? "erreurs" : "erreur") + "</div>" +
            '<p class="explique">Avec des mots assortis à leur encre, on va nettement plus vite. L\'expérience complète mesure l\'écart.</p>' +
            '<div class="boutons"><a class="btn or" href="' + A.racine + 'experiences/#stroop">L\'expérience complète</a>' +
            '<button type="button" class="btn contour" data-rejouer>Rejouer</button></div></div>';
          zone.querySelector("[data-rejouer]").addEventListener("click", accueil);
        });
      });
    }
    accueil();
  }

  // ───────────────────────── Croix invisible ─────────────────────────
  var CE = { largeur: 800, hauteur: 600, taille: 50, epaisseur: 14, parSeconde: 60, duree: 15, debut: 5, fin: 10, graine: 20260924, fond: "#8C95A4" };
  var simulation = null;
  function simuler() {
    if (simulation) return simulation;
    var h = hasard(CE.graine), mobiles = [], images = [], rebonds = 0, dt = 1 / CE.parSeconde;
    for (var k = 0; k < 8; k++) {
      var v = 110 + h() * 140, ang = (15 + h() * 60) * Math.PI / 180, q = Math.floor(h() * 4);
      mobiles.push({ blanche: k < 4, lettre: k % 2 === 0 ? "L" : "T",
        x: 40 + h() * (CE.largeur - 130), y: 40 + h() * (CE.hauteur - 130),
        vx: Math.cos(ang) * v * (q & 1 ? -1 : 1), vy: Math.sin(ang) * v * (q & 2 ? -1 : 1) });
    }
    for (var n = 0; n <= CE.duree * CE.parSeconde; n++) {
      images.push(mobiles.map(function (m) { return [m.x, m.y]; }));
      mobiles.forEach(function (m) {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (m.x < 0 || m.x > CE.largeur - CE.taille) { m.vx = -m.vx; m.x = Math.min(CE.largeur - CE.taille, Math.max(0, m.x)); if (m.blanche) rebonds++; }
        if (m.y < 0 || m.y > CE.hauteur - CE.taille) { m.vy = -m.vy; m.y = Math.min(CE.hauteur - CE.taille, Math.max(0, m.y)); if (m.blanche) rebonds++; }
      });
    }
    simulation = { formes: mobiles.map(function (m) { return { blanche: m.blanche, lettre: m.lettre }; }), images: images, rebonds: rebonds };
    return simulation;
  }
  function croixA(n) {
    var t = n / CE.parSeconde;
    if (t < CE.debut || t > CE.fin) return null;
    var p = (t - CE.debut) / (CE.fin - CE.debut);
    return [CE.largeur - (CE.largeur + CE.taille) * p, (CE.hauteur - CE.taille) / 2];
  }
  function rectangles(lettre, x, y) {
    var T = CE.taille, E = CE.epaisseur;
    if (lettre === "L") return [[x, y, E, T], [x, y + T - E, T, E]];
    if (lettre === "T") return [[x, y, T, E], [x + (T - E) / 2, y, E, T]];
    return [[x, y + (T - E) / 2, T, E], [x + (T - E) / 2, y, E, T]];          // la croix
  }
  function dessiner(ctx, sim, n, montrer) {
    ctx.fillStyle = CE.fond; ctx.fillRect(0, 0, CE.largeur, CE.hauteur);
    sim.images[n].forEach(function (p, k) {
      ctx.fillStyle = sim.formes[k].blanche ? "#FFFFFF" : "#11161F";
      rectangles(sim.formes[k].lettre, p[0], p[1]).forEach(function (r) { ctx.fillRect(r[0], r[1], r[2], r[3]); });
    });
    var c = croixA(n);
    if (c) {
      ctx.fillStyle = "#11161F";
      rectangles(null, c[0], c[1]).forEach(function (r) { ctx.fillRect(r[0], r[1], r[2], r[3]); });
      if (montrer) {
        ctx.strokeStyle = "#E3A72F"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(c[0] + CE.taille / 2, c[1] + CE.taille / 2, CE.taille * 0.95, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  function toile(zone, texte) {
    zone.innerHTML = '<div class="plateau"><p class="etat">' + texte + '</p><canvas class="toile" width="800" height="600" role="img" aria-label="Animation : des formes rebondissent pendant 15 secondes"></canvas></div>';
    var cv = zone.querySelector("canvas"), r = Math.min(2, window.devicePixelRatio || 1);
    cv.width = CE.largeur * r; cv.height = CE.hauteur * r;
    var ctx = cv.getContext("2d"); ctx.scale(r, r);
    return ctx;
  }
  function animer(zone, vie, montrer, fini) {
    var sim = simuler(), ctx = toile(zone, montrer ? "Regardez la croix entourée d'or" : "Comptez les rebonds des formes blanches"), t0 = null;
    function pas(t) {
      if (t0 === null) t0 = t;
      var n = Math.min(sim.images.length - 1, Math.floor(((t - t0) / 1000) * CE.parSeconde));
      dessiner(ctx, sim, n, montrer);
      if (n < sim.images.length - 1) vie.image(pas); else vie.attendre(300, fini);
    }
    vie.image(pas);
  }

  function cecite(zone, vie) {
    var compte = 0, vue = false;
    zone.innerHTML = '<div class="plateau"><h2 class="verdict">Comptez, de tête.</h2><ul class="consigne-liste">' +
      "<li>Des formes blanches et noires vont rebondir pendant 15 secondes.</li>" +
      "<li>Comptez les rebonds des formes <b>blanches</b> sur les bords du cadre. Ignorez les noires.</li>" +
      "<li>Restez concentré jusqu'au bout : on vous demandera votre total.</li></ul>" +
      '<button type="button" class="btn or" data-go>Commencer</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", function () {
      decompte(zone, vie, "Comptez les rebonds des formes blanches", function () { animer(zone, vie, false, demanderCompte); });
    });
    function demanderCompte() {
      zone.innerHTML = '<div class="plateau"><h2 class="verdict">Combien de rebonds des formes blanches ?</h2>' +
        '<label class="vu-lecteur" for="rebonds">Rebonds comptés</label><input id="rebonds" class="nombre" type="number" inputmode="numeric" min="0" max="99" value="0">' +
        '<button type="button" class="btn or" data-go>Valider</button></div>';
      var champ = zone.querySelector("input");
      champ.focus(); champ.select();
      function valider() { compte = Math.max(0, parseInt(champ.value, 10) || 0); demanderAutre(); }
      zone.querySelector("[data-go]").addEventListener("click", valider);
      champ.addEventListener("keydown", function (e) { if (e.key === "Enter") valider(); });
    }
    function choix(titre, options, suite) {
      zone.innerHTML = '<div class="plateau"><h2 class="verdict">' + titre + '</h2><div class="choix-ligne">' +
        options.map(function (o, k) { return '<button type="button" class="btn contour" data-k="' + k + '">' + o[0] + "</button>"; }).join("") + "</div></div>";
      zone.querySelectorAll("[data-k]").forEach(function (b) {
        b.addEventListener("click", function () { suite(options[+b.getAttribute("data-k")][1]); });
      });
    }
    function demanderAutre() {
      choix("Avez-vous remarqué autre chose ?", [["Oui", true], ["Non", false]], function (oui) {
        if (!oui) { vue = false; reveler(); return; }
        choix("Qu'avez-vous vu passer ?", [["Une croix", true], ["Un cercle", false], ["Une lettre de plus", false], ["Je ne sais plus", false]],
          function (v) { vue = v; reveler(); });
      });
    }
    function reveler() {
      var sim = simuler();
      zone.innerHTML = '<div class="plateau"><p class="kicker">La révélation</p><h2 class="verdict">Il y avait ' + sim.rebonds + " rebonds… et une croix noire.</h2>" +
        '<p class="explique">' + (vue ? "Vous l'avez vue : bravo. Dans l'étude d'origine, seuls 6 % des participants remarquent la croix noire quand ils suivent les formes blanches, contre 94 % quand elle est blanche (Most et al., 2001)."
          : "Elle a traversé l'écran pendant cinq secondes, en plein milieu. Votre attention filtrait tout ce qui était noir : c'est la cécité d'inattention.") + "</p>" +
        '<canvas class="toile" width="800" height="600" role="img" aria-label="Image fixe : la croix noire au centre, entourée d\'or"></canvas>' +
        '<div class="boutons"><button type="button" class="btn or" data-go>Rejouer en montrant la croix</button>' +
        '<button type="button" class="btn contour" data-fin>Voir mon résultat</button></div></div>';
      var cv = zone.querySelector("canvas"), r = Math.min(2, window.devicePixelRatio || 1);
      cv.width = CE.largeur * r; cv.height = CE.hauteur * r;
      var ctx = cv.getContext("2d"); ctx.scale(r, r);
      dessiner(ctx, sim, Math.round(((CE.debut + CE.fin) / 2) * CE.parSeconde), true);
      zone.querySelector("[data-go]").addEventListener("click", function () { animer(zone, vie, true, bilan); });
      zone.querySelector("[data-fin]").addEventListener("click", bilan);
    }
    function bilan() {
      var sim = simuler();
      zone.innerHTML = '<div class="plateau"><p class="kicker">Votre résultat</p><h2 class="verdict">' + (vue ? "Croix vue" : "Croix manquée") + "</h2>" +
        '<div class="mesures">' + mesure(compte, "rebonds comptés") + mesure(sim.rebonds, "rebonds réels") + mesure(vue ? "Oui" : "Non", "croix remarquée", true) + "</div>" +
        '<p class="explique">' + A.fr(notionDe.cecite ? notionDe.cecite.phrase : "") + "</p>" +
        '<div class="boutons"><button type="button" class="btn or" data-rejouer>Recommencer</button>' + lienNotion("cecite") + "</div></div>";
      zone.querySelector("[data-rejouer]").addEventListener("click", function () { cecite(zone, vie); });
    }
  }

  // ───────────────────────── Multitâche ─────────────────────────
  var MOT = "ATTENTION".split(""), CHIFFRES = "123456789".split("");
  function sequence(alternee) {
    if (!alternee) return MOT.concat(CHIFFRES);
    var s = [];
    MOT.forEach(function (l, k) { s.push(l, CHIFFRES[k]); });
    return s;
  }
  function multitache(zone, vie) {
    var touches = A.melanger(MOT.concat(CHIFFRES).filter(function (c, k, t) { return t.indexOf(c) === k; }));
    var resultats = [];
    zone.innerHTML = '<div class="plateau"><h2 class="verdict">Une tâche, puis deux en alternance.</h2><ul class="consigne-liste">' +
      "<li>Manche 1 : tapez le mot <b>ATTENTION</b>, puis les chiffres <b>1 à 9</b>.</li>" +
      "<li>Manche 2 : les mêmes, mais en alternant : <b>A1T2T3E4N5T6I7O8N9</b>.</li>" +
      "<li>Touchez les touches à l'écran, ou tapez au clavier. Le chrono mesure chaque manche.</li></ul>" +
      '<button type="button" class="btn or" data-go>Commencer</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", function () { manche(false); });

    function manche(alternee) {
      var suite = sequence(alternee), i = 0, erreurs = 0, t0 = 0, fini = false;
      decompte(zone, vie, alternee ? "Manche 2 : en alternant, A1T2T3…" : "Manche 1 : ATTENTION, puis 123456789", function () {
        zone.innerHTML = '<div class="plateau"><p class="etat">' + (alternee ? "Manche 2 : en alternant" : "Manche 1 : l'une après l'autre") + "</p>" +
          '<div class="chrono" aria-hidden="true">0,0 s</div><div class="suite" aria-label="Suite à taper">' +
          suite.map(function (c) { return "<span>" + c + "</span>"; }).join("") + '</div><div class="clavier">' +
          touches.map(function (c) { return '<button type="button" class="touche" data-t="' + c + '">' + c + "</button>"; }).join("") + "</div></div>";
        var cases = zone.querySelectorAll(".suite span"), chrono = zone.querySelector(".chrono");
        cases[0].classList.add("courant");
        t0 = performance.now();
        (function tic() { if (fini) return; chrono.textContent = secondes(performance.now() - t0); vie.image(tic); })();
        function taper(c, bouton) {
          if (fini) return;
          if (c === suite[i]) {
            cases[i].classList.remove("courant"); cases[i].classList.add("fait"); i++;
            if (i === suite.length) {
              fini = true;
              resultats.push({ temps: performance.now() - t0, erreurs: erreurs });
              vie.attendre(400, function () { if (alternee) bilan(); else entracte(); });
            } else cases[i].classList.add("courant");
          } else {
            erreurs++;
            var b = bouton || zone.querySelector('[data-t="' + c + '"]');
            if (b) { b.classList.remove("erreur"); void b.offsetWidth; b.classList.add("erreur"); vie.attendre(320, function () { b.classList.remove("erreur"); }); }
          }
        }
        vie.ecouter(zone, "click", function (e) { var b = e.target.closest("[data-t]"); if (b) taper(b.getAttribute("data-t"), b); });
        vie.ecouter(document, "keydown", function (e) {
          if (cle(e) || e.repeat || e.key.length !== 1) return;
          var c = e.key.toUpperCase();
          if (touches.indexOf(c) >= 0) { e.preventDefault(); taper(c); }
        });
      });
    }
    function entracte() {
      zone.innerHTML = '<div class="plateau"><p class="kicker">Manche 1 : ' + secondes(resultats[0].temps) + '</p><h2 class="verdict">Maintenant, en alternant.</h2>' +
        '<p class="consigne">A, 1, T, 2, T, 3… Une lettre, un chiffre : votre attention bascule d\'une suite à l\'autre à chaque touche.</p>' +
        '<button type="button" class="btn or" data-go>Continuer</button></div>';
      zone.querySelector("[data-go]").addEventListener("click", function () { manche(true); });
    }
    function bilan() {
      var a = resultats[0], b = resultats[1], cout = a.temps > 0 ? Math.round(((b.temps - a.temps) / a.temps) * 100) : 0;
      zone.innerHTML = '<div class="plateau"><p class="kicker">Votre résultat</p><h2 class="verdict">' +
        (cout > 0 ? "Alterner vous a coûté " + cout + " % de temps en plus." : "Pas de surcoût cette fois : rejouez pour voir si cela se confirme.") + "</h2>" +
        '<div class="mesures">' + mesure(secondes(a.temps), "l'une après l'autre") + mesure(secondes(b.temps), "en alternant") +
        mesure((cout > 0 ? "+" : "") + cout + " %", "coût de la bascule", true) + mesure(a.erreurs + b.erreurs, "erreurs") + "</div>" +
        '<p class="explique">' + A.fr(notionDe.alternance ? notionDe.alternance.phrase : "") + "</p>" +
        '<div class="boutons"><button type="button" class="btn or" data-rejouer>Rejouer</button>' + lienNotion("alternance") + "</div></div>";
      zone.querySelector("[data-rejouer]").addEventListener("click", function () { multitache(zone, vie); });
    }
  }

  // ───────────────────────── Soupir cyclique ─────────────────────────
  var CYCLE = 9, DUREE_SOUFFLE = 63;
  function phaseSouffle(t) {
    var c = t % CYCLE;
    if (c < 2) return ["Inspirez par le nez", 0.55 + 0.33 * c / 2];
    if (c < 3) return ["Encore un peu", 0.88 + 0.12 * (c - 2)];
    return ["Expirez longuement par la bouche", 1 - 0.45 * (c - 3) / 6];
  }
  function souffle(zone, vie) {
    zone.innerHTML = '<div class="plateau"><h2 class="verdict">Une minute pour vous poser.</h2><ul class="consigne-liste">' +
      "<li>Deux inspirations par le nez : une longue, puis une courte pour finir de remplir.</li>" +
      "<li>Puis une longue expiration par la bouche.</li>" +
      "<li>Suivez le cercle pendant sept cycles de neuf secondes.</li></ul>" +
      '<button type="button" class="btn or" data-go>Commencer (1 min)</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", function () {
      zone.innerHTML = '<div class="plateau"><div class="souffle" aria-hidden="true"><div class="souffle-coeur"></div></div>' +
        '<p class="phase" aria-live="polite"></p><p class="reste"></p><button type="button" class="bouton-plat" data-stop>Arrêter</button></div>';
      var rond = zone.querySelector(".souffle"), phase = zone.querySelector(".phase"), reste = zone.querySelector(".reste"),
        t0 = performance.now(), derniere = -1;
      zone.querySelector("[data-stop]").addEventListener("click", fin);
      // Une horloge, pas une animation image par image : le cercle glisse vers
      // la taille de fin de chaque phase par une transition CSS de la bonne durée.
      var CIBLES = [[0.88, 2, "ease-out"], [1, 3, "ease-out"], [0.55, 9, "ease-in-out"]];
      function tic() {
        var s = (performance.now() - t0) / 1000;
        if (s >= DUREE_SOUFFLE) { fin(); return; }
        var c = s % CYCLE, k = c < 2 ? 0 : c < 3 ? 1 : 2, id = Math.floor(s / CYCLE) * 3 + k;
        if (id !== derniere) {
          derniere = id;
          rond.style.transition = "transform " + Math.max(0.1, CIBLES[k][1] - c).toFixed(2) + "s " + CIBLES[k][2];
          rond.style.setProperty("--e", CIBLES[k][0]);
          phase.textContent = phaseSouffle(s)[0];
        }
        reste.textContent = minutes(DUREE_SOUFFLE - s) + " restantes";
        vie.attendre(200, tic);
      }
      rond.style.setProperty("--e", 0.55);
      void rond.offsetWidth;
      tic();
      function fin() {
        if (!vie.vivant) return;
        zone.innerHTML = '<div class="plateau"><p class="kicker">C\'est fini</p><h2 class="verdict">Comment vous sentez-vous ?</h2>' +
          '<p class="explique">' + A.fr(notionDe["soupir-cyclique"] ? notionDe["soupir-cyclique"].phrase : "") + "</p>" +
          '<div class="boutons"><button type="button" class="btn or" data-rejouer>Recommencer</button>' + lienNotion("soupir-cyclique") + "</div></div>";
        zone.querySelector("[data-rejouer]").addEventListener("click", function () { souffle(zone, vie); });
      }
    });
  }

  // ───────────────────────── 5-4-3-2-1 ─────────────────────────
  var SENS = [[5, "choses que vous voyez"], [4, "sons que vous entendez"], [3, "contacts avec votre corps"], [2, "odeurs, même légères"], [1, "goût dans votre bouche"]];
  var PAS = 20;
  function ancrage(zone, vie) {
    zone.innerHTML = '<div class="plateau"><h2 class="verdict">Revenir dans l\'instant, sens par sens.</h2><ul class="consigne-liste">' +
      "<li>Cinq étapes de vingt secondes : cinq choses vues, quatre sons, trois contacts, deux odeurs, un goût.</li>" +
      "<li>Nommez-les dans votre tête, sans vous presser.</li>" +
      "<li>Vous pouvez passer à l'étape suivante quand vous voulez.</li></ul>" +
      '<button type="button" class="btn or" data-go>Commencer</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", function () {
      zone.innerHTML = '<div class="plateau"><div class="anneau"><div><b></b></div></div><p class="phase" aria-live="polite"></p>' +
        '<div class="points">' + SENS.map(function () { return "<i></i>"; }).join("") + "</div>" +
        '<button type="button" class="btn contour" data-passer>Étape suivante</button></div>';
      var anneau = zone.querySelector(".anneau"), chiffre = zone.querySelector(".anneau b"), phase = zone.querySelector(".phase"),
        points = zone.querySelectorAll(".points i"), etape = -1, t0 = performance.now(), decalage = 0, fini = false;
      function maintenant() { return (performance.now() - t0) / 1000 + decalage; }
      zone.querySelector("[data-passer]").addEventListener("click", function () { decalage += PAS - (maintenant() % PAS); tic(); });
      function tic() {
        if (fini) return;
        var s = maintenant(), e = Math.floor(s / PAS);
        if (e >= SENS.length) { fini = true; fin(); return; }
        if (e !== etape) {
          etape = e;
          chiffre.textContent = SENS[e][0];
          phase.textContent = SENS[e][0] + " " + SENS[e][1];
          points.forEach(function (p, k) { p.classList.toggle("fait", k < e); });
        }
        anneau.style.setProperty("--p", ((s - e * PAS) / PAS).toFixed(3));
      }
      (function boucle() { tic(); if (!fini) vie.attendre(200, boucle); })();
      function fin() {
        zone.innerHTML = '<div class="plateau"><p class="kicker">C\'est fini</p><h2 class="verdict">Vous êtes de retour ici et maintenant.</h2>' +
          '<p class="explique">' + A.fr(notionDe["ancrage-54321"] ? notionDe["ancrage-54321"].phrase : "") + "</p>" +
          '<div class="boutons"><button type="button" class="btn or" data-rejouer>Recommencer</button>' + lienNotion("ancrage-54321") + "</div></div>";
        zone.querySelector("[data-rejouer]").addEventListener("click", function () { ancrage(zone, vie); });
      }
    });
  }

  var MOTEURS = { stroop: stroop, cecite: cecite, multitache: multitache, souffle: souffle, ancrage: ancrage };

  // ───────────────────────── La page des expériences ─────────────────────────
  function duree(s) { return s < 60 ? s + " s" : s % 60 ? Math.floor(s / 60) + " min " + (s % 60) + " s" : s / 60 + " min"; }
  var liste = document.querySelector("[data-experiences]"), scene = document.querySelector("[data-scene]");
  if (liste) {
    liste.innerHTML = C.experiences.map(function (e, k) {
      return '<button type="button" class="exp-carte apparait" data-exp="' + e.id + '"><span class="exp-num">' + (k + 1) + "</span>" +
        '<span><span class="exp-titre">' + A.fr(e.titre) + '</span><span class="exp-promesse">' + A.fr(e.promesse) + "</span></span>" + '<span class="duree">' + duree(e.dureeSecondes) + "</span></button>";
    }).join("");
  }
  var vie = null, retour = null;
  function lancer(id, depuisAdresse) {
    var e = experienceDe[id];
    if (!e || !scene || !MOTEURS[id]) return;
    if (vie) vie.fin();
    vie = Vie();
    scene.querySelector("[data-scene-titre]").textContent = e.titre;
    var zone = scene.querySelector("[data-scene-corps]");
    if (!depuisAdresse) history.replaceState(null, "", "#" + id);
    document.title = e.titre + " · Apprensia";
    if (!scene.open) { retour = document.activeElement; scene.showModal(); }
    MOTEURS[id](zone, vie);
    var b = zone.querySelector("[data-go]");
    if (b) b.focus();
  }
  if (scene) {
    scene.addEventListener("close", function () {
      if (scene.open) return;                     // rouverte entre-temps : rien à nettoyer
      if (vie) { vie.fin(); vie = null; }
      scene.querySelector("[data-scene-corps]").innerHTML = "";
      history.replaceState(null, "", location.pathname + location.search);
      document.title = "Les expériences · Apprensia";
      if (retour && retour.focus) retour.focus();
    });
    scene.querySelector("[data-fermer]").addEventListener("click", function () { scene.close(); });
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-exp]"); if (b) lancer(b.getAttribute("data-exp")); });
    function depuisAdresse() { var h = location.hash.slice(1); if (experienceDe[h]) lancer(h, true); }
    addEventListener("hashchange", depuisAdresse);
    depuisAdresse();
  }

  document.querySelectorAll("[data-stroop-eclair]").forEach(stroopEclair);
})();
