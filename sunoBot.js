const puppeteer = require('puppeteer');

async function openSunoWithProfile() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Ajusta si tu Chrome está en otra ruta
    userDataDir: 'C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data',
  });

  const page = await browser.newPage();
  await page.goto('https://suno.com', { waitUntil: 'networkidle2' });

  // Aquí puedes automatizar el llenado de formularios, clicks, etc.
  // Por ahora solo abre la web y espera 10 segundos
  await page.waitForTimeout(10000);

  // Si quieres que cierre el navegador después, descomenta:
  // await browser.close();
}

module.exports = { openSunoWithProfile };
