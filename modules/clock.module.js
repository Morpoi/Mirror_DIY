// Trieda pre modul hodín - zobrazuje aktuálny čas v rôznych formátoch podľa veľkosti
class ClockModule {
    constructor() {
        // Názov modulu zobrazený v hlavičke
        this.name = 'Clock';
        // Aktuálna veľkosť modulu (small, medium, large)
        this.size = 'medium';
        // Cache pre názvy dní a mesiacov
        this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Interval pre aktualizáciu času (každú sekundu)
        this.updateInterval = null;
        // Interval pre animáciu analógových hodín (pre large veľkosť)
        this.analogInterval = null;
    }

    // Metóda vráti názov modulu
    getName() {
        return this.name;
    }

    // Inicializácia modulu - volá sa pri pridaní modulu do aplikácie
    init(moduleId) {
        // Uloženie ID modulu
        this.moduleId = moduleId;
        // Prvé vykreslenie času
        this.update();
        // Spustenie periodických aktualizácií
        this.startUpdates();
    }

    // Spustenie periodických aktualizácií času
    startUpdates() {
        this.adjustUpdateInterval();
    }

    // Nastavenie intervalu podľa veľkosti (small: 60s, ostatné: 1s)
    adjustUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        const interval = this.size === 'small' ? 60000 : 1000;
        this.updateInterval = setInterval(() => {
            this.update();
        }, interval);
    }

    // Nastavenie veľkosti modulu
    setSize(size) {
        // Uloženie novej veľkosti
        this.size = size;
        // Okamžitá aktualizácia zobrazenia
        this.update();
        // Nastavenie intervalu podľa veľkosti
        this.adjustUpdateInterval();

        // Pre large veľkosť spustíme analógové hodiny
        if (size === 'large') {
            this.startAnalogClock();
        } else {
            // Pre ostatné veľkosti zastavíme analógové hodiny
            this.stopAnalogClock();
        }
    }

    // Vykreslenie modulu do kontajnera
    render(container) {
        // Uloženie referencie na kontajner
        this.container = container;
        // Prvé vykreslenie
        this.update();
    }

    // Aktualizácia zobrazenia času
    update() {
        if (!this.container) return;

        // Získanie aktuálneho času
        const now = new Date();
        // Formátovanie hodín, minút a sekúnd s nulou na začiatku ak je potrebné
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Vykreslenie podľa veľkosti modulu
        if (this.size === 'small') {
            // Malá veľkosť - len hodiny a minúty
            this.container.innerHTML = `
                <div class="clock-display">${hours}:${minutes}</div>
            `;
        } else if (this.size === 'medium') {
            // Stredná veľkosť - hodiny, minúty, sekundy a dátum
            const dayName = this.dayNames[now.getDay()];
            const month = this.monthNames[now.getMonth()];
            const day = now.getDate();
            
            this.container.innerHTML = `
                <div class="clock-display">
                    ${hours}<span class="clock-colon">:</span>${minutes}<span class="clock-colon">:</span>${seconds}
                </div>
                <div class="clock-date">
                    <span class="clock-separator">—</span> ${dayName} ${month} ${day} <span class="clock-separator">—</span>
                </div>
            `;
        } else if (this.size === 'large') {
            // Veľká veľkosť - analógové hodiny
            this.renderAnalogClock(now);
        }
    }

    // Vykreslenie analógových hodín (pre large veľkosť)
    renderAnalogClock(now) {
        // Získanie hodín (0-11 pre 12-hodinový formát)
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Výpočet uhlov pre ručičky
        // Hodinová ručička - 30 stupňov za hodinu + 0.5 stupňa za minútu
        const hourAngle = (hours * 30) + (minutes * 0.5);
        // Minútová ručička - 6 stupňov za minútu
        const minuteAngle = minutes * 6;
        // Sekundová ručička - 6 stupňov za sekundu
        const secondAngle = seconds * 6;

        // Vytvorenie HTML pre analógové hodiny s ručičkami
        this.container.innerHTML = `
            <div class="analog-clock">
                <div class="clock-hand hour-hand" style="transform: rotate(${hourAngle}deg);"></div>
                <div class="clock-hand minute-hand" style="transform: rotate(${minuteAngle}deg);"></div>
                <div class="clock-hand second-hand" style="transform: rotate(${secondAngle}deg);"></div>
                <div class="clock-center"></div>
            </div>
        `;
    }

    // Spustenie animácie analógových hodín
    startAnalogClock() {
        // Ak už beží interval, nezačínaj nový
        if (this.analogInterval) return;
        
        // Plynulá animácia analógových hodín
        this.analogInterval = setInterval(() => {
            // Aktualizácia len ak sme v large veľkosti a kontajner existuje
            if (this.size === 'large' && this.container) {
                const now = new Date();
                this.renderAnalogClock(now);
            }
        }, 100); // Aktualizácia každých 100ms pre plynulú animáciu
    }

    // Zastavenie animácie analógových hodín
    stopAnalogClock() {
        if (this.analogInterval) {
            // Vymazanie intervalu
            clearInterval(this.analogInterval);
            this.analogInterval = null;
        }
    }

    // Zničenie modulu - cleanup intervalov
    destroy() {
        // Zastavenie aktualizácie času
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        // Zastavenie analógových hodín
        this.stopAnalogClock();
    }
}
