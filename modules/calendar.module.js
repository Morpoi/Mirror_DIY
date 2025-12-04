// Trieda pre modul kalendára - zobrazuje dátum, kalendár a slovenské sviatky
class CalendarModule {
    constructor() {
        // Názov modulu zobrazený v hlavičke
        this.name = 'Calendar';
        // Aktuálna veľkosť modulu (small, medium, large)
        this.size = 'medium';
        // Pole slovenských štátnych sviatkov
        this.slovakHolidays = [];
        // Cache pre názvy dní a mesiacov
        this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Inicializácia zoznamu sviatkov
        this.initHolidays();
        // Precompute holiday dates
        this.precomputeHolidayDates();
    }

    // Metóda vráti názov modulu
    getName() {
        return this.name;
    }

    // Inicializácia modulu - volá sa pri pridaní modulu do aplikácie
    init(moduleId) {
        // Uloženie ID modulu
        this.moduleId = moduleId;
        // Prvé vykreslenie
        this.update();
        // Aktualizácia každú minútu aby sa dátum aktualizoval
        setInterval(() => {
            this.update();
        }, 60000);
    }

    // Inicializácia zoznamu slovenských štátnych sviatkov
    initHolidays() {
        // Zoznam slovenských štátnych sviatkov
        // month: mesiac (0-11, kde 0 = január), day: deň v mesiaci, name: názov sviatku
        this.slovakHolidays = [
            { month: 0, day: 1, name: 'Deň vzniku Slovenskej republiky' },    // 1. január
            { month: 0, day: 6, name: 'Zjavenie Pána' },                    // 6. január
            { month: 3, day: 1, name: 'Veľký piatok' },                      // 1. apríl (premenný dátum)
            { month: 3, day: 3, name: 'Veľkonočný pondelok' },               // 3. apríl (premenný dátum)
            { month: 4, day: 1, name: 'Sviatok práce' },                     // 1. máj
            { month: 4, day: 8, name: 'Deň víťazstva nad fašizmom' },       // 8. máj
            { month: 6, day: 5, name: 'Sviatok svätého Cyrila a Metoda' },   // 5. júl
            { month: 7, day: 29, name: 'Výročie SNP' },                     // 29. august
            { month: 8, day: 1, name: 'Deň Ústavy' },                       // 1. september
            { month: 8, day: 15, name: 'Sedembolestná Panna Mária' },       // 15. september
            { month: 10, day: 1, name: 'Sviatok Všetkých svätých' },        // 1. november
            { month: 10, day: 17, name: 'Deň boja za slobodu a demokraciu' }, // 17. november
            { month: 11, day: 24, name: 'Štedrý deň' },                     // 24. december
            { month: 11, day: 25, name: 'Prvý sviatok vianočný' },          // 25. december
            { month: 11, day: 26, name: 'Druhý sviatok vianočný' }          // 26. december
        ];
    }

    // Precompute holiday dates for efficiency
    precomputeHolidayDates() {
        this.holidayDates = [];
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year <= currentYear + 1; year++) {
            this.slovakHolidays.forEach(holiday => {
                this.holidayDates.push(new Date(year, holiday.month, holiday.day));
            });
        }
        this.holidayDates.sort((a, b) => a - b);
    }

    // Nastavenie veľkosti modulu
    setSize(size) {
        // Uloženie novej veľkosti
        this.size = size;
        // Aktualizácia zobrazenia
        this.update();
    }

    // Vykreslenie modulu do kontajnera
    render(container) {
        // Uloženie referencie na kontajner
        this.container = container;
        // Prvé vykreslenie
        this.update();
    }

    // Aktualizácia zobrazenia modulu
    update() {
        if (!this.container) return;

        // Získanie aktuálneho dátumu
        const now = new Date();
        // Kontrola či je dnes sviatok
        const todayHoliday = this.getHolidayForDate(now);
        // Získanie najbližších 3 sviatkov
        const upcomingHolidays = this.getUpcomingHolidays(now, 3);

        // Vykreslenie podľa veľkosti modulu
        if (this.size === 'small') {
            this.renderSmall(now, todayHoliday);
        } else if (this.size === 'medium') {
            this.renderMedium(now, todayHoliday, upcomingHolidays);
        } else if (this.size === 'large') {
            this.renderLarge(now);
        }
    }

    // Vykreslenie malého modulu - zobrazuje len aktuálny dátum a sviatok ak je
    renderSmall(now, todayHoliday) {
        // Získanie názvu dňa, mesiaca a čísla dňa
        const dayName = this.dayNames[now.getDay()];
        const month = this.monthNames[now.getMonth()];
        const day = now.getDate();

        let html = `
            <div class="calendar-small">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-name">${dayName}</div>
                <div class="calendar-month">${month}</div>
                ${todayHoliday ? `<div class="calendar-holiday">${todayHoliday.name}</div>` : ''}
            </div>
        `;

        this.container.innerHTML = html;
    }

    // Vykreslenie stredného modulu - zobrazuje aktuálny dátum a ďalších 7 dní
    renderMedium(now, todayHoliday, upcomingHolidays) {
        // Získanie názvu dňa, mesiaca a čísla dňa
        const dayName = this.dayNames[now.getDay()];
        const month = this.monthNames[now.getMonth()];
        const day = now.getDate();

        // Získanie ďalších 7 dní
        const nextDays = [];
        for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(now);
            nextDate.setDate(now.getDate() + i);
            // Kontrola či je deň sviatok
            const holiday = this.getHolidayForDate(nextDate);
            nextDays.push({
                day: nextDate.getDate(),                    // Číslo dňa
                dayName: this.dayNames[nextDate.getDay()],       // Názov dňa
                month: this.monthNames[nextDate.getMonth()],     // Názov mesiaca
                isHoliday: !!holiday,                       // Je sviatok (true/false)
                holidayName: holiday ? holiday.name : null  // Názov sviatku ak je
            });
        }

        let html = `
            <div class="calendar-medium">
                <div class="calendar-current">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-name">${dayName}</div>
                    <div class="calendar-month">${month}</div>
                </div>
                <div class="calendar-next-days">
        `;

        // Pre každý z ďalších 7 dní vytvor HTML
        nextDays.forEach(dayInfo => {
            html += `
                <div class="calendar-next-day ${dayInfo.isHoliday ? 'holiday' : ''}">
                    <div class="next-day-number">${dayInfo.day}</div>
                    <div class="next-day-name">${dayInfo.dayName}</div>
                </div>
            `;
        });

        html += '</div></div>';
        this.container.innerHTML = html;
    }

    // Vykreslenie veľkého modulu - zobrazuje zoznam najbližších 4 sviatkov
    renderLarge(now) {
        // Získanie všetkých nadchádzajúcich sviatkov na ďalší rok
        const allUpcoming = this.getAllUpcomingEvents(now);
        
        let html = `
            <div class="calendar-large">
                <div class="calendar-events-header">Upcoming Events</div>
                <div class="calendar-events-list">
        `;

        // Ak nie sú žiadne sviatky, zobraz správu
        if (allUpcoming.length === 0) {
            html += '<div class="calendar-no-events">No upcoming events</div>';
        } else {
            // Pre každý sviatok vytvor HTML
            allUpcoming.forEach(event => {
                const date = event.date;
                const dayName = this.dayNames[date.getDay()];
                const month = this.monthNames[date.getMonth()];
                const day = date.getDate();
                // Kontrola či je dnes
                const isToday = date.toDateString() === now.toDateString();
                // Kontrola či je tento týždeň
                const isThisWeek = this.isThisWeek(date, now);
                
                // Výpočet počtu dní do sviatku
                const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
                let daysText = '';
                if (daysUntil === 0) {
                    daysText = 'Today';
                } else if (daysUntil === 1) {
                    daysText = 'Tomorrow';
                } else if (isThisWeek) {
                    daysText = dayName;
                } else {
                    daysText = `${daysUntil}d`;
                }

                html += `
                    <div class="calendar-event-item ${isToday ? 'today' : ''}">
                        <div class="event-date">
                            <div class="event-day-number">${day}</div>
                            <div class="event-month">${month}</div>
                        </div>
                        <div class="event-content">
                            <div class="event-name">${event.name}</div>
                            <div class="event-meta">
                                <span class="event-day-name">${dayName}</span>
                                <span class="event-separator">·</span>
                                <span class="event-days">${daysText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div></div>';
        this.container.innerHTML = html;
    }

    // Metóda vráti všetky nadchádzajúce udalosti (sviatky) od daného dátumu
    getAllUpcomingEvents(fromDate) {
        const today = new Date(fromDate);
        today.setHours(0, 0, 0, 0);

        // Filter precomputed holiday dates
        const events = this.holidayDates
            .filter(holidayDate => {
                const hd = new Date(holidayDate);
                hd.setHours(0, 0, 0, 0);
                return hd > today;
            })
            .slice(0, 4)
            .map(holidayDate => {
                // Find the holiday name
                const holiday = this.slovakHolidays.find(h =>
                    h.month === holidayDate.getMonth() && h.day === holidayDate.getDate()
                );
                return {
                    date: new Date(holidayDate),
                    name: holiday ? holiday.name : 'Holiday',
                    type: 'holiday'
                };
            });

        return events;
    }

    // Metóda kontroluje či je dátum v tomto týždni
    isThisWeek(date, now) {
        // Výpočet začiatku týždňa (nedele)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        // Výpočet konca týždňa
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        // Kontrola či dátum je v tomto týždni
        return date >= weekStart && date < weekEnd;
    }

    // Metóda vráti sviatok pre daný dátum
    getHolidayForDate(date) {
        return this.slovakHolidays.find(h => 
            h.month === date.getMonth() && h.day === date.getDate()
        );
    }

    // Metóda vráti najbližšie sviatky od daného dátumu
    getUpcomingHolidays(fromDate, count) {
        // Filter precomputed holiday dates
        const upcoming = this.holidayDates
            .filter(holidayDate => holidayDate >= fromDate)
            .slice(0, count)
            .map(holidayDate => {
                const holiday = this.slovakHolidays.find(h =>
                    h.month === holidayDate.getMonth() && h.day === holidayDate.getDate()
                );
                return holiday ? {
                    month: holiday.month,
                    day: holiday.day,
                    name: holiday.name
                } : null;
            })
            .filter(h => h !== null);

        return upcoming;
    }

    // Zničenie modulu - cleanup ak je potrebný
    destroy() {
        // Cleanup ak je potrebný
    }
}
