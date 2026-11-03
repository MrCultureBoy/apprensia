/* Apprensia : le formulaire « Nous écrire ». Rien n'est envoyé par le site :
   il prépare un courriel dans la messagerie du visiteur, qui le relit et l'envoie. */
(function () {
  "use strict";
  function copier(texte, fini) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { fini(true); }, function () { fini(false); });
    } else { fini(false); }
  }

  document.querySelectorAll("[data-demande]").forEach(function (f) {
    var voulu = { enseignants: 0, lyceens: 1, deux: 2, app: 3, autre: 4 }[new URLSearchParams(location.search).get("atelier")];
    if (voulu != null && f.elements.atelier) f.elements.atelier.selectedIndex = voulu;
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
      // Sur un poste sans logiciel de messagerie (webmail, ENT), rien ne s'ouvre :
      // on propose de copier le message prêt et l'adresse, à coller soi-même.
      var texte = "À : " + contact + "\nObjet : " + objet + "\n\n" + corps;
      retour.hidden = false;
      retour.innerHTML = "<span>Votre messagerie s'ouvre avec le message prêt. Rien ne s'ouvre ? Copiez-le et collez-le dans votre messagerie.</span>" +
        '<span class="boutons"><button type="button" class="btn encre petit" data-copier="message">Copier le message</button>' +
        '<button type="button" class="btn contour petit" data-copier="adresse">Copier l\'adresse</button></span>';
      retour.querySelectorAll("[data-copier]").forEach(function (b) {
        b.addEventListener("click", function () {
          var quoi = b.getAttribute("data-copier"), valeur = quoi === "message" ? texte : contact;
          copier(valeur, function (ok) {
            b.textContent = ok ? (quoi === "message" ? "Message copié" : "Adresse copiée") : contact;
          });
        });
      });
    });
  });
})();
