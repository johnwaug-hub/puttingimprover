/**
 * (c) 2024-2026 Lock Jaw Disc Golf / John Waugaman. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL - Unauthorized copying, modification,
 * distribution, or use is strictly prohibited. Protected under DMCA.
 * Contact: lockjawdiscgolf@gmail.com
 */
/**
 * Weather Service Module
 * Fetches real-time weather data and attaches it to practice activities
 */

class WeatherService {
    constructor() {
        // Using OpenWeatherMap API - free tier allows 60 calls/minute
        this.apiKey = 'bd40da6ad998b8c152bdc26199f8f220'; // OpenWeatherMap API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.cache = new Map(); // Cache weather data for 10 minutes
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes in milliseconds

        // Store API key in localStorage for persistence
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('weatherApiKey', this.apiKey);
        }
    }

    /**
     * Set the API key for weather service
     * @param {string} apiKey - OpenWeatherMap API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('weatherApiKey', apiKey);
    }

    /**
     * Get the stored API key
     * @returns {string|null} API key or null
     */
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('weatherApiKey');
        }
        return this.apiKey;
    }

    /**
     * Fetch weather data by ZIP code
     * @param {string} zipCode - US ZIP code
     * @param {string} countryCode - Country code (default: 'us')
     * @returns {Promise<Object>} Weather data
     */
    async getWeatherByZipCode(zipCode, countryCode = 'us') {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.warn('⚠️ No weather API key configured');
            return null;
        }

        // Check cache first
        const cacheKey = `${zipCode}_${countryCode}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Using cached weather data');
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}?zip=${zipCode},${countryCode}&appid=${apiKey}&units=imperial`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            const weatherData = this.parseWeatherData(data);

            // Cache the result
            this.cache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });

            console.log('🌤️ Weather data fetched:', weatherData);
            return weatherData;
        } catch (error) {
            // Silently fail - weather is optional
            return null;
        }
    }

    /**
     * Fetch weather data by coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Weather data
     */
    async getWeatherByCoordinates(lat, lon) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.warn('⚠️ No weather API key configured');
            return null;
        }

        // Check cache
        const cacheKey = `${lat}_${lon}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Using cached weather data');
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            const weatherData = this.parseWeatherData(data);

            // Cache the result
            this.cache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });

            console.log('🌤️ Weather data fetched:', weatherData);
            return weatherData;
        } catch (error) {
            // Silently fail - weather is optional
            return null;
        }
    }

    /**
     * Parse raw weather API data into simplified format
     * @param {Object} data - Raw weather data from API
     * @returns {Object} Parsed weather data
     */
    parseWeatherData(data) {
        return {
            temperature: Math.round(data.main.temp), // Fahrenheit
            feelsLike: Math.round(data.main.feels_like), // Fahrenheit
            humidity: data.main.humidity, // Percentage
            pressure: data.main.pressure, // hPa
            description: data.weather[0].description,
            main: data.weather[0].main, // e.g., "Clear", "Rain", "Clouds"
            icon: data.weather[0].icon,
            windSpeed: Math.round(data.wind.speed), // mph
            windDirection: data.wind.deg, // degrees
            cloudiness: data.clouds.all, // percentage
            visibility: data.visibility ? Math.round(data.visibility / 1609.34) : null, // miles
            rain: data.rain ? data.rain['1h'] || 0 : 0, // mm in last hour
            snow: data.snow ? data.snow['1h'] || 0 : 0, // mm in last hour
            timestamp: new Date().toISOString(),
            location: {
                city: data.name,
                country: data.sys.country,
                lat: data.coord.lat,
                lon: data.coord.lon
            }
        };
    }

    /**
     * Get weather emoji based on conditions
     * @param {Object} weather - Weather data
     * @returns {string} Weather emoji
     */
    getWeatherEmoji(weather) {
        if (!weather) return '🌡️';

        const main = weather.main.toLowerCase();

        if (main.includes('clear')) return '☀️';
        if (main.includes('cloud')) return '☁️';
        if (main.includes('rain')) return '🌧️';
        if (main.includes('drizzle')) return '🌦️';
        if (main.includes('thunder')) return '⛈️';
        if (main.includes('snow')) return '❄️';
        if (main.includes('mist') || main.includes('fog')) return '🌫️';
        if (main.includes('wind')) return '💨';

        return '🌤️';
    }

    /**
     * Get weather icon URL from OpenWeatherMap
     * @param {string} iconCode - Icon code from weather data
     * @returns {string} Icon URL
     */
    getWeatherIconUrl(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }

    /**
     * Format weather data for display
     * @param {Object} weather - Weather data
     * @returns {string} Formatted weather string
     */
    formatWeatherDisplay(weather) {
        if (!weather) return 'Weather data unavailable';

        const emoji = this.getWeatherEmoji(weather);
        return `${emoji} ${weather.temperature}°F, ${weather.description}`;
    }

    /**
     * Get detailed weather summary
     * @param {Object} weather - Weather data
     * @returns {string} Detailed summary
     */
    getWeatherSummary(weather) {
        if (!weather) return 'Weather data unavailable';

        const parts = [];
        parts.push(`${weather.temperature}°F (feels like ${weather.feelsLike}°F)`);
        parts.push(weather.description);

        if (weather.windSpeed > 0) {
            parts.push(`Wind: ${weather.windSpeed} mph`);
        }

        if (weather.humidity) {
            parts.push(`Humidity: ${weather.humidity}%`);
        }

        if (weather.rain > 0) {
            parts.push(`Rain: ${weather.rain}mm`);
        }

        if (weather.snow > 0) {
            parts.push(`Snow: ${weather.snow}mm`);
        }

        return parts.join(' • ');
    }

    /**
     * Check if weather conditions are challenging
     * Used for "Weather Warrior" achievement
     * @param {Object} weather - Weather data
     * @returns {boolean} True if challenging conditions
     */
    isChallengingWeather(weather) {
        if (!weather) return false;

        const challenging =
            weather.temperature < 35 || // Cold
            weather.temperature > 95 || // Hot
            weather.windSpeed > 15 || // Windy
            weather.rain > 0 || // Rainy
            weather.snow > 0 || // Snowy
            weather.main.toLowerCase().includes('thunder'); // Thunderstorm

        return challenging;
    }

    /**
     * Clear the weather cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Weather cache cleared');
    }
}

// Export singleton instance
export const weatherService = new WeatherService();
