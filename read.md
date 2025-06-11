Projet Gestion des Notes
Ce projet est une application web pour gérer les cours, emplois du temps, et notes des étudiants, utilisant Firebase pour l'authentification et Firestore pour la base de données.
Prérequis

Node.js (pour Firebase CLI, optionnel) : https://nodejs.org
Python (pour servir localement) : https://www.python.org
Un compte Google pour accéder à Firebase
Un navigateur moderne (Chrome, Firefox, etc.)
Git : https://git-scm.com

Installation

Cloner le dépôt :
git clone https://github.com/ton-utilisateur/projet-gestion-notes.git
cd projet-gestion-notes


Configurer Firebase :

Option 1 : Utiliser le projet Firebase existant :
Demande-moi les clés Firebase pour js/firebase-config.js.
Copie les clés dans un nouveau fichier js/firebase-config.js basé sur js/firebase-config.example.js :export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};


Assure-toi que je t'ai ajouté comme membre dans mon projet Firebase (envoie-moi ton email Google).


Option 2 : Créer ton propre projet Firebase :
Va sur https://console.firebase.google.com et crée un nouveau projet.
Active Authentication (Email/Password) et Firestore Database.
Ajoute une application web pour obtenir ta firebaseConfig, et copie-la dans js/firebase-config.js.
Configure les règles Firestore (voir firestore.rules dans le dépôt ou demande-moi une copie).
Importe les données de test (voir section "Données de test").




Configurer les règles Firestore :

Dans la console Firebase, va dans Firestore > Rules.
Copie-colle les règles depuis firestore.rules (demande-moi si absent) et publie-les.


Servir l'application localement :

Ouvre un terminal dans le dossier du projet.
Lance un serveur local avec Python :python -m http.server 8000


Ouvre ton navigateur à : http://localhost:8000/html/index.html



Test de l'application

Connexion :

Utilise les identifiants de test (demande-moi) :
Professeur : prof@univ.fr / password123
Étudiant : etudiant@univ.fr / password123


Connecte-toi sur http://localhost:8000/html/index.html.


Fonctionnalités :

Professeur :
Crée/supprime des cours.
Ajoute des créneaux d'emploi du temps.
Attribue des notes aux étudiants.


Étudiant :
Inscris-toi/désinscris-toi des cours.
Consulte ton emploi du temps et tes notes.




Débogage :

Ouvre la console du navigateur (F12 > Console) pour voir les logs.
Si erreur, vérifie :
La configuration Firebase dans js/firebase-config.js.
Les règles Firestore.
Les données dans Firestore (cours, utilisateurs, notes).





Données de test (Option 2)
Si tu utilises ton propre projet Firebase, ajoute ces données dans Firestore :

Collection cours :{
  "course123": {
    "name": "Mathématiques",
    "description": "Cours de maths",
    "professeur": "prof@univ.fr",
    "professeurId": "<uid_prof>",
    "etudiants": ["<uid_etudiant>"],
    "createdAt": "2025-06-10T12:00:00Z"
  }
}


Collection utilisateurs :{
  "<uid_prof>": {
    "email": "prof@univ.fr",
    "fullName": "Professeur Test",
    "role": "professeur",
    "coursCrees": ["course123"]
  },
  "<uid_etudiant>": {
    "email": "etudiant@univ.fr",
    "fullName": "Étudiant Test",
    "role": "etudiant",
    "coursInscrits": ["course123"]
  }
}


Collection notes :{
  "note123": {
    "courseId": "course123",
    "etudiantId": "<uid_etudiant>",
    "professeurId": "<uid_prof>",
    "note": 15,
    "commentaire": "Bon travail",
    "createdAt": "2025-06-10T12:00:00Z"
  }
}



Remplace <uid_prof> et <uid_etudiant> par les UID générés dans Firebase Authentication.
Problèmes connus

Si les notes ne s'affichent pas, vérifie la console pour des erreurs comme Erreur onSnapshot notes : Missing or insufficient permissions.
Contacte-moi si tu rencontres des bugs !

Déploiement (Facultatif)
Pour héberger le projet en ligne, utilise Firebase Hosting :

Installe Firebase CLI :npm install -g firebase-tools


Connecte-toi :firebase login


Initialise Hosting :firebase init hosting


Public directory : public (ou . pour la racine).
Single-page app : No.


Déploie :firebase deploy --only hosting



Contact
Pour toute question, envoie-moi un message !
