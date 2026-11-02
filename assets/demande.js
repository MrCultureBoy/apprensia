/* Apprensia : le formulaire « Nous écrire ». Rien n'est envoyé par le site :
   il prépare un courriel dans la messagerie du visiteur, qui le relit et l'envoie. */
(function () {
  "use strict";
  document.querySelectorAll("[data-demande]").forEach(function (f) {
    var contact = f.getAttribute("data-contact"), retour = f.querySelector(".demande-retour");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
      var objet = "Apprensia : " + v("atelier") + (v("etablissement") ? " (" + v("etablissement") + ")" : "");
      var corps = ["Bonjour,", "",
        "Je suis : " + v("profil"),
        v("etablissement") ? "Établissement ou structure : " + v("etablissement") : "",
        "Ce qui m'intéresse : " + v("atelier"),
        v("periode") ? "Période envisagée : " + v("periode") : "",
        "", v("message") || "(Votre message ici.)", "", "Bien cordialement,"
      ].filter(function (l, k, t) { return l !== "" || (t[k - 1] !== ""); }).join("\n");
      location.href = "mailto:" + contact + "?subject=" + encodeURIComponent(objet) + "&body=" + encodeURIComponent(corps);
      retour.hidden = false;
      retour.textContent = "Votre messagerie s'ouvre avec le message prêt. Rien ne se passe ? Écrivez directement à " + contact + ".";
    });
  });
})();
