// Trieda pre modul počasia - zobrazuje aktuálne počasie a predpoveď z Open-Meteo API
class WeatherModule {
    constructor() {
        // Názov modulu zobrazený v hlavičke
        this.name = 'Weather';
        // Aktuálna veľkosť modulu (small, medium, large)
        this.size = 'medium';
        // Dáta o počasí načítané z API
        this.weatherData = null;
        // Interval pre periodické obnovovanie dát o počasí
        this.updateInterval = null;
        // URL adresa Open-Meteo API s parametrami pre Žilinu (latitude=49.2231, longitude=18.7394)
        // Obsahuje denné, hodinové a aktuálne dáta o počasí
        this.apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude=49.2231&longitude=18.7394&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,cloud_cover,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,rain,snowfall&timezone=Europe%2FBerlin&past_days=1&forecast_hours=1';
    }

    // Metóda vráti názov modulu
    getName() {
        return this.name;
    }

    // Inicializácia modulu - volá sa pri pridaní modulu do aplikácie
    init(moduleId) {
        // Uloženie ID modulu
        this.moduleId = moduleId;
        // Načítanie dát o počasí
        this.fetchWeather();
        // Nastavenie periodického obnovovania každých 30 minút
        this.updateInterval = setInterval(() => {
            this.fetchWeather();
        }, 30 * 60 * 1000);
    }

    // Asynchrónne načítanie dát o počasí z API
    async fetchWeather() {
        try {
            // Načítanie dát z API
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            // Spracovanie aktuálnych dát o počasí
            const current = data.current;
            this.weatherData = {
                // Aktuálne počasie
                current: {
                    temperature: Math.round(current.temperature_2m),              // Aktuálna teplota
                    apparentTemperature: Math.round(current.apparent_temperature),   // Pocitová teplota
                    humidity: current.relative_humidity_2m,                         // Vlhkost vzduchu (%)
                    weatherCode: current.weather_code,                              // Kód počasia (WMO)
                    isDay: current.is_day === 1,                                     // Je deň (true/false)
                    cloudCover: current.cloud_cover,                                 // Oblasť oblačnosti (%)
                    windSpeed: Math.round(current.wind_speed_10m),                   // Rýchlosť vetra (km/h)
                    windDirection: current.wind_direction_10m,                        // Smer vetra (stupne)
                    windGusts: Math.round(current.wind_gusts_10m),                   // Nárazy vetra (km/h)
                    pressure: Math.round(current.pressure_msl),                      // Tlak vzduchu (hPa)
                    precipitation: current.precipitation,                            // Zrážky (mm)
                    rain: current.rain,                                              // Dážď (mm)
                    snowfall: current.snowfall                                        // Sneh (cm)
                },
                // Denné dáta
                daily: {
                    // Dáta pre dnešok
                    today: {
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),           // Maximálna teplota
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),           // Minimálna teplota
                        apparentTempMax: Math.round(data.daily.apparent_temperature_max[0]), // Max pocitová teplota
                        apparentTempMin: Math.round(data.daily.apparent_temperature_min[0]), // Min pocitová teplota
                        weatherCode: data.daily.weather_code[0],                        // Kód počasia
                        precipitationProb: data.daily.precipitation_probability_max[0], // Pravdepodobnosť zrážok (%)
                        precipitation: data.daily.precipitation_sum[0],                  // Celkové zrážky (mm)
                        windSpeed: Math.round(data.daily.wind_speed_10m_max[0]),         // Max rýchlosť vetra
                        sunrise: data.daily.sunrise[0],                                  // Východ slnka
                        sunset: data.daily.sunset[0]                                     // Západ slnka
                    },
                    // Predpoveď na ďalšie dni
                    forecast: []
                },
                // Hodinové dáta
                hourly: []
            };

            // Spracovanie hodinovej predpovede (ďalších 24 hodín)
            for (let i = 0; i < 24 && i < data.hourly.time.length; i++) {
                const time = data.hourly.time[i];
                const date = new Date(time);
                this.weatherData.hourly.push({
                    time: time,                                    // Čas
                    hour: date.getHours(),                         // Hodina (0-23)
                    temperature: Math.round(data.hourly.temperature_2m[i]), // Teplota
                    weatherCode: data.hourly.weather_code[i],      // Kód počasia
                    precipitationProb: data.hourly.precipitation_probability[i], // Pravdepodobnosť zrážok
                    precipitation: data.hourly.precipitation[i]    // Zrážky
                });
            }

            // Spracovanie dennej predpovede (dnes + ďalších 7 dní = celkom 8 dní)
            for (let i = 0; i < 8 && i < data.daily.time.length; i++) {
                const date = new Date(data.daily.time[i]);
                const tempMax = Math.round(data.daily.temperature_2m_max[i]);
                const tempMin = Math.round(data.daily.temperature_2m_min[i]);
                const tempAvg = Math.round((tempMax + tempMin) / 2); // Priemerná teplota
                
                this.weatherData.daily.forecast.push({
                    date: data.daily.time[i],                       // Dátum
                    dayName: i === 0 ? 'Today' : this.formatDayName(date), // Názov dňa
                    tempMax: tempMax,                               // Max teplota
                    tempMin: tempMin,                               // Min teplota
                    tempAvg: tempAvg,                               // Priemerná teplota
                    weatherCode: data.daily.weather_code[i],        // Kód počasia
                    precipitationProb: data.daily.precipitation_probability_max[i], // Pravdepodobnosť zrážok
                    precipitation: data.daily.precipitation_sum[i], // Zrážky
                    windSpeed: Math.round(data.daily.wind_speed_10m_max[i]) // Rýchlosť vetra
                });
            }

            // Aktualizácia zobrazenia
            this.update();
        } catch (error) {
            // V prípade chyby vypíš error a zobraz chybovú správu
            console.error('Error fetching weather:', error);
            if (this.container) {
                this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Failed to load weather</div>';
            }
        }
    }

    // Metóda vráti ikonu počasia podľa WMO kódu
    getWeatherIcon(code, isDay = true) {
        // WMO Weather interpretation codes (0-99)
        const icons = {
            0: isDay ? '☀️' : '🌙', // Jasno
            1: isDay ? '🌤️' : '☁️', // Prevažne jasno
            2: isDay ? '⛅' : '☁️', // Čiastočne oblačno
            3: '☁️', // Oblačno
            45: '🌫️', 46: '🌫️', 47: '🌫️', 48: '🌫️', // Hmla
            51: '🌦️', 52: '🌦️', 53: '🌦️', 54: '🌦️', 55: '🌦️', 56: '🌦️', 57: '🌦️', // Mrholenie
            61: '🌧️', 62: '🌧️', 63: '🌧️', 64: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️', // Dážď
            71: '❄️', 72: '❄️', 73: '❄️', 74: '❄️', 75: '❄️', 76: '❄️', 77: '❄️', // Sneh
            80: '🌦️', 81: '🌦️', 82: '🌦️', // Prehánky
            85: '🌨️', 86: '🌨️', // Snežné prehánky
            95: '⛈️', 96: '⛈️', 97: '⛈️', 98: '⛈️', 99: '⛈️' // Búrka
        };
        return icons[code] || '🌤️'; // Predvolená ikona
    }

    // Formátovanie času do formátu HH:MM
    formatTime(timeString) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Formátovanie názvu dňa (Sun, Mon, Tue, atď.)
    formatDayName(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    // Konverzia smeru vetra zo stupňov na smer (N, NE, E, SE, S, SW, W, NW)
    getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
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
        // Ak sú dáta načítané, vykresli ich
        if (this.weatherData) {
            this.update();
        } else {
            // Inak zobraz loading správu
            this.container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">Loading...</div>';
        }
    }

    // Aktualizácia zobrazenia modulu
    update() {
        if (!this.container || !this.weatherData) return;

        // Vykreslenie podľa veľkosti modulu
        if (this.size === 'small') {
            this.renderSmall();
        } else if (this.size === 'medium') {
            this.renderMedium();
        } else if (this.size === 'large') {
            this.renderLarge();
        }
    }

    // Vykreslenie malého modulu - minimálne informácie
    renderSmall() {
        const { current, daily } = this.weatherData;
        const icon = this.getWeatherIcon(current.weatherCode, current.isDay);
        
        this.container.innerHTML = `
            <div class="current-weather">
                <div class="weather-icon">${icon}</div>
                <div>
                    <div class="weather-temp">${current.temperature}°</div>
                    <div class="weather-feels-like">Feels like ${current.apparentTemperature}°</div>
                    <div class="weather-min-max">${daily.today.tempMin}° / ${daily.today.tempMax}°</div>
                </div>
            </div>
        `;
    }

    // Vykreslenie stredného modulu - viac informácií
    renderMedium() {
        const { current, daily } = this.weatherData;
        const icon = this.getWeatherIcon(current.weatherCode, current.isDay);
        
        let html = `
            <div class="weather-medium-header">
                <div class="weather-medium-icon">${icon}</div>
                <div class="weather-medium-main">
                    <div class="weather-medium-temp">${current.temperature}°</div>
                    <div class="weather-medium-range">${daily.today.tempMin}° / ${daily.today.tempMax}°</div>
                </div>
            </div>
            <div class="weather-medium-info-grid">
                <div class="weather-info-card">
                    <div class="weather-info-icon">↑</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Sunrise</div>
                        <div class="weather-info-value">${this.formatTime(daily.today.sunrise)}</div>
                    </div>
                </div>
                <div class="weather-info-card">
                    <div class="weather-info-icon">↓</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Sunset</div>
                        <div class="weather-info-value">${this.formatTime(daily.today.sunset)}</div>
                    </div>
                </div>
                <div class="weather-info-card">
                    <div class="weather-info-icon">→</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Wind</div>
                        <div class="weather-info-value">${current.windSpeed} km/h ${this.getWindDirection(current.windDirection)}</div>
                    </div>
                </div>
                <div class="weather-info-card">
                    <div class="weather-info-icon">%</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Humidity</div>
                        <div class="weather-info-value">${current.humidity}%</div>
                    </div>
                </div>
                <div class="weather-info-card">
                    <div class="weather-info-icon">○</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Clouds</div>
                        <div class="weather-info-value">${current.cloudCover}%</div>
                    </div>
                </div>
                <div class="weather-info-card">
                    <div class="weather-info-icon">◉</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Pressure</div>
                        <div class="weather-info-value">${current.pressure} hPa</div>
                    </div>
                </div>
                ${daily.today.precipitationProb > 0 ? `
                <div class="weather-info-card">
                    <div class="weather-info-icon">·</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Precipitation</div>
                        <div class="weather-info-value">${daily.today.precipitationProb}%</div>
                    </div>
                </div>
                ` : ''}
                <div class="weather-info-card">
                    <div class="weather-info-icon">°</div>
                    <div class="weather-info-content">
                        <div class="weather-info-label">Feels Like</div>
                        <div class="weather-info-value">${current.apparentTemperature}°</div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    // Vykreslenie veľkého modulu - 8-dňová predpoveď
    renderLarge() {
        const { daily } = this.weatherData;
        
        let html = `
            <div class="forecast-daily-large">
        `;

        // Pre každý deň v predpovedi
        daily.forecast.forEach(day => {
            const dayIcon = this.getWeatherIcon(day.weatherCode, true);
            html += `
                <div class="forecast-day-card">
                    <div class="forecast-day-name">${day.dayName}</div>
                    <div class="forecast-day-icon">${dayIcon}</div>
                    <div class="forecast-day-temps">
                        <div class="forecast-temp-max">${day.tempMax}°</div>
                        <div class="forecast-temp-avg">${day.tempAvg}°</div>
                        <div class="forecast-temp-min">${day.tempMin}°</div>
                    </div>
                    ${day.precipitationProb > 0 ? `<div class="forecast-day-precip">${day.precipitationProb}%</div>` : '<div class="forecast-day-precip-empty"></div>'}
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    }

    // Zničenie modulu - cleanup intervalu
    destroy() {
        // Zastavenie obnovovania dát o počasí
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
