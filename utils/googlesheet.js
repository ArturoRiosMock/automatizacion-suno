const fs = require('fs');
const { google } = require('googleapis');
const { getLastProcessedRow } = require('./lastRow');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT,
    scopes: SCOPES,
  });
  return await auth.getClient();
}

async function getNewRows() {
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    const lastRow = getLastProcessedRow(); // Ej: 2 = A2
    const sheetName = process.env.SHEET_NAME || 'ROLAS'; // Nombre de la hoja desde .env o 'ROLAS' por defecto
    const range = `${sheetName}!A${lastRow + 1}:E`; // Lee desde la siguiente fila

    console.log('Intentando acceder a:', range);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range,
    });

    const rows = res.data.values || [];
    return { rows, lastRow };
  } catch (error) {
    console.error('Error al obtener filas:', error.message);
    throw error;
  }
}

async function markRowAsDone(rowIndex) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = process.env.SHEET_NAME || 'ROLAS';
  const cell = `${sheetName}!E${rowIndex}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: cell,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['done']],
    },
  });
  console.log(`Marcada fila ${rowIndex} como 'done' en columna E.`);
}

module.exports = { getNewRows, markRowAsDone };
