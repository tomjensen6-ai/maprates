const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/geocode', async (req, res) => {
    const { venue, country } = req.query;
    
    if (!venue || !country) {
        return res.status(400).json({ error: 'Missing venue or country parameter' });
    }
    
    const searchQuery = `${venue}, ${country}`;
    console.log(`Geocoding: ${searchQuery}`);
    
    try {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'MapRates-Sports/1.0 (contact@maprates.com)'
                }
            }
        );
        
        if (!response.ok) {
            console.log(`Nominatim error: ${response.status}`);
            return res.json([]); // Return empty array instead of error
        }
        
        const data = await response.json();
        console.log(`Found ${data.length} results for ${venue}`);
        res.json(data);
        
    } catch (error) {
        console.error(`Geocoding error for ${venue}:`, error.message);
        res.json([]); // Return empty array instead of error
    }
});

app.listen(3001, () => {
    console.log('Geocoding server running on port 3001');
});