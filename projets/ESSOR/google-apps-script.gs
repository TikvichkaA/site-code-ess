/**
 * Google Apps Script — Inscriptions ESSOR
 * 2 onglets : Bénéficiaires / Bénévoles
 *
 * INSTALLATION :
 * 1. Créer un Google Sheet avec 2 onglets : "Bénéficiaires" et "Bénévoles"
 * 2. Aller dans Extensions > Apps Script
 * 3. Coller ce code dans l'éditeur
 * 4. Cliquer sur "Déployer" > "Nouveau déploiement"
 * 5. Choisir "Application Web"
 *    - Exécuter en tant que : "Moi"
 *    - Qui a accès : "Tout le monde"
 * 6. Copier l'URL générée et la coller dans config.json (champs endpoint)
 */

// Colonnes pour les bénéficiaires
var COLUMNS_BENEFICIAIRE = [
  'timestamp', 'type', 'prenom', 'nom', 'telephone',
  'email', 'nationalite', 'type_demande', 'creneau', 'message'
];

var HEADERS_BENEFICIAIRE = {
  'timestamp': 'Horodatage',
  'type': 'Type',
  'prenom': 'Prénom',
  'nom': 'Nom',
  'telephone': 'Téléphone',
  'email': 'Email',
  'nationalite': 'Nationalité',
  'type_demande': 'Type de demande',
  'creneau': 'Créneau souhaité',
  'message': 'Message'
};

// Colonnes pour les bénévoles
var COLUMNS_BENEVOLE = [
  'timestamp', 'type', 'prenom', 'nom', 'email',
  'telephone', 'statut', 'specialites', 'disponibilites', 'motivation'
];

var HEADERS_BENEVOLE = {
  'timestamp': 'Horodatage',
  'type': 'Type',
  'prenom': 'Prénom',
  'nom': 'Nom',
  'email': 'Email',
  'telephone': 'Téléphone',
  'statut': 'Statut professionnel',
  'specialites': 'Spécialités',
  'disponibilites': 'Disponibilités',
  'motivation': 'Motivation'
};

/**
 * Initialise les en-têtes si la feuille est vide
 */
function initHeaders(sheet, columns, headers) {
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell === '') {
    var headerRow = columns.map(function(col) {
      return headers[col] || col;
    });
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    sheet.getRange(1, 1, 1, headerRow.length)
      .setFontWeight('bold')
      .setBackground('#0f1b2d')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

/**
 * Gère les requêtes POST
 */
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'beneficiaire';

    var sheet, columns, headers;

    if (type === 'benevole') {
      sheet = spreadsheet.getSheetByName('Bénévoles');
      if (!sheet) sheet = spreadsheet.insertSheet('Bénévoles');
      columns = COLUMNS_BENEVOLE;
      headers = HEADERS_BENEVOLE;
    } else {
      sheet = spreadsheet.getSheetByName('Bénéficiaires');
      if (!sheet) sheet = spreadsheet.insertSheet('Bénéficiaires');
      columns = COLUMNS_BENEFICIAIRE;
      headers = HEADERS_BENEFICIAIRE;
    }

    initHeaders(sheet, columns, headers);

    var row = columns.map(function(col) {
      return data[col] || '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Inscription enregistrée' }))
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
      message: 'Le service d\'inscription ESSOR est actif.'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
