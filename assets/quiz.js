/* Apprensia : le Vrai ou faux. Les dix questions du chapitre « Idées reçues »
   de l'app, dans un ordre tiré au hasard, avec l'explication et la notion
   après chaque réponse. Le meilleur score reste dans ce navigateur. */
(function () {
  "use strict";
  var A = window.Apprensia, C = window.APPRENSIA, zone = document.querySelector("[data-quiz]");
  if (!A || !C || !zone || !C.questions.length) return;
  var notionDe = {};
  C.notions.forEach(function (n) { notionDe[n.id] = n; });
  var LETTRES = "ABCD";
  var questions, i, score;

  function accueil() {
    var meilleur = A.lire("quiz.meilleur");
    zone.innerHTML = '<div class="score"><p class="kicker">' + C.questions.length + " questions · 3 minutes</p>" +
      '<h2>Qu\'en pensez-vous vraiment ?</h2><p class="lead">Répondez sans chercher : une erreur ici n\'est pas un échec, c\'est ce qui fait retenir l\'explication qui suit.</p>' +
      (meilleur != null ? '<p class="doux">Votre meilleur score : ' + meilleur + " sur " + C.questions.length + "</p>" : "") +
      '<button type="button" class="btn or" data-go>Commencer</button></div>';
    zone.querySelector("[data-go]").addEventListener("click", commencer);
  }
  function commencer() {
    questions = A.melanger(C.questions); i = 0; score = 0;
    poser();
  }
  function poser() {
    var q = questions[i], choix = A.melanger([q.bonne].concat(q.mauvaises));
    zone.innerHTML = '<div class="quiz-entete"><span>Question ' + (i + 1) + " sur " + questions.length + "</span><span>" + score + " juste" + (score > 1 ? "s" : "") + "</span></div>" +
      '<div class="barre" style="--p:' + (i / questions.length) + '"><i></i></div>' +
      '<h2 tabindex="-1">' + A.fr(q.texte) + '</h2><div class="reponses">' +
      choix.map(function (c, k) {
        return '<button type="button" class="reponse" data-juste="' + (c === q.bonne) + '"><span class="lettre">' + LETTRES[k] + "</span><span>" + A.fr(c) + "</span></button>";
      }).join("") + '</div><div data-suite aria-live="polite"></div>';
    zone.querySelector("h2").focus({ preventScroll: true });
    zone.querySelectorAll(".reponse").forEach(function (b) {
      b.addEventListener("click", function () { repondre(b, q); });
    });
  }
  function repondre(bouton, q) {
    var juste = bouton.getAttribute("data-juste") === "true";
    if (juste) score++;
    zone.querySelectorAll(".reponse").forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-juste") === "true") b.classList.add("juste");
      else if (b === bouton) b.classList.add("faux");
      else b.classList.add("estompe");
    });
    var n = notionDe[q.notion], derniere = i === questions.length - 1;
    zone.querySelector("[data-suite]").innerHTML = '<div class="explication"><p><b>' + (juste ? "Juste." : "Pas tout à fait.") + "</b> " + A.fr(q.explication) + "</p>" +
      (n ? '<a href="' + A.racine + "notions/#" + n.id + '">Lire la notion : ' + A.fr(n.titre) + "</a>" : "") + "</div>" +
      '<button type="button" class="btn encre" data-suivante>' + (derniere ? "Voir mon score" : "Question suivante") + "</button>";
    var suivante = zone.querySelector("[data-suivante]");
    suivante.focus({ preventScroll: true });
    suivante.addEventListener("click", function () { i++; if (derniere) fin(); else poser(); });
    zone.querySelector(".barre").style.setProperty("--p", (i + 1) / questions.length);
  }
  function fin() {
    var meilleur = A.lire("quiz.meilleur");
    if (meilleur == null || score > meilleur) A.stocker("quiz.meilleur", score);
    var total = questions.length, part = score / total;
    var mot = part === 1 ? "Aucune idée reçue ne vous a eu." : part >= 0.7 ? "Très solide : quelques pièges ont fonctionné." :
      part >= 0.4 ? "Ces idées reçues sont tenaces : elles circulent partout, même chez les enseignants." : "Bonne nouvelle : vous venez d'en corriger beaucoup.";
    zone.innerHTML = '<div class="score"><p class="kicker">Votre score</p><div class="grand">' + score + " / " + total + "</div>" +
      '<h2>' + mot + '</h2><p class="lead">Refaites ce questionnaire dans quelques jours : c\'est l\'espacement qui installe la mémoire. L\'app Apprensia le fait pour vous, avec 48 questions.</p>' +
      '<div class="boutons"><button type="button" class="btn or" data-go>Recommencer</button><a class="btn contour" href="' + A.racine + 'notions/#chapitre-idees-recues">Les idées reçues, en détail</a></div></div>';
    zone.querySelector("[data-go]").addEventListener("click", commencer);
  }
  accueil();
})();
