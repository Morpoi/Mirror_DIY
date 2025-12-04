// Hlavný kontrolér aplikácie - spravuje všetky moduly a ich interakcie
class AppController {
    constructor() {
        // Premenná indikujúca či je aplikácia v editačnom režime (true = možno upravovať moduly)
        this.editMode = false;
        // Map (slovník) pre uchovanie všetkých inštancií modulov - kľúč je ID modulu, hodnota je objekt s dátami modulu
        this.modules = new Map();
        // ID modulu ktorý je momentálne ťahaný (drag and drop)
        this.draggedModule = null;
        // Timeout pre skrytie kurzora pri neaktivite
        this.cursorTimeout = null;
        // Zoznam dostupných modulov ktoré možno pridať do aplikácie
        this.availableModules = [
            // Modul hodín - zobrazuje aktuálny čas
            { id: 'clock', name: 'Clock', factory: () => new ClockModule() },
            // Modul kalendára - zobrazuje dátum a sviatky
            { id: 'calendar', name: 'Calendar', factory: () => new CalendarModule() },
            // Modul RSS noviniek - zobrazuje články z RSS feedu
            { id: 'rss', name: 'RSS Feed', factory: () => new RSSModule() },
            // Modul počasia - zobrazuje aktuálne počasie a predpoveď
            { id: 'weather', name: 'Weather', factory: () => new WeatherModule() }
        ];
        // Inicializácia aplikácie
        this.init();
    }

    // Inicializačná funkcia - nastaví event listenery, načíta uložené rozloženie a naplní inventár
    init() {
        // Cache frequently used DOM elements
        this.editModeToggle = document.getElementById('editModeToggle');
        this.floatingAddButton = document.getElementById('floatingAddButton');
        this.inventoryModal = document.getElementById('inventoryModal');
        this.inventoryClose = document.getElementById('inventoryClose');
        this.inventoryList = document.getElementById('inventoryList');
        this.modulesGrid = document.getElementById('modulesGrid');
        this.gridCells = document.querySelectorAll('.grid-cell');
        this.container = document.querySelector('.app-container');

        // Nastavenie event listenerov pre tlačidlá a interakcie
        this.setupEventListeners();
        // Načítanie uloženého rozloženia modulov z localStorage
        this.loadLayout();
        // Naplnenie inventára dostupnými modulmi
        this.populateInventory();

        // Inicializácia predvolených modulov ak neexistujú žiadne uložené
        if (this.modules.size === 0) {
            // Pridanie hodín do stredu
            this.addModule('clock', 'middle_center');
            // Pridanie počasia do pravého horného rohu
            this.addModule('weather', 'top_right');
            // Pridanie kalendára do ľavého dolného rohu
            this.addModule('calendar', 'bottom_left');
            // Pridanie RSS noviniek do ľavého horného rohu
            this.addModule('rss', 'top_left');
        }
    }

    // Nastavenie event listenerov pre všetky interaktívne prvky
    setupEventListeners() {
        // Event listener pre tlačidlo prepnutia editačného režimu
        this.editModeToggle.addEventListener('click', () => {
            this.toggleEditMode();
        });

        // Event listener pre plávajúce tlačidlo na pridanie modulu
        this.floatingAddButton.addEventListener('click', () => {
            this.openInventory();
        });

        // Event listener pre tlačidlo zatvorenia inventára modulov
        this.inventoryClose.addEventListener('click', () => {
            this.closeInventory();
        });

        // Event listener pre kliknutie mimo modálneho okna (zatvorí ho)
        this.inventoryModal.addEventListener('click', (e) => {
            // Ak sa kliklo priamo na modálne okno (nie na jeho obsah), zatvor ho
            if (e.target.id === 'inventoryModal') {
                this.closeInventory();
            }
        });

        // Nastavenie drag and drop funkcionality
        this.setupDragAndDrop();
        // Nastavenie skrytia kurzora pri neaktivite
        this.setupCursorHiding();
    }

    // Nastavenie drag and drop funkcionality pre presúvanie modulov
    setupDragAndDrop() {
        // Nájdenie všetkých buniek gridu
        const gridCells = this.gridCells;

        // Pre každú bunku nastavíme event listenery
        gridCells.forEach(cell => {
            // Event listener pre ťahanie nad bunkou (dragover)
            cell.addEventListener('dragover', (e) => {
                // Zabránenie predvolenému správaniu (aby sa modul mohol "pustiť")
                e.preventDefault();
                // Ak sme v editačnom režime, pridáme vizuálnu indikáciu
                if (this.editMode) {
                    cell.classList.add('drag-over');
                }
            });

            // Event listener pre opustenie bunky pri ťahaní (dragleave)
            cell.addEventListener('dragleave', () => {
                // Odstránenie vizuálnej indikácie
                cell.classList.remove('drag-over');
            });

            // Event listener pre pustenie modulu do bunky (drop)
            cell.addEventListener('drop', (e) => {
                // Zabránenie predvolenému správaniu
                e.preventDefault();
                // Odstránenie vizuálnej indikácie
                cell.classList.remove('drag-over');
                
                // Ak je modul ťahaný a sme v editačnom režime, presuň ho
                if (this.draggedModule && this.editMode) {
                    const position = cell.dataset.position;
                    this.moveModule(this.draggedModule, position);
                }
            });
        });
    }

    // Nastavenie skrytia kurzora pri neaktivite
    setupCursorHiding() {
        const resetCursor = () => {
            document.body.classList.remove('hide-cursor');
            clearTimeout(this.cursorTimeout);
            this.cursorTimeout = setTimeout(() => {
                document.body.classList.add('hide-cursor');
            }, 5000);
        };

        // Počiatočné nastavenie timeoutu na skrytie kurzora
        this.cursorTimeout = setTimeout(() => {
            document.body.classList.add('hide-cursor');
        }, 5000);

        // Event listenery pre reset kurzora pri aktivite
        document.addEventListener('mousemove', resetCursor);
        document.addEventListener('mousedown', resetCursor);
        document.addEventListener('mouseup', resetCursor);
        document.addEventListener('wheel', resetCursor);
    }

    // Prepnutie editačného režimu (zapnutie/vypnutie)
    toggleEditMode() {
        // Prepnutie boolean hodnoty editMode
        this.editMode = !this.editMode;
        const container = this.container;
        const toggleBtn = this.editModeToggle;

        if (this.editMode) {
            // Pridanie CSS triedy pre editačný režim (zobrazí grid a ovládacie prvky)
            container.classList.add('edit-mode');
            // Pridanie aktívneho stavu tlačidla
            toggleBtn.classList.add('active');
            // Zmena textu tlačidla
            toggleBtn.textContent = 'Exit Edit Mode';
        } else {
            // Odstránenie CSS triedy pre editačný režim
            container.classList.remove('edit-mode');
            // Odstránenie aktívneho stavu tlačidla
            toggleBtn.classList.remove('active');
            // Zmena textu tlačidla späť
            toggleBtn.textContent = 'Edit Mode';
            // Uloženie rozloženia modulov
            this.saveLayout();
        }
    }

    // Naplnenie inventára modulov dostupnými modulmi
    populateInventory() {
        const inventoryList = this.inventoryList;
        // Vyčistenie zoznamu
        inventoryList.innerHTML = '';
        
        // Pre každý dostupný modul vytvoríme položku v inventári
        this.availableModules.forEach(module => {
            // Vytvorenie DOM elementu pre položku
            const item = document.createElement('div');
            item.className = 'inventory-item';
            // Nastavenie názvu modulu
            item.innerHTML = `<div class="inventory-item-name">${module.name}</div>`;
            // Event listener pre kliknutie - pridá modul do aplikácie
            item.addEventListener('click', () => {
                this.addModuleFromInventory(module.id);
            });
            // Pridanie položky do inventára
            inventoryList.appendChild(item);
        });
    }

    // Otvorenie modálneho okna s inventárom modulov
    openInventory() {
        this.inventoryModal.classList.add('active');
    }

    // Zatvorenie modálneho okna s inventárom modulov
    closeInventory() {
        this.inventoryModal.classList.remove('active');
    }

    // Pridanie modulu z inventára do aplikácie
    addModuleFromInventory(moduleId) {
        // Nájdenie prvej prázdnej bunky
        const cells = this.gridCells;
        for (let cell of cells) {
            // Ak bunka nemá žiadne deti alebo nemá modul, použij ju
            if (!cell.hasChildNodes() || cell.querySelector('.module-wrapper') === null) {
                const position = cell.dataset.position;
                this.addModule(moduleId, position);
                this.closeInventory();
                return;
            }
        }
        // Ak nie je žiadna prázdna bunka, použij prvú bunku
        if (cells.length > 0) {
            this.addModule(moduleId, cells[0].dataset.position);
            this.closeInventory();
        }
    }

    // Pridanie modulu do aplikácie na určitú pozíciu
    addModule(moduleId, position) {
        // Nájdenie definície modulu podľa ID
        const moduleDef = this.availableModules.find(m => m.id === moduleId);
        if (!moduleDef) return;

        // Vytvorenie inštancie modulu pomocou factory funkcie
        const moduleInstance = moduleDef.factory();
        // Vytvorenie unikátneho ID modulu (použije časovú pečiatku)
        const moduleIdUnique = `${moduleId}_${Date.now()}`;
        
        // Nájdenie bunky kam modul pridáme
        const cell = document.getElementById(`cell_${position}`);
        if (!cell) return;

        // Odstránenie existujúceho modulu z bunky ak tam už je
        const existingModule = cell.querySelector('.module-wrapper');
        if (existingModule) {
            const existingId = existingModule.dataset.moduleId;
            this.removeModule(existingId, false);
        }

        // Vytvorenie wrapper elementu pre modul
        const wrapper = this.createModuleWrapper(moduleInstance, moduleIdUnique, moduleId);
        // Pridanie wrapperu do bunky
        cell.appendChild(wrapper);
        
        // Uloženie dát modulu do Map
        this.modules.set(moduleIdUnique, {
            instance: moduleInstance,  // Inštancia modulu
            position: position,       // Pozícia v gridu
            moduleType: moduleId,      // Typ modulu (clock, calendar, atď.)
            size: 'medium'            // Veľkosť modulu (small, medium, large)
        });

        // Inicializácia modulu
        moduleInstance.init(moduleIdUnique);
        // Nastavenie veľkosti modulu na medium
        moduleInstance.setSize('medium');
        // Uloženie rozloženia
        this.saveLayout();
        
        // Animácia fade-in pre nový modul
        setTimeout(() => {
            wrapper.classList.add('fade-in');
        }, 10);
    }

    // Vytvorenie wrapper elementu pre modul (obsahuje hlavičku s ovládacími prvkami a obsah)
    createModuleWrapper(moduleInstance, moduleId, moduleType) {
        // Vytvorenie div elementu pre wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'module-wrapper';
        // Nastavenie data atribútu s ID modulu
        wrapper.dataset.moduleId = moduleId;
        // Povolenie drag and drop
        wrapper.draggable = true;
        // Pridanie CSS tried podľa typu modulu a veľkosti
        wrapper.classList.add(`${moduleType}-module`, 'medium');

        // Vytvorenie HTML pre hlavičku modulu s ovládacími prvkami
        wrapper.innerHTML = `
            <div class="module-header">
                <div class="module-title">${moduleInstance.getName()}</div>
                <div class="module-header-controls">
                    <div class="module-size-toggle">
                        <button class="size-btn" data-size="small">S</button>
                        <button class="size-btn active" data-size="medium">M</button>
                        <button class="size-btn" data-size="large">L</button>
                    </div>
                    <button class="module-delete">✕</button>
                </div>
            </div>
            <div class="module-content"></div>
        `;

        // Nájdenie kontajnera pre obsah modulu
        const content = wrapper.querySelector('.module-content');
        // Vykreslenie obsahu modulu
        moduleInstance.render(content);

        // Event listener pre začiatok ťahania modulu
        wrapper.addEventListener('dragstart', (e) => {
            if (this.editMode) {
                // Uloženie ID modulu ktorý sa ťahá
                this.draggedModule = moduleId;
                // Zníženie opacity pre vizuálnu indikáciu
                wrapper.style.opacity = '0.5';
            } else {
                // Ak nie sme v editačnom režime, zabráň ťahaniu
                e.preventDefault();
            }
        });

        // Event listener pre koniec ťahania modulu
        wrapper.addEventListener('dragend', () => {
            // Obnovenie opacity
            wrapper.style.opacity = '1';
            // Vymazanie ID ťahaného modulu
            this.draggedModule = null;
        });

        // Event listenery pre tlačidlá zmeny veľkosti
        const sizeButtons = wrapper.querySelectorAll('.size-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Zabránenie propagácie eventu (aby sa neaktivovali iné eventy)
                e.stopPropagation();
                const size = btn.dataset.size;
                this.setModuleSize(moduleId, size);
            });
        });

        // Event listener pre tlačidlo vymazania modulu
        wrapper.querySelector('.module-delete').addEventListener('click', (e) => {
            // Zabránenie propagácie eventu
            e.stopPropagation();
            // Odstránenie modulu s animáciou
            this.removeModule(moduleId, true);
        });

        return wrapper;
    }

    // Nastavenie veľkosti modulu
    setModuleSize(moduleId, size) {
        // Nájdenie dát modulu
        const moduleData = this.modules.get(moduleId);
        if (!moduleData) return;

        // Nájdenie wrapper elementu modulu
        const wrapper = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (!wrapper) return;

        // Odstránenie všetkých tried veľkosti
        wrapper.classList.remove('small', 'medium', 'large');
        // Pridanie novej triedy veľkosti
        wrapper.classList.add(size);

        // Aktualizácia tlačidiel veľkosti
        wrapper.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
            // Aktivácia tlačidla zodpovedajúceho novej veľkosti
            if (btn.dataset.size === size) {
                btn.classList.add('active');
            }
        });

        // Aktualizácia veľkosti v dátach modulu
        moduleData.size = size;
        // Nastavenie veľkosti v inštancii modulu
        moduleData.instance.setSize(size);
        // Uloženie rozloženia
        this.saveLayout();
    }

    // Presunutie modulu na novú pozíciu
    moveModule(moduleId, newPosition) {
        // Nájdenie dát modulu
        const moduleData = this.modules.get(moduleId);
        if (!moduleData) return;

        // Nájdenie wrapper elementu modulu
        const wrapper = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (!wrapper) return;

        // Nájdenie starej a novej bunky
        const oldCell = document.getElementById(`cell_${moduleData.position}`);
        const newCell = document.getElementById(`cell_${newPosition}`);

        if (oldCell && newCell) {
            // Kontrola či nová bunka už obsahuje modul
            const existingModule = newCell.querySelector('.module-wrapper');
            if (existingModule && existingModule.dataset.moduleId !== moduleId) {
                // Ak áno, vymeň moduly miestami (swap)
                const existingId = existingModule.dataset.moduleId;
                const existingModuleData = this.modules.get(existingId);
                
                if (existingModuleData) {
                    // Výmenná pozícií modulov
                    oldCell.appendChild(existingModule);
                    newCell.appendChild(wrapper);
                    
                    // Aktualizácia pozícií v dátach modulov
                    const tempPosition = moduleData.position;
                    moduleData.position = newPosition;
                    existingModuleData.position = tempPosition;
                } else {
                    // Ak sa nenašli dáta existujúceho modulu, len presuň aktuálny modul
                    newCell.appendChild(wrapper);
                    moduleData.position = newPosition;
                }
            } else {
                // Bunka je prázdna, len presuň modul
                newCell.appendChild(wrapper);
                moduleData.position = newPosition;
            }
            
            // Uloženie rozloženia
            this.saveLayout();
        }
    }

    // Odstránenie modulu z aplikácie
    removeModule(moduleId, animate = true) {
        // Nájdenie dát modulu
        const moduleData = this.modules.get(moduleId);
        if (!moduleData) return;

        // Nájdenie wrapper elementu modulu
        const wrapper = document.querySelector(`[data-module-id="${moduleId}"]`);
        if (wrapper) {
            if (animate) {
                // Pridanie fade-out animácie
                wrapper.classList.add('fade-out');
                // Odstránenie po 300ms (po skončení animácie)
                setTimeout(() => {
                    wrapper.remove();
                }, 300);
            } else {
                // Okamžité odstránenie bez animácie
                wrapper.remove();
            }
        }

        // Zavolanie destroy metódy modulu ak existuje (pre cleanup)
        if (moduleData.instance && typeof moduleData.instance.destroy === 'function') {
            moduleData.instance.destroy();
        }

        // Odstránenie modulu z Map
        this.modules.delete(moduleId);
        // Uloženie rozloženia
        this.saveLayout();
    }

    // Uloženie rozloženia modulov do localStorage
    saveLayout() {
        // Vytvorenie objektu s dátami rozloženia
        const layout = {
            // Pole modulov - každý modul obsahuje ID, typ, pozíciu a veľkosť
            modules: Array.from(this.modules.entries()).map(([id, data]) => ({
                id: id,                    // Unikátne ID modulu
                type: data.moduleType,      // Typ modulu (clock, calendar, atď.)
                position: data.position,    // Pozícia v gridu
                size: data.size            // Veľkosť modulu
            }))
        };
        // Uloženie do localStorage pod kľúčom 'mirrorLayout'
        localStorage.setItem('mirrorLayout', JSON.stringify(layout));
    }

    // Načítanie rozloženia modulov z localStorage
    loadLayout() {
        // Načítanie uložených dát
        const saved = localStorage.getItem('mirrorLayout');
        if (!saved) return;

        try {
            // Parsovanie JSON dát
            const layout = JSON.parse(saved);
            // Pre každý modul v uloženom rozložení
            layout.modules.forEach(moduleData => {
                // Nájdenie definície modulu podľa typu
                const moduleDef = this.availableModules.find(m => m.id === moduleData.type);
                if (moduleDef) {
                    // Vytvorenie inštancie modulu
                    const moduleInstance = moduleDef.factory();
                    // Nájdenie bunky kam modul patrí
                    const cell = document.getElementById(`cell_${moduleData.position}`);
                    if (cell) {
                        // Vytvorenie wrapper elementu
                        const wrapper = this.createModuleWrapper(
                            moduleInstance,
                            moduleData.id,
                            moduleData.type
                        );
                        // Pridanie do bunky
                        cell.appendChild(wrapper);
                        // Pridanie CSS triedy pre veľkosť
                        wrapper.classList.add(moduleData.size);
                        
                        // Aktualizácia tlačidiel veľkosti
                        wrapper.querySelectorAll('.size-btn').forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.size === moduleData.size) {
                                btn.classList.add('active');
                            }
                        });

                        // Uloženie dát modulu do Map
                        this.modules.set(moduleData.id, {
                            instance: moduleInstance,
                            position: moduleData.position,
                            moduleType: moduleData.type,
                            size: moduleData.size
                        });

                        // Inicializácia modulu
                        moduleInstance.init(moduleData.id);
                        // Nastavenie veľkosti modulu
                        moduleInstance.setSize(moduleData.size);
                    }
                }
            });
        } catch (e) {
            // V prípade chyby vypíš error do konzoly
            console.error('Failed to load layout:', e);
        }
    }
}

// Inicializácia aplikácie keď je DOM pripravený
document.addEventListener('DOMContentLoaded', () => {
    // Vytvorenie globálnej inštancie AppController
    window.appController = new AppController();
});
