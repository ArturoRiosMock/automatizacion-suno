const { getNewRows, markRowAsDone } = require('./utils/googleSheet');
const { saveLastProcessedRow, getLastProcessedRow } = require('./utils/lastRow');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const puppeteer = require('puppeteer');
const { openSunoWithProfile } = require('./sunoBot');

// Función para verificar si una fila está completa
function isRowComplete(row) {
  // Consideramos completa si las 4 primeras columnas tienen datos
  return row.length >= 4 && row[0] && row[1] && row[2] && row[3];
}

// Guardar fila en CSV
function appendRowToCSV(row, rowIndex) {
  const csvPath = path.join(__dirname, 'nuevas_filas.csv');
  const line = `${rowIndex},"${row[0]}","${row[1]}","${row[2]}","${row[3]}"\n`;
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, 'ROW_INDEX,ID,TITULO,TAGS,LETRA\n');
  }
  fs.appendFileSync(csvPath, line);
}

// Función para procesar una nueva fila
async function processNewRow(row, rowIndex) {
  try {
    console.log(`Procesando fila ${rowIndex}:`, row);
    const [id, titulo, prompt, letra, enviar] = row;
    console.log('ID:', id);
    console.log('Título:', titulo);
    console.log('Prompt:', prompt);
    console.log('Letra:', letra);
    appendRowToCSV(row, rowIndex);

    // Llama a Puppeteer para abrir Suno
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: 'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data',
    });
    const page = await browser.newPage();
    await openSunoWithProfile(page);
    await markRowAsDone(rowIndex);
    // Espera 1 segundo para asegurar que la hoja se actualice
    await new Promise(resolve => setTimeout(resolve, 1000));
    await browser.close();
    return true;
  } catch (error) {
    console.error('Error al procesar la fila:', error);
    return false;
  }
}

// Preguntar al usuario si quiere limpiar el cache
function askClearCache() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('¿Quieres limpiar el cache y empezar desde la línea 2? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// Función principal que monitorea la hoja
async function monitorSheet() {
  let lastProcessedIndex = getLastProcessedRow();
  console.log('Última fila procesada al iniciar:', lastProcessedIndex);
  while (true) {
    try {
      const { rows, lastRow } = await getNewRows();
      let processedAny = false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = lastRow + 1 + i; // Índice real en la hoja
        const enviar = (row[4] || '').toString().trim().toLowerCase();
        if (isRowComplete(row) && enviar === 'yes') {
          const success = await processNewRow(row, rowIndex);
          if (success) {
            processedAny = true;
          }
        } else {
          console.log(`Fila no marcada para enviar o incompleta en la posición ${rowIndex}, saltando...`, row);
        }
        // Siempre avanza el índice, procese o no
        lastProcessedIndex = rowIndex;
      }
      if (rows.length > 0) {
        saveLastProcessedRow(lastProcessedIndex);
        console.log('Guardado índice de última fila procesada:', lastProcessedIndex);
      } else {
        console.log('No hay filas nuevas completas y marcadas para enviar. Última fila procesada:', lastProcessedIndex, '\nEsperando...');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error en el monitoreo:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Preguntar y arrancar
(async () => {
  const clear = await askClearCache();
  if (clear) {
    saveLastProcessedRow(1); // Para que empiece desde la línea 2
    console.log('Cache limpiado. Empezando desde la línea 2.');
  }
  monitorSheet().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
})();
