/**
 * Google Apps Script — Collecte des réponses du questionnaire AAFU 2026
 *
 * INSTALLATION :
 * 1. Créer un Google Sheet vierge
 * 2. Aller dans Extensions > Apps Script
 * 3. Coller ce code dans l'éditeur
 * 4. Cliquer sur "Déployer" > "Nouveau déploiement"
 * 5. Choisir "Application Web"
 *    - Exécuter en tant que : "Moi"
 *    - Qui a accès : "Tout le monde"
 * 6. Copier l'URL générée et la coller dans questionnaire.html (variable APPS_SCRIPT_URL)
 *
 * La première ligne du Sheet sera automatiquement remplie avec les en-têtes.
 */

// Colonnes attendues dans l'ordre
var COLUMNS = [
  'timestamp',
  'q1', 'q2', 'q3', 'q4', 'q5_type', 'q5_cp', 'q5_pays',
  'q6', 'q7',
  'q8_web', 'q8_facebook', 'q8_instagram',
  'q9', 'q10',
  'q11', 'q11_raison',
  'q12', 'q13', 'q14', 'q15',
  'q16',
  'q17', 'q18', 'q19', 'q20', 'q21',
  'q22', 'q22_1', 'q22_2', 'q22_3',
  'q23', 'q23_articles',
  'q23_1',
  'q23_2_maquette', 'q23_2_photos', 'q23_2_rubriques', 'q23_2_suggestions',
  'q23_3', 'q23_3_autres',
  'q23_4', 'q23_4_sujets',
  'q24', 'q24_contact',
  'q25',
  'q26', 'q26_1', 'q26_2',
  'q27', 'q27_1',
  'q27_2', 'q27_2_suggestions',
  'q27_3', 'q27_3_autres',
  'q28', 'q28_1',
  'q28_2', 'q28_2_suggestions',
  'q28_3', 'q28_4', 'q28_4_suggestions',
  'q29', 'q29_1', 'q29_2',
  'q29_3', 'q29_3_autres',
  'q29_4', 'q29_5',
  'q29_6_dest1', 'q29_6_dest2', 'q29_6_dest3', 'q29_6_dest4', 'q29_6_dest5',
  'q30', 'q30_1', 'q30_2', 'q30_3',
  'q31', 'q32', 'q33', 'q34', 'q35', 'q36', 'q37',
  'nom', 'prenom', 'adresse', 'dp_code_postal', 'ville', 'email', 'telephone'
];

// Labels lisibles pour les en-têtes
var HEADERS = {
  'timestamp': 'Horodatage',
  'q1': '1. Sexe',
  'q2': '2. Année départ retraite',
  'q3': '3. Statut',
  'q4': '4. Nationalité',
  'q5_type': '5. Pays résidence',
  'q5_cp': '5. Code postal (France)',
  'q5_pays': '5. Pays (autre)',
  'q6': '6. Relation UNESCO (1-10)',
  'q7': '7. Personnalité',
  'q8_web': '8. Site web AAFU',
  'q8_facebook': '8. Facebook',
  'q8_instagram': '8. Instagram',
  'q9': '9. Reçoit LIEN/LINK',
  'q10': '10. Reçoit mails AAFU',
  'q11': '11. Contacts secrétariat',
  'q11_raison': '11. Raison aucun contact',
  'q12': '12. Satisfaction contacts (1-10)',
  'q13': '13. Bien représenté (1-10)',
  'q14': '14. Maintien liens (1-10)',
  'q15': '15. Souhait engagement (1-10)',
  'q16': '16. Nouvelle dynamique',
  'q17': '17. Info FAFICS',
  'q18': '18. Info UNESCO admin',
  'q19': '19. Utilise services',
  'q20': '20. Satisfait services',
  'q21': '21. Comment mieux aider',
  'q22': '22. Visite sites web',
  'q22_1': '22.1 Rubriques consultées',
  'q22_2': '22.2 Pourquoi non',
  'q22_3': '22.3 Propositions sites',
  'q23': '23. Lecture LIEN/LINK',
  'q23_articles': '23. Articles lus',
  'q23_1': '23.1 Satisfait présentation',
  'q23_2_maquette': '23.2 Maquette',
  'q23_2_photos': '23.2 Photos',
  'q23_2_rubriques': '23.2 Rubriques',
  'q23_2_suggestions': '23.2 Suggestions',
  'q23_3': '23.3 Choix sujets',
  'q23_3_autres': '23.3 Autres sujets',
  'q23_4': '23.4 Grand angle',
  'q23_4_sujets': '23.4 Sujets futurs',
  'q24': '24. Écrire article',
  'q24_contact': '24. Contact article',
  'q25': '25. Suggestions LIEN/LINK',
  'q26': '26. Lecture mails info',
  'q26_1': '26.1 Satisfait mails',
  'q26_2': '26.2 Améliorations mails',
  'q27': '27. Informé sorties',
  'q27_1': '27.1 Participe sorties',
  'q27_2': '27.2 Satisfait sorties',
  'q27_2_suggestions': '27.2 Suggestions sorties',
  'q27_3': '27.3 Raison non-participation',
  'q27_3_autres': '27.3 Autres raisons',
  'q28': '28. Informé excursions',
  'q28_1': '28.1 Participe excursions',
  'q28_2': '28.2 Satisfait excursions',
  'q28_2_suggestions': '28.2 Suggestions excursions',
  'q28_3': '28.3 Participer futur',
  'q28_4': '28.4 Raison non-participation',
  'q28_4_suggestions': '28.4 Suggestions',
  'q29': '29. Importance voyages',
  'q29_1': '29.1 Développer voyages',
  'q29_2': '29.2 Intéressé participer',
  'q29_3': '29.3 Facteurs décision',
  'q29_3_autres': '29.3 Autres facteurs',
  'q29_4': '29.4 Courts séjours Europe',
  'q29_5': '29.5 Circuits hors Europe',
  'q29_6_dest1': '29.6 Destination 1',
  'q29_6_dest2': '29.6 Destination 2',
  'q29_6_dest3': '29.6 Destination 3',
  'q29_6_dest4': '29.6 Destination 4',
  'q29_6_dest5': '29.6 Destination 5',
  'q30': '30. Connaît groupe Histoire',
  'q30_1': '30.1 Consulte publications',
  'q30_2': '30.2 Intéressé participer',
  'q30_3': '30.3 Contact participation',
  'q31': '31. Recueil souvenirs',
  'q32': '32. Histoire syndicats',
  'q33': '33. Réfugiés politiques',
  'q34': '34. Autres sujets',
  'q35': '35. Orientation activités',
  'q36': '36. Ateliers UNESCO',
  'q37': '37. Bénévolat VNU/ONG',
  'nom': 'Nom',
  'prenom': 'Prénom',
  'adresse': 'Adresse',
  'dp_code_postal': 'Code postal',
  'ville': 'Ville',
  'email': 'Email',
  'telephone': 'Téléphone'
};

/**
 * Initialise les en-têtes si la feuille est vide
 */
function initHeaders(sheet) {
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell === '') {
    var headerRow = COLUMNS.map(function(col) {
      return HEADERS[col] || col;
    });
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    sheet.getRange(1, 1, 1, headerRow.length)
      .setFontWeight('bold')
      .setBackground('#1e3a5f')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

/**
 * Gère les requêtes POST (réceptions du formulaire)
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    initHeaders(sheet);

    var data = JSON.parse(e.postData.contents);

    // Construire la ligne de données dans l'ordre des colonnes
    var row = COLUMNS.map(function(col) {
      return data[col] || '';
    });

    // Ajouter la ligne
    sheet.appendRow(row);

    // Retourner une réponse de succès
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Réponse enregistrée' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gère les requêtes GET (test de disponibilité)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Le service de collecte AAFU est actif.',
      columns: COLUMNS.length
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
