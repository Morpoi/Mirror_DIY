// Trieda pre modul RSS noviniek - zobrazuje články z RSS feedu s rotáciou
class RSSModule {
    constructor() {
        // Názov modulu zobrazený v hlavičke
        this.name = 'RSS Feed';
        // Aktuálna veľkosť modulu (small, medium, large)
        this.size = 'medium';
        // Pole článkov načítaných z RSS feedu
        this.articles = [];
        // Interval pre periodické obnovovanie RSS feedu
        this.updateInterval = null;
        // Interval pre rotáciu článkov (zobrazovanie ďalšieho článku)
        this.rotationInterval = null;
        // Interval pre animáciu progress baru
        this.progressInterval = null;
        // Index aktuálne zobrazeného článku
        this.currentIndex = 0;
        // URL adresa RSS feedu
        this.rssUrl = 'https://www.aktuality.sk/rss/';
        // Čas rotácie medzi článkami v milisekundách (20 sekúnd)
        this.rotationTime = 20000;
        // Reusable DOM element for stripHtml
        this.tempDiv = document.createElement('DIV');
    }

    // Metóda vráti názov modulu
    getName() {
        return this.name;
    }

    // Inicializácia modulu - volá sa pri pridaní modulu do aplikácie
    init(moduleId) {
        // Uloženie ID modulu
        this.moduleId = moduleId;
        // Načítanie RSS feedu
        this.fetchRSS();
        // Nastavenie periodického obnovovania každých 10 minút
        this.updateInterval = setInterval(() => {
            this.fetchRSS();
        }, 10 * 60 * 1000);
        // Spustenie rotácie článkov
        this.startRotation();
    }

    // Asynchrónne načítanie RSS feedu z URL
    async fetchRSS() {
        try {
            // Načítanie RSS feedu pomocou fetch API
            const response = await fetch(this.rssUrl);
            // Získanie textu z odpovede
            const xmlText = await response.text();
            
            // Parsovanie RSS XML dokumentu
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            // Nájdenie všetkých item elementov (článkov)
            const items = xmlDoc.querySelectorAll('item');
            
            // Vyčistenie poľa článkov
            this.articles = [];
            // Pre každý článok
            items.forEach((item, index) => {
                // Získanie len prvých 20 článkov pre rotáciu
                if (index < 20) {
                    // Extrahovanie titulku článku
                    const title = item.querySelector('title')?.textContent || '';
                    // Extrahovanie popisu článku
                    const description = item.querySelector('description')?.textContent || '';
                    // Extrahovanie odkazu na článok
                    const link = item.querySelector('link')?.textContent || '';
                    // Extrahovanie dátumu publikácie
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    
                    // Pokus o získanie obrázka z enclosure alebo media:thumbnail
                    let image = null;
                    const enclosure = item.querySelector('enclosure');
                    if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) {
                        image = enclosure.getAttribute('url');
                    } else {
                        const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
                        if (mediaThumbnail) {
                            image = mediaThumbnail.getAttribute('url');
                        }
                    }
                    
                    // Extrahovanie obrázka z HTML popisu ak je dostupný
                    if (!image && description) {
                        const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
                        if (imgMatch) {
                            image = imgMatch[1];
                        }
                    }
                    
                    // Pridanie článku do poľa
                    this.articles.push({
                        title: this.stripHtml(title),        // Titulok bez HTML
                        description: this.stripHtml(description), // Popis bez HTML
                        link: link,                          // Odkaz na článok
                        image: image,                         // URL obrázka
                        pubDate: pubDate                      // Dátum publikácie
                    });
                }
            });
            
            // Reset indexu na prvý článok pri načítaní nového feedu
            this.currentIndex = 0;
            // Aktualizácia zobrazenia
            this.update();
            // Reštart rotácie s novými článkami
            this.startRotation();
        } catch (error) {
            // V prípade chyby vypíš error a zobraz chybovú správu
            console.error('Error fetching RSS:', error);
            if (this.container) {
                this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Failed to load RSS feed</div>';
            }
        }
    }

    // Metóda vráti maximálny počet článkov podľa veľkosti modulu
    getMaxArticles() {
        switch(this.size) {
            case 'small': return 3;   // Malá veľkosť - 3 články
            case 'medium': return 5;  // Stredná veľkosť - 5 článkov
            case 'large': return 8;   // Veľká veľkosť - 8 článkov
            default: return 5;
        }
    }

    // Metóda vráti viditeľné články podľa veľkosti modulu
    getVisibleArticles() {
        const maxArticles = this.getMaxArticles();
        // Vráti len prvých N článkov podľa veľkosti
        return this.articles.slice(0, maxArticles);
    }

    // Spustenie rotácie článkov
    startRotation() {
        // Vymazanie existujúcich intervalov
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // Získanie viditeľných článkov
        const visibleArticles = this.getVisibleArticles();
        if (visibleArticles.length === 0) return;

        // Zabezpečenie že currentIndex je v rámci hraníc
        if (this.currentIndex >= visibleArticles.length) {
            this.currentIndex = 0;
        }

        // Rotácia na ďalší článok každých 20 sekúnd
        this.rotationInterval = setInterval(() => {
            const visibleArticles = this.getVisibleArticles();
            if (visibleArticles.length > 0) {
                // Posun na ďalší článok (cyklické - po poslednom ide na prvý)
                this.currentIndex = (this.currentIndex + 1) % visibleArticles.length;
                // Aktualizácia zobrazenia
                this.update();
                // Spustenie progress baru
                this.startProgressBar();
            }
        }, this.rotationTime);

        // Spustenie progress baru
        this.startProgressBar();
    }

    // Spustenie animácie progress baru
    startProgressBar() {
        // Vymazanie existujúceho progress intervalu
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // Nájdenie progress baru v DOM
        const progressBar = this.container?.querySelector('.rss-progress-bar');
        if (!progressBar) return;

        // Reset progress baru na 0% a nastav transition
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';

        // Spustenie animácie pomocou CSS transition
        setTimeout(() => {
            progressBar.style.transition = `width ${this.rotationTime / 1000}s linear`;
            progressBar.style.width = '100%';
        }, 10);
    }

    // Odstránenie HTML tagov z textu
    stripHtml(html) {
        this.tempDiv.innerHTML = html;
        // Vrátenie len textového obsahu bez HTML tagov
        return this.tempDiv.textContent || this.tempDiv.innerText || '';
    }

    // Formátovanie dátumu publikácie do ľudsky čitateľného formátu
    formatDate(pubDate) {
        if (!pubDate) return '';
        
        try {
            // Parsovanie dátumu
            const date = new Date(pubDate);
            if (isNaN(date.getTime())) return '';
            
            const now = new Date();
            // Výpočet rozdielu v milisekundách
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);      // Rozdiel v minútach
            const diffHours = Math.floor(diffMs / 3600000);  // Rozdiel v hodinách
            const diffDays = Math.floor(diffMs / 86400000);  // Rozdiel v dňoch
            
            // Formátovanie podľa veku článku
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;      // "15m ago"
            if (diffHours < 24) return `${diffHours}h ago`;    // "3h ago"
            if (diffDays < 7) return `${diffDays}d ago`;       // "2d ago"
            
            // Pre staršie články formátuj ako dátum
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
            });
        } catch (e) {
            return '';
        }
    }

    // Nastavenie veľkosti modulu
    setSize(size) {
        // Uloženie novej veľkosti
        this.size = size;
        // Reset indexu ak je mimo hraníc
        const visibleArticles = this.getVisibleArticles();
        if (this.currentIndex >= visibleArticles.length) {
            this.currentIndex = 0;
        }
        // Aktualizácia zobrazenia
        this.update();
        // Reštart rotácie s novou veľkosťou
        this.startRotation();
    }

    // Vykreslenie modulu do kontajnera
    render(container) {
        // Uloženie referencie na kontajner
        this.container = container;
        // Ak sú články načítané, vykresli ich
        if (this.articles.length > 0) {
            this.update();
        } else {
            // Inak zobraz loading správu
            this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Loading...</div>';
        }
    }

    // Aktualizácia zobrazenia modulu
    update() {
        if (!this.container || this.articles.length === 0) return;

        // Vykreslenie podľa veľkosti modulu
        if (this.size === 'small') {
            this.renderSmall();
        } else if (this.size === 'medium') {
            this.renderMedium();
        } else if (this.size === 'large') {
            this.renderLarge();
        }
    }

    // Vykreslenie malého modulu - zobrazuje len jeden článok s titulkom
    renderSmall() {
        const visibleArticles = this.getVisibleArticles();
        if (visibleArticles.length === 0) {
            this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Loading...</div>';
            return;
        }

        // Získanie aktuálne zobrazeného článku
        const article = visibleArticles[this.currentIndex];
        const formattedDate = this.formatDate(article.pubDate);
        let html = `
            <div class="rss-headlines">
                <div class="rss-headline-item">
                    ${article.title}
                    ${formattedDate ? `<div class="rss-pub-date">${formattedDate}</div>` : ''}
                </div>
            </div>
            <div class="rss-progress-container">
                <div class="rss-progress-bar"></div>
            </div>
        `;
        this.container.innerHTML = html;
        // Spustenie progress baru
        this.startProgressBar();
    }

    // Vykreslenie stredného modulu - zobrazuje jeden článok s titulkom a popisom
    renderMedium() {
        const visibleArticles = this.getVisibleArticles();
        if (visibleArticles.length === 0) {
            this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Loading...</div>';
            return;
        }

        // Získanie aktuálne zobrazeného článku
        const article = visibleArticles[this.currentIndex];
        const formattedDate = this.formatDate(article.pubDate);
        let html = `
            <div class="rss-item" style="animation: fadeInSlide 0.5s ease both">
                <div class="rss-item-title">${article.title}</div>
                ${formattedDate ? `<div class="rss-pub-date">${formattedDate}</div>` : ''}
                <div class="rss-item-description">${article.description}</div>
            </div>
            <div class="rss-progress-container">
                <div class="rss-progress-bar"></div>
            </div>
        `;
        this.container.innerHTML = html;
        // Spustenie progress baru
        this.startProgressBar();
    }

    // Vykreslenie veľkého modulu - zobrazuje jeden článok s obrázkom, titulkom a popisom
    renderLarge() {
        const visibleArticles = this.getVisibleArticles();
        if (visibleArticles.length === 0) {
            this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Loading...</div>';
            return;
        }

        // Získanie aktuálne zobrazeného článku
        const article = visibleArticles[this.currentIndex];
        const formattedDate = this.formatDate(article.pubDate);
        let html = `
            <div class="rss-card" style="animation: fadeInSlide 0.5s ease both">
                ${article.image ? `<img src="${article.image}" class="rss-card-thumbnail" alt="${article.title}">` : ''}
                <div class="rss-card-content">
                    <div class="rss-item-title">${article.title}</div>
                    ${formattedDate ? `<div class="rss-pub-date">${formattedDate}</div>` : ''}
                    <div class="rss-item-description">${article.description}</div>
                </div>
            </div>
            <div class="rss-progress-container">
                <div class="rss-progress-bar"></div>
            </div>
        `;
        this.container.innerHTML = html;
        // Spustenie progress baru
        this.startProgressBar();
    }

    // Zničenie modulu - cleanup intervalov
    destroy() {
        // Zastavenie obnovovania RSS feedu
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        // Zastavenie rotácie článkov
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        // Zastavenie progress baru
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
}
