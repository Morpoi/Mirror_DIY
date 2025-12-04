// Import Electron modulov - app pre správu aplikácie, BrowserWindow pre vytvorenie okna
const { app, BrowserWindow } = require('electron');

// Premenná pre uchovanie referencie na hlavné okno aplikácie
let mainWindow;

// Funkcia na vytvorenie hlavného okna aplikácie
function createWindow() {
  // Vytvorenie nového okna s nastavenými parametrami
  mainWindow = new BrowserWindow({
    // Šírka okna v pixeloch
    width: 1920,
    // Výška okna v pixeloch
    height: 1080,
    // Nastavenia webových preferencií
    webPreferences: {
      // Vypnutie Node.js integrácie pre lepšie zabezpečenie
      nodeIntegration: false,
      // Zapnutie context isolation pre izoláciu renderer kontextu
      contextIsolation: true
    },
    // Skrytie rámca okna (bez titulnej lišty)
    frame: false,
    // Spustenie v režime celá obrazovka
    fullscreen: true,
    // Farba pozadia okna (čierna)
    backgroundColor: '#000000'
  });

  // Načítanie HTML súboru do okna
  mainWindow.loadFile('index.html');
  
  // Otvorenie DevTools vo vývojovom režime (voliteľné, momentálne zakomentované)
  // mainWindow.webContents.openDevTools();
}

// Spustenie aplikácie keď je Electron pripravený
app.whenReady().then(createWindow);

// Event listener pre zatvorenie všetkých okien
app.on('window-all-closed', () => {
  // Na macOS sa aplikácia nezavrie keď sú všetky okná zatvorené (zostáva v docku)
  if (process.platform !== 'darwin') {
    // Ukončenie aplikácie na ostatných platformách
    app.quit();
  }
});

// Event listener pre aktiváciu aplikácie (napr. kliknutie na ikonu v docku na macOS)
app.on('activate', () => {
  // Ak nie sú žiadne otvorené okná, vytvor nové
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
