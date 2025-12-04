# Mirror DIY

Toto je klon aplikácie MagicMirror², vytvorený pomocou Electron frameworku. Aplikácia poskytuje modulárny informačný dashboard s rôznymi modulmi ako hodiny, kalendár, RSS novinky a počasie. Je navrhnutá pre použitie na dotykových obrazovkách alebo ako informačná obrazovka.

## Funkcie

- **Modulárny dizajn**: Pridávajte, odstraňujte a presúvajte moduly podľa potreby
- **Edit mód**: Interaktívne upravovanie rozloženia modulov
- **Rôzne veľkosti modulov**: Každý modul má tri veľkosti (malá, stredná, veľká)
- **Automatické ukladanie**: Rozloženie sa automaticky ukladá do localStorage
- **Fullscreen režim**: Aplikácia beží v režime celej obrazovky bez rámov
- **Responsive dizajn**: Prispôsobený pre rôzne veľkosti obrazoviek

## Inštalácia

### Predpoklady

- Node.js (verzia 14 alebo vyššia)
- npm alebo yarn

### Kroky inštalácie

1. **Klonujte repozitár:**
   ```bash
   git clone <repository-url>
   cd Mirror_DIY
   ```

2. **Inštalujte závislosti:**
   ```bash
   npm install
   ```

3. **Spustite aplikáciu:**
   ```bash
   npm start
   ```

Pre vývojový režim s otvorenými DevTools:
```bash
npm run dev
```

## Použitie

### Spustenie aplikácie

Po spustení sa aplikácia otvorí v režime celej obrazovky. Predvolene sú načítané základné moduly:
- Hodiny (v strede)
- Počasie (vpravo hore)
- Kalendár (vľavo dole)
- RSS novinky (vľavo hore)

### Edit mód

1. **Zapnutie edit módu**: Kliknite na tlačidlo "Edit Mode" v hornej lište
2. **Presúvanie modulov**: Ťahaním modulu ho presuňte na novú pozíciu v mriežke
3. **Zmena veľkosti**: Použite tlačidlá S/M/L v hlavičke modulu
4. **Odstránenie modulu**: Kliknite na tlačidlo X v hlavičke modulu
5. **Pridanie modulu**: Kliknite na plávajúce tlačidlo "+" a vyberte modul z inventára
6. **Uloženie zmien**: Kliknite na "Exit Edit Mode" pre uloženie rozloženia

### Dostupné moduly

#### Hodiny (Clock)
- **Malá veľkosť**: Zobrazuje len hodiny a minúty
- **Stredná veľkosť**: Hodiny, minúty, sekundy a aktuálny dátum
- **Veľká veľkosť**: Analógové hodiny s ručičkami

#### Kalendár (Calendar)
- **Malá veľkosť**: Aktuálny dátum a sviatok (ak je)
- **Stredná veľkosť**: Aktuálny dátum a ďalších 7 dní
- **Veľká veľkosť**: Zoznam najbližších 4 slovenských štátnych sviatkov

Slovenské sviatky zahŕňajú:
- Deň vzniku Slovenskej republiky (1. január)
- Veľká noc (premenné dátumy)
- Sviatok práce (1. máj)
- Deň víťazstva nad fašizmom (8. máj)
- Sviatok svätého Cyrila a Metoda (5. júl)
- Výročie SNP (29. august)
- Deň Ústavy (1. september)
- Sedembolestná Panna Mária (15. september)
- Sviatok Všetkých svätých (1. november)
- Deň boja za slobodu a demokraciu (17. november)
- Štedrý deň (24. december)
- Vianoce (25.-26. december)

#### RSS Novinky (RSS Feed)
Načítava články z RSS feedu aktuality.sk s automatickou rotáciou.
- **Malá veľkosť**: Iba titulok článku
- **Stredná veľkosť**: Titulok a popis článku
- **Veľká veľkosť**: Obrázok, titulok a popis článku

Články sa automaticky rotujú každých 20 sekúnd s vizuálnym progress barom.

#### Počasie (Weather)
Zobrazuje počasie pre Žilinu pomocou Open-Meteo API.
- **Malá veľkosť**: Ikona počasia, aktuálna teplota a rozsah teplôt
- **Stredná veľkosť**: Podrobné informácie o aktuálnom počasí vrátane východu/západu slnka, vetra, vlhkosti, oblačnosti a tlaku
- **Veľká veľkosť**: 8-dňová predpoveď s ikonami počasia a teplotami

## Závislosti

### Hlavné závislosti
- **Electron**: Framework pre vytvorenie desktopovej aplikácie
- **Axios**: HTTP klient pre API volania (používaný v moduloch)

### Externé API
- **Open-Meteo API**: Bezplatné API pre dáta o počasí
- **RSS Feed**: aktuality.sk RSS feed pre novinky

## Vývoj

### Štruktúra projektu
```
Mirror_DIY/
├── main.js                 # Hlavný proces Electron
├── renderer.js             # Renderer proces a kontrolér aplikácie
├── index.html              # HTML šablóna
├── styles.css              # Štýly aplikácie
├── package.json            # Konfigurácia projektu
└── modules/                # Moduly aplikácie
    ├── clock.module.js     # Modul hodín
    ├── calendar.module.js  # Modul kalendára
    ├── rss.module.js       # Modul RSS noviniek
    └── weather.module.js   # Modul počasia
```

### Pridanie nového modulu

1. Vytvorte nový súbor v priečinku `modules/`
2. Implementujte triedu modulu s metódami:
   - `getName()`: Vráti názov modulu
   - `init(moduleId)`: Inicializácia modulu
   - `render(container)`: Vykreslenie modulu
   - `setSize(size)`: Nastavenie veľkosti
   - `destroy()`: Čistenie pri odstránení
3. Pridajte modul do `availableModules` v `renderer.js`
4. Implementujte CSS štýly pre modul

### Štýly a téma

Aplikácia používa tmavú tému optimalizovanú pre informačné obrazovky. Hlavné farby:
- Pozadie: čierna (#000000)
- Text: biela s rôznymi úrovňami priehľadnosti
- Akcenty: modrá pre interaktívne prvky

## Licencia

Tento projekt je licencovaný pod MIT licenciou.

## Technické detaily

- **Platforma**: Electron (Node.js + Chromium)
- **Jazyk**: JavaScript (ES6+)
- **Štýly**: CSS s modernými vlastnosťami
- **Úložisko**: localStorage pre nastavenia
- **Aktualizácie**: Automatické obnovovanie dát v moduloch
- **Bezpečnosť**: Context isolation a nodeIntegration vypnuté

## Riešenie problémov

### Aplikácia sa nespúšťa
- Skontrolujte či máte nainštalovaný Node.js
- Spustite `npm install` pre inštaláciu závislostí
- Skontrolujte konzolu pre chybové hlášky

### Moduly sa nenačítajú
- Skontrolujte internetové pripojenie pre RSS a počasie
- Overte či sú API endpointy dostupné
- Pozrite sa do konzoly prehliadača na chyby

### Problémy s edit módou
- Uistite sa, že ste v edit móde (kliknite na "Edit Mode")
- Skúste obnoviť stránku a znovu načítať rozloženie

## Prispievanie

Príspevky sú vítané! Prosím, vytvorte issue alebo pull request s vašimi zmenami.
