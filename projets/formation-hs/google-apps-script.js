/**
 * Google Apps Script — Suivi de progression Formation H&S
 *
 * Instructions :
 * 1. Créer un Google Sheet (les colonnes seront créées automatiquement)
 * 2. Ouvrir Extensions > Apps Script
 * 3. Coller ce code dans l'éditeur
 * 4. Déployer > Nouveau déploiement > Application Web
 *    - Exécuter en tant que : Moi
 *    - Accès : Tout le monde
 * 5. Copier l'URL du déploiement dans config.json (clé tracking.endpoint)
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Créer les en-têtes si la première ligne est vide
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Horodatage', 'Nom', 'Email', 'Module', 'Type',
        'Score', 'Total', 'Pourcentage', 'Réussi',
        'Tentative', 'Durée (min)', 'Étude de cas'
      ]);
    }

    var data = JSON.parse(e.postData.contents);

    var row = [
      new Date(),                               // Horodatage
      data.nom || '',                            // Nom
      data.email || '',                          // Email
      data.module || '',                         // Module
      data.type || '',                           // Type (quiz, module_start, case_study)
      data.score !== undefined ? data.score : '',        // Score
      data.total !== undefined ? data.total : '',        // Total
      data.percentage !== undefined ? data.percentage : '', // Pourcentage
      data.passed !== undefined ? (data.passed ? 'Oui' : 'Non') : '', // Réussi
      data.attempt !== undefined ? data.attempt : '',    // Tentative
      data.duration !== undefined ? data.duration : '',  // Durée (min)
      data.type === 'case_study' ? 'Oui' : ''           // Étude de cas
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Le endpoint de suivi est actif.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
