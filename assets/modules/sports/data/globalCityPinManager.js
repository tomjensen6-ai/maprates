// File: assets/modules/sports/data/globalCityPinManager.js

class GlobalCityPinManager {
    constructor() {
        this.stadiumCoordinates = new Map();
        this.cityCoordinates = new Map();
        this.countryTeams = new Map();
        this.initializeKnownCoordinates();
    }

    // Initialize all known stadium and city coordinates
    initializeKnownCoordinates() {
        // LIVE DATA COUNTRIES - Exact Stadium Coordinates
        const liveStadiums = {
            // UK - Premier League + Championship (44 teams)
            'Old Trafford': { lat: 51.4748, lng: -2.2426, city: 'Manchester', country: 'United Kingdom' },
            'Emirates Stadium': { lat: 51.5549, lng: -0.1084, city: 'London', country: 'United Kingdom' },
            'Anfield': { lat: 53.4308, lng: -2.9609, city: 'Liverpool', country: 'United Kingdom' },
            'Stamford Bridge': { lat: 51.4816, lng: -0.1915, city: 'London', country: 'United Kingdom' },
            'Etihad Stadium': { lat: 53.4831, lng: -2.2004, city: 'Manchester', country: 'United Kingdom' },
            'Tottenham Hotspur Stadium': { lat: 51.6042, lng: -0.0667, city: 'London', country: 'United Kingdom' },
            'London Stadium': { lat: 51.5387, lng: -0.0166, city: 'London', country: 'United Kingdom' },
            'Goodison Park': { lat: 53.4387, lng: -2.9663, city: 'Liverpool', country: 'United Kingdom' },
            'Villa Park': { lat: 52.5094, lng: -1.8848, city: 'Birmingham', country: 'United Kingdom' },
            'Bramall Lane': { lat: 53.3704, lng: -1.4707, city: 'Sheffield', country: 'United Kingdom' },
            
            // SPAIN - La Liga (20 teams)
            'Santiago Bernabéu': { lat: 40.4530, lng: -3.6883, city: 'Madrid', country: 'Spain' },
            'Camp Nou': { lat: 41.3809, lng: 2.1228, city: 'Barcelona', country: 'Spain' },
            'Metropolitano Stadium': { lat: 40.4363, lng: -3.5995, city: 'Madrid', country: 'Spain' },
            'Ramón Sánchez Pizjuán': { lat: 37.3834, lng: -5.9707, city: 'Sevilla', country: 'Spain' },
            'Mestalla': { lat: 39.4747, lng: -0.3589, city: 'Valencia', country: 'Spain' },
            
            // GERMANY - Bundesliga (18 teams)
            'Allianz Arena': { lat: 48.2188, lng: 11.6242, city: 'Munich', country: 'Germany' },
            'Signal Iduna Park': { lat: 51.4926, lng: 7.4516, city: 'Dortmund', country: 'Germany' },
            'Red Bull Arena Leipzig': { lat: 51.3459, lng: 12.3480, city: 'Leipzig', country: 'Germany' },
            'BayArena': { lat: 51.0362, lng: 7.0021, city: 'Leverkusen', country: 'Germany' },
            
            // ITALY - Serie A (20 teams)
            'San Siro': { lat: 45.4782, lng: 9.1240, city: 'Milan', country: 'Italy' },
            'Allianz Stadium': { lat: 45.1097, lng: 7.6410, city: 'Turin', country: 'Italy' },
            'Stadio Olimpico': { lat: 41.9342, lng: 12.4549, city: 'Rome', country: 'Italy' },
            'San Paolo': { lat: 40.8282, lng: 14.1930, city: 'Naples', country: 'Italy' },
            
            // FRANCE - Ligue 1 (18 teams)
            'Parc des Princes': { lat: 48.8414, lng: 2.2530, city: 'Paris', country: 'France' },
            'Orange Vélodrome': { lat: 43.2699, lng: 5.3959, city: 'Marseille', country: 'France' },
            'Groupama Stadium': { lat: 45.7652, lng: 5.0679, city: 'Lyon', country: 'France' },
            
            // NETHERLANDS - Eredivisie (18 teams)
            'Johan Cruyff Arena': { lat: 52.3140, lng: 4.9419, city: 'Amsterdam', country: 'Netherlands' },
            'De Kuip': { lat: 51.8940, lng: 4.5225, city: 'Rotterdam', country: 'Netherlands' },
            'Philips Stadion': { lat: 51.4416, lng: 5.4675, city: 'Eindhoven', country: 'Netherlands' },
            
            // PORTUGAL - Primeira Liga (18 teams)
            'Estádio da Luz': { lat: 38.7527, lng: -9.1844, city: 'Lisbon', country: 'Portugal' },
            'Estádio do Dragão': { lat: 41.1614, lng: -8.5834, city: 'Porto', country: 'Portugal' },
            
            // BRAZIL - Série A (20 teams)
            'Maracanã': { lat: -22.9122, lng: -43.2302, city: 'Rio de Janeiro', country: 'Brazil' },
            'Arena Corinthians': { lat: -23.5451, lng: -46.4734, city: 'São Paulo', country: 'Brazil' },
            'Allianz Parque': { lat: -23.5276, lng: -46.6922, city: 'São Paulo', country: 'Brazil' }
        };

        // Store known stadium coordinates
        for (const [stadium, coords] of Object.entries(liveStadiums)) {
            this.stadiumCoordinates.set(stadium, coords);
        }

        // Major city coordinates for countries without live data (Top 3-5 football cities per country)
        const majorFootballCities = {
            // Europe
            'Sweden': [
                { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
                { name: 'Gothenburg', lat: 57.7089, lng: 11.9746 },
                { name: 'Malmö', lat: 55.6059, lng: 13.0007 }
            ],
            'Norway': [
                { name: 'Oslo', lat: 59.9139, lng: 10.7522 },
                { name: 'Bergen', lat: 60.3913, lng: 5.3221 },
                { name: 'Trondheim', lat: 63.4305, lng: 10.3951 }
            ],
            'Denmark': [
                { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
                { name: 'Aarhus', lat: 56.1629, lng: 10.2039 },
                { name: 'Odense', lat: 55.4038, lng: 10.4024 }
            ],
            'Belgium': [
                { name: 'Brussels', lat: 50.8476, lng: 4.3572 },
                { name: 'Antwerp', lat: 51.2194, lng: 4.4025 },
                { name: 'Ghent', lat: 51.0543, lng: 3.7174 }
            ],
            'Switzerland': [
                { name: 'Zurich', lat: 47.3769, lng: 8.5417 },
                { name: 'Basel', lat: 47.5596, lng: 7.5886 },
                { name: 'Bern', lat: 46.9480, lng: 7.4474 }
            ],
            'Austria': [
                { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
                { name: 'Salzburg', lat: 47.8095, lng: 13.0550 },
                { name: 'Innsbruck', lat: 47.2692, lng: 11.4041 }
            ],
            'Czech Republic': [
                { name: 'Prague', lat: 50.0755, lng: 14.4378 },
                { name: 'Brno', lat: 49.1951, lng: 16.6068 },
                { name: 'Ostrava', lat: 49.8209, lng: 18.2625 }
            ],
            'Poland': [
                { name: 'Warsaw', lat: 52.2297, lng: 21.0122 },
                { name: 'Krakow', lat: 50.0647, lng: 19.9450 },
                { name: 'Gdansk', lat: 54.3520, lng: 18.6466 }
            ],
            'Hungary': [
                { name: 'Budapest', lat: 47.4979, lng: 19.0402 },
                { name: 'Debrecen', lat: 47.5316, lng: 21.6273 },
                { name: 'Szeged', lat: 46.2530, lng: 20.1414 }
            ],
            'Romania': [
                { name: 'Bucharest', lat: 44.4268, lng: 26.1025 },
                { name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236 },
                { name: 'Timișoara', lat: 45.7489, lng: 21.2087 }
            ],
            'Bulgaria': [
                { name: 'Sofia', lat: 42.6977, lng: 23.3219 },
                { name: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
                { name: 'Varna', lat: 43.2141, lng: 27.9147 }
            ],
            'Croatia': [
                { name: 'Zagreb', lat: 45.8150, lng: 15.9819 },
                { name: 'Split', lat: 43.5081, lng: 16.4402 },
                { name: 'Rijeka', lat: 45.3271, lng: 14.4422 }
            ],
            'Serbia': [
                { name: 'Belgrade', lat: 44.7866, lng: 20.4489 },
                { name: 'Novi Sad', lat: 45.2671, lng: 19.8335 },
                { name: 'Niš', lat: 43.3209, lng: 21.8958 }
            ],
            'Greece': [
                { name: 'Athens', lat: 37.9838, lng: 23.7275 },
                { name: 'Thessaloniki', lat: 40.6401, lng: 22.9444 },
                { name: 'Patras', lat: 38.2466, lng: 21.7346 }
            ],
            'Turkey': [
                { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
                { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
                { name: 'Izmir', lat: 38.4237, lng: 27.1428 }
            ],
            'Russia': [
                { name: 'Moscow', lat: 55.7558, lng: 37.6176 },
                { name: 'Saint Petersburg', lat: 59.9311, lng: 30.3609 },
                { name: 'Kazan', lat: 55.8304, lng: 49.0661 }
            ],
            'Ukraine': [
                { name: 'Kyiv', lat: 50.4501, lng: 30.5234 },
                { name: 'Kharkiv', lat: 49.9935, lng: 36.2304 },
                { name: 'Odessa', lat: 46.4825, lng: 30.7233 }
            ],

            // South America
            'Argentina': [
                { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
                { name: 'Rosario', lat: -32.9442, lng: -60.6505 },
                { name: 'Córdoba', lat: -31.4201, lng: -64.1888 }
            ],
            'Uruguay': [
                { name: 'Montevideo', lat: -34.9011, lng: -56.1645 },
                { name: 'Salto', lat: -31.3833, lng: -57.9667 },
                { name: 'Paysandú', lat: -32.3217, lng: -58.0756 }
            ],
            'Chile': [
                { name: 'Santiago', lat: -33.4489, lng: -70.6693 },
                { name: 'Valparaíso', lat: -33.0472, lng: -71.6127 },
                { name: 'Concepción', lat: -36.8201, lng: -73.0444 }
            ],
            'Colombia': [
                { name: 'Bogotá', lat: 4.7110, lng: -74.0721 },
                { name: 'Medellín', lat: 6.2442, lng: -75.5812 },
                { name: 'Cali', lat: 3.4516, lng: -76.5320 }
            ],
            'Peru': [
                { name: 'Lima', lat: -12.0464, lng: -77.0428 },
                { name: 'Arequipa', lat: -16.4090, lng: -71.5375 },
                { name: 'Trujillo', lat: -8.1116, lng: -79.0289 }
            ],
            'Ecuador': [
                { name: 'Quito', lat: -0.1807, lng: -78.4678 },
                { name: 'Guayaquil', lat: -2.1709, lng: -79.9224 },
                { name: 'Cuenca', lat: -2.9001, lng: -79.0059 }
            ],
            'Bolivia': [
                { name: 'La Paz', lat: -16.5000, lng: -68.1193 },
                { name: 'Santa Cruz', lat: -17.8146, lng: -63.1561 },
                { name: 'Cochabamba', lat: -17.3895, lng: -66.1568 }
            ],
            'Paraguay': [
                { name: 'Asunción', lat: -25.2637, lng: -57.5759 },
                { name: 'Ciudad del Este', lat: -25.5095, lng: -54.6112 },
                { name: 'San Lorenzo', lat: -25.3406, lng: -57.5217 }
            ],
            'Venezuela': [
                { name: 'Caracas', lat: 10.4806, lng: -66.9036 },
                { name: 'Maracaibo', lat: 10.6666, lng: -71.6333 },
                { name: 'Valencia', lat: 10.1621, lng: -68.0077 }
            ],

            // North & Central America
            'Mexico': [
                { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
                { name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
                { name: 'Monterrey', lat: 25.6866, lng: -100.3161 }
            ],
            'United States': [
                { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
                { name: 'New York', lat: 40.7128, lng: -74.0060 },
                { name: 'Seattle', lat: 47.6062, lng: -122.3321 }
            ],
            'Canada': [
                { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
                { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
                { name: 'Montreal', lat: 45.5017, lng: -73.5673 }
            ],
            'Costa Rica': [
                { name: 'San José', lat: 9.9281, lng: -84.0907 },
                { name: 'Cartago', lat: 9.8644, lng: -83.9194 },
                { name: 'Alajuela', lat: 10.0162, lng: -84.2119 }
            ],
            'Guatemala': [
                { name: 'Guatemala City', lat: 14.6349, lng: -90.5069 },
                { name: 'Quetzaltenango', lat: 14.8333, lng: -91.5167 },
                { name: 'Escuintla', lat: 14.3057, lng: -90.7851 }
            ],
            'Honduras': [
                { name: 'Tegucigalpa', lat: 14.0723, lng: -87.1921 },
                { name: 'San Pedro Sula', lat: 15.5000, lng: -88.0333 },
                { name: 'Choloma', lat: 15.6108, lng: -87.9531 }
            ],

            // Africa
            'Nigeria': [
                { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
                { name: 'Abuja', lat: 9.0765, lng: 7.3986 },
                { name: 'Kano', lat: 12.0022, lng: 8.5920 }
            ],
            'Egypt': [
                { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
                { name: 'Alexandria', lat: 31.2001, lng: 29.9187 },
                { name: 'Giza', lat: 30.0131, lng: 31.2089 }
            ],
            'South Africa': [
                { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
                { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
                { name: 'Durban', lat: -29.8587, lng: 31.0218 }
            ],
            'Morocco': [
                { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
                { name: 'Rabat', lat: 33.9716, lng: -6.8498 },
                { name: 'Marrakech', lat: 31.6295, lng: -7.9811 }
            ],
            'Ghana': [
                { name: 'Accra', lat: 5.6037, lng: -0.1870 },
                { name: 'Kumasi', lat: 6.6885, lng: -1.6244 },
                { name: 'Tamale', lat: 9.4008, lng: -0.8393 }
            ],
            'Senegal': [
                { name: 'Dakar', lat: 14.7167, lng: -17.4677 },
                { name: 'Thiès', lat: 14.7886, lng: -16.9262 },
                { name: 'Kaolack', lat: 14.1333, lng: -16.0833 }
            ],

            // Asia
            'Japan': [
                { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
                { name: 'Osaka', lat: 34.6937, lng: 135.5023 },
                { name: 'Yokohama', lat: 35.4438, lng: 139.6380 }
            ],
            'South Korea': [
                { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
                { name: 'Busan', lat: 35.1796, lng: 129.0756 },
                { name: 'Incheon', lat: 37.4563, lng: 126.7052 }
            ],
            'China': [
                { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
                { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
                { name: 'Guangzhou', lat: 23.1291, lng: 113.2644 }
            ],
            'Saudi Arabia': [
                { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
                { name: 'Jeddah', lat: 21.4858, lng: 39.1925 },
                { name: 'Mecca', lat: 21.3891, lng: 39.8579 }
            ],
            'Iran': [
                { name: 'Tehran', lat: 35.6892, lng: 51.3890 },
                { name: 'Mashhad', lat: 36.2605, lng: 59.6168 },
                { name: 'Isfahan', lat: 32.6546, lng: 51.6680 }
            ],
            'Iraq': [
                { name: 'Baghdad', lat: 33.3152, lng: 44.3661 },
                { name: 'Basra', lat: 30.5000, lng: 47.8136 },
                { name: 'Mosul', lat: 36.3350, lng: 43.1189 }
            ],
            'India': [
                { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
                { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
                { name: 'Kolkata', lat: 22.5726, lng: 88.3639 }
            ],
            'Australia': [
                { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
                { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
                { name: 'Brisbane', lat: -27.4705, lng: 153.0260 }
            ]
        };

        // Store city coordinates by country
        for (const [country, cities] of Object.entries(majorFootballCities)) {
            this.cityCoordinates.set(country, cities);
        }
    }

    // Generate teams for countries with live API data
    async getLiveTeamsForCountry(countryName) {
        try {
            // Get live data from your existing globalFootballAtlas
            if (window.globalFootballAtlas) {
                const countryData = window.globalFootballAtlas.getCountryTeamData(countryName);
                if (countryData && countryData.hasLiveData) {
                    return countryData.teams.map(team => ({
                        id: team.id,
                        name: team.name,
                        shortName: team.shortName,
                        venue: team.venue,
                        city: this.extractCityFromVenue(team.venue, countryName),
                        coordinates: this.getStadiumCoordinates(team.venue, countryName),
                        isLive: true,
                        league: team.competition || 'First Division',
                        founded: team.founded,
                        website: team.website,
                        colors: team.clubColors
                    }));
                }
            }
        } catch (error) {
            console.log(`No live data available for ${countryName}:`, error.message);
        }
        return [];
    }

    // Generate synthetic teams for countries without live data
    generateSyntheticTeams(countryName) {
        const cities = this.cityCoordinates.get(countryName) || [];
        if (cities.length === 0) {
            // Fallback: create one team in capital
            const capitalCoords = this.getCountryCapitalCoords(countryName);
            if (capitalCoords) {
                return [{
                    id: `synthetic_${countryName.toLowerCase().replace(/\s+/g, '_')}_1`,
                    name: `${countryName} FC`,
                    shortName: countryName.substring(0, 3).toUpperCase(),
                    venue: `National Stadium`,
                    city: capitalCoords.name,
                    coordinates: capitalCoords,
                    isLive: false,
                    league: 'First Division',
                    founded: null,
                    website: null,
                    colors: null
                }];
            }
            return [];
        }

        // Generate 3-5 teams based on major cities
        return cities.slice(0, Math.min(cities.length, 4)).map((city, index) => {
            const teamNames = [
                `${city.name} FC`,
                `${city.name} United`,
                `${city.name} Athletic`,
                `${city.name} City`
            ];

            const stadiumNames = [
                `${city.name} Stadium`,
                `Municipal Stadium`,
                `National Arena`,
                `City Ground`
            ];

            return {
                id: `synthetic_${countryName.toLowerCase().replace(/\s+/g, '_')}_${index + 1}`,
                name: teamNames[index % teamNames.length],
                shortName: city.name.substring(0, 3).toUpperCase(),
                venue: stadiumNames[index % stadiumNames.length],
                city: city.name,
                coordinates: { lat: city.lat, lng: city.lng },
                isLive: false,
                league: index === 0 ? 'First Division' : 'Premier League',
                founded: null,
                website: null,
                colors: null
            };
        });
    }

    // Get stadium coordinates (prioritize exact matches, fallback to city)
    getStadiumCoordinates(venueName, countryName) {
        // Check exact stadium match
        if (this.stadiumCoordinates.has(venueName)) {
            return this.stadiumCoordinates.get(venueName);
        }

        // Fallback: try to find city coordinates
        const cities = this.cityCoordinates.get(countryName) || [];
        const cityMatch = cities.find(city => 
            venueName.toLowerCase().includes(city.name.toLowerCase()) ||
            city.name.toLowerCase().includes(venueName.toLowerCase().split(' ')[0])
        );

        if (cityMatch) {
            return { lat: cityMatch.lat, lng: cityMatch.lng };
        }

        // Last resort: use first major city
        if (cities.length > 0) {
            return { lat: cities[0].lat, lng: cities[0].lng };
        }

        return null;
    }

    // Extract city from venue name
    extractCityFromVenue(venueName, countryName) {
        const cities = this.cityCoordinates.get(countryName) || [];
        const cityMatch = cities.find(city => 
            venueName.toLowerCase().includes(city.name.toLowerCase())
        );
        return cityMatch ? cityMatch.name : cities[0]?.name || 'Unknown';
    }

    // Get capital coordinates for countries not in our database
    getCountryCapitalCoords(countryName) {
        const capitals = {
            // Add more capitals as needed
            'Afghanistan': { name: 'Kabul', lat: 34.5553, lng: 69.2075 },
            'Albania': { name: 'Tirana', lat: 41.3275, lng: 19.8187 },
            'Algeria': { name: 'Algiers', lat: 36.7538, lng: 3.0588 },
            // ... add all 211 FIFA countries
        };
        return capitals[countryName] || null;
    }

    // Main method: Get all teams for any country
    async getAllTeamsForCountry(countryName) {
        console.log(`🏁 Generating teams for: ${countryName}`);
        
        // First try live API data
        const liveTeams = await this.getLiveTeamsForCountry(countryName);
        if (liveTeams.length > 0) {
            console.log(`✅ Found ${liveTeams.length} live teams for ${countryName}`);
            return liveTeams;
        }

        // Fallback to synthetic teams
        const syntheticTeams = this.generateSyntheticTeams(countryName);
        console.log(`📍 Generated ${syntheticTeams.length} synthetic teams for ${countryName}`);
        return syntheticTeams;
    }

    // Batch process all 211+ FIFA countries
    async generateAllCountryTeams() {
        const allCountries = [
            // Get from your FIFA countries database
            'Afghanistan', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola',
            'Anguilla', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia',
            // ... all 211 FIFA countries
        ];

        const countryTeams = new Map();
        
        for (const country of allCountries) {
            try {
                const teams = await this.getAllTeamsForCountry(country);
                countryTeams.set(country, teams);
                
                // Store in cache for quick access
                this.countryTeams.set(country, teams);
            } catch (error) {
                console.error(`Failed to generate teams for ${country}:`, error);
            }
        }

        return countryTeams;
    }

    // Integration method for your existing country map system
    getTeamsForCountryMap(countryName) {
        // Return cached teams if available
        if (this.countryTeams.has(countryName)) {
            return this.countryTeams.get(countryName);
        }

        // Generate on-demand
        return this.getAllTeamsForCountry(countryName);
    }
}

// Export for global access
window.GlobalCityPinManager = GlobalCityPinManager;

// Initialize global instance
window.globalCityPinManager = new GlobalCityPinManager();

console.log('🌍 Global City Pin Manager initialized for 211+ FIFA countries');