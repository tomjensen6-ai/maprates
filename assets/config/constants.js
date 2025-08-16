// MapRates Pro - Application Constants
export const APP_CONFIG = {
  name: 'MapRates Pro',
  version: '2.0.0',
  maxDestinations: {
    free: 2,
    premium: 5
  },
  cache: {
    maxAge: {
      historical: 24 * 60 * 60 * 1000, // 24 hours
      current: 10 * 60 * 1000, // 10 minutes
      metadata: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    maxSize: 50
  },
  ai: {
    predictionDays: 7,
    confidenceLevel: 80,
    processingTime: 1200,
    algorithms: {
      linear: { name: 'Linear Regression', weight: 0.4, color: '#4285f4' },
      momentum: { name: 'Momentum Analysis', weight: 0.3, color: '#34a853' },
      hybrid: { name: 'Hybrid ML Model', weight: 1.0, color: '#ea4335' },
      neural: { name: 'Neural Network', weight: 0.6, color: '#9c27b0' }
    }
  }
};

// Separate constants (OUTSIDE the APP_CONFIG object)
export const overlayColors = ['#34a853', '#ea4335', '#fbbc04', '#9c27b0', '#ff6b35'];

export const chartConfig = {
  overlayColors: overlayColors,
  indicators: {
    sma: { period: 20, color: '#ff6b35' },
    bollinger: { period: 20, color: '#9c27b0' },
    rsi: { period: 14, color: '#ea4335' }
  }
};

export const CURRENCY_SYMBOLS = {
     "EUR": { symbol: "€", name: "Euro" },
            "AED": { symbol: "د.إ", name: "UAE Dirham" },
            "AFN": { symbol: "؋", name: "Afghan Afghani" },
            "ALL": { symbol: "L", name: "Albanian Lek" },
            "DZD": { symbol: "د.ج", name: "Algerian Dinar" },
            "AOA": { symbol: "Kz", name: "Angolan Kwanza" },
            "ARS": { symbol: "$", name: "Argentine Peso" },
            "AMD": { symbol: "֏", name: "Armenian Dram" },
            "AUD": { symbol: "$", name: "Australian Dollar" },
            "AZN": { symbol: "₼", name: "Azerbaijani Manat" },
            "BSD": { symbol: "$", name: "Bahamian Dollar" },
            "BHD": { symbol: ".د.ب", name: "Bahraini Dinar" },
            "BDT": { symbol: "৳", name: "Bangladeshi Taka" },
            "BBD": { symbol: "$", name: "Barbadian Dollar" },
            "BYN": { symbol: "Br", name: "Belarusian Ruble" },
            "BZD": { symbol: "$", name: "Belize Dollar" },
            "XOF": { symbol: "₣", name: "West African CFA Franc" },
            "BTN": { symbol: "Nu.", name: "Bhutanese Ngultrum" },
            "BOB": { symbol: "Bs.", name: "Bolivian Boliviano" },
            "BAM": { symbol: "KM", name: "Bosnia-Herzegovina Convertible Mark" },
            "BWP": { symbol: "P", name: "Botswanan Pula" },
            "BRL": { symbol: "R$", name: "Brazilian Real" },
            "BND": { symbol: "$", name: "Brunei Dollar" },
            "BGN": { symbol: "лв", name: "Bulgarian Lev" },
            "BIF": { symbol: "₣", name: "Burundian Franc" },
            "KHR": { symbol: "៛", name: "Cambodian Riel" },
            "XAF": { symbol: "₣", name: "Central African CFA Franc" },
            "CAD": { symbol: "$", name: "Canadian Dollar" },
            "CVE": { symbol: "$", name: "Cape Verdean Escudo" },
            "CLP": { symbol: "$", name: "Chilean Peso" },
            "CNY": { symbol: "¥", name: "Chinese Yuan" },
            "COP": { symbol: "$", name: "Colombian Peso" },
            "KMF": { symbol: "₣", name: "Comorian Franc" },
            "CDF": { symbol: "₣", name: "Congolese Franc" },
            "CRC": { symbol: "₡", name: "Costa Rican Colón" },
            "CUP": { symbol: "$", name: "Cuban Peso" },
            "CZK": { symbol: "Kč", name: "Czech Republic Koruna" },
            "DKK": { symbol: "kr", name: "Danish Krone" },
            "DJF": { symbol: "₣", name: "Djiboutian Franc" },
            "XCD": { symbol: "$", name: "East Caribbean Dollar" },
            "DOP": { symbol: "$", name: "Dominican Peso" },
            "USD": { symbol: "$", name: "US Dollar" },
            "EGP": { symbol: "£", name: "Egyptian Pound" },
            "ERN": { symbol: "Nfk", name: "Eritrean Nakfa" },
            "ETB": { symbol: "Br", name: "Ethiopian Birr" },
            "FJD": { symbol: "$", name: "Fijian Dollar" },
            "GMD": { symbol: "D", name: "Gambian Dalasi" },
            "GEL": { symbol: "₾", name: "Georgian Lari" },
            "GHS": { symbol: "₵", name: "Ghanaian Cedi" },
            "GNF": { symbol: "₣", name: "Guinean Franc" },
            "GTQ": { symbol: "Q", name: "Guatemalan Quetzal" },
            "GYD": { symbol: "$", name: "Guyanaese Dollar" },
            "HTG": { symbol: "G", name: "Haitian Gourde" },
            "HNL": { symbol: "L", name: "Honduran Lempira" },
            "HKD": { symbol: "$", name: "Hong Kong Dollar" },
            "HUF": { symbol: "Ft", name: "Hungarian Forint" },
            "ISK": { symbol: "kr", name: "Icelandic Króna" },
            "INR": { symbol: "₹", name: "Indian Rupee" },
            "IDR": { symbol: "Rp", name: "Indonesian Rupiah" },
            "IRR": { symbol: "﷼", name: "Iranian Rial" },
            "IQD": { symbol: "ع.د", name: "Iraqi Dinar" },
            "ILS": { symbol: "₪", name: "Israeli New Sheqel" },
            "JMD": { symbol: "$", name: "Jamaican Dollar" },
            "JPY": { symbol: "¥", name: "Japanese Yen" },
            "JOD": { symbol: "د.ا", name: "Jordanian Dinar" },
            "KZT": { symbol: "₸", name: "Kazakhstani Tenge" },
            "KES": { symbol: "KSh", name: "Kenyan Shilling" },
            "KWD": { symbol: "د.ك", name: "Kuwaiti Dinar" },
            "KGS": { symbol: "с", name: "Kyrgystani Som" },
            "LAK": { symbol: "₭", name: "Laotian Kip" },
            "LBP": { symbol: "ل.ل", name: "Lebanese Pound" },
            "LSL": { symbol: "L", name: "Lesotho Loti" },
            "LRD": { symbol: "$", name: "Liberian Dollar" },
            "LYD": { symbol: "ل.د", name: "Libyan Dinar" },
            "CHF": { symbol: "₣", name: "Swiss Franc" },
            "MGA": { symbol: "Ar", name: "Malagasy Ariary" },
            "MWK": { symbol: "MK", name: "Malawian Kwacha" },
            "MYR": { symbol: "RM", name: "Malaysian Ringgit" },
            "MVR": { symbol: "ރ.", name: "Maldivian Rufiyaa" },
            "MRU": { symbol: "UM", name: "Mauritanian Ouguiya" },
            "MUR": { symbol: "Rs", name: "Mauritian Rupee" },
            "MXN": { symbol: "$", name: "Mexican Peso" },
            "MDL": { symbol: "L", name: "Moldovan Leu" },
            "MNT": { symbol: "₮", name: "Mongolian Tugrik" },
            "MAD": { symbol: "د.م.", name: "Moroccan Dirham" },
            "MZN": { symbol: "MT", name: "Mozambican Metical" },
            "MMK": { symbol: "Ks", name: "Myanma Kyat" },
            "NAD": { symbol: "$", name: "Namibian Dollar" },
            "NPR": { symbol: "Rs", name: "Nepalese Rupee" },
            "NZD": { symbol: "$", name: "New Zealand Dollar" },
            "NIO": { symbol: "C$", name: "Nicaraguan Córdoba" },
            "NGN": { symbol: "₦", name: "Nigerian Naira" },
            "KPW": { symbol: "₩", name: "North Korean Won" },
            "MKD": { symbol: "ден", name: "Macedonian Denar" },
            "NOK": { symbol: "kr", name: "Norwegian Krone" },
            "OMR": { symbol: "ر.ع.", name: "Omani Rial" },
            "PKR": { symbol: "Rs", name: "Pakistani Rupee" },
            "PAB": { symbol: "B/.", name: "Panamanian Balboa" },
            "PGK": { symbol: "K", name: "Papua New Guinean Kina" },
            "PYG": { symbol: "₲", name: "Paraguayan Guarani" },
            "PEN": { symbol: "S/", name: "Peruvian Nuevo Sol" },
            "PHP": { symbol: "₱", name: "Philippine Peso" },
            "PLN": { symbol: "zł", name: "Polish Zloty" },
            "QAR": { symbol: "ر.ق", name: "Qatari Rial" },
            "RON": { symbol: "lei", name: "Romanian Leu" },
            "RUB": { symbol: "₽", name: "Russian Ruble" },
            "RWF": { symbol: "₣", name: "Rwandan Franc" },
            "SAR": { symbol: "ر.س", name: "Saudi Riyal" },
            "SBD": { symbol: "$", name: "Solomon Islands Dollar" },
            "SCR": { symbol: "Rs", name: "Seychellois Rupee" },
            "SLL": { symbol: "Le", name: "Sierra Leonean Leone" },
            "SGD": { symbol: "$", name: "Singapore Dollar" },
            "SOS": { symbol: "Sh", name: "Somali Shilling" },
            "ZAR": { symbol: "R", name: "South African Rand" },
            "KRW": { symbol: "₩", name: "South Korean Won" },
            "SSP": { symbol: "£", name: "South Sudanese Pound" },
            "LKR": { symbol: "Rs", name: "Sri Lankan Rupee" },
            "SDG": { symbol: "ج.س.", name: "Sudanese Pound" },
            "SRD": { symbol: "$", name: "Surinamese Dollar" },
            "SZL": { symbol: "L", name: "Swazi Lilangeni" },
            "SEK": { symbol: "kr", name: "Swedish Krona" },
            "SYP": { symbol: "ل.س", name: "Syrian Pound" },
            "TWD": { symbol: "NT$", name: "New Taiwan Dollar" },
            "TJS": { symbol: "ЅМ", name: "Tajikistani Somoni" },
            "TZS": { symbol: "TSh", name: "Tanzanian Shilling" },
            "THB": { symbol: "฿", name: "Thai Baht" },
            "TOP": { symbol: "T$", name: "Tongan Paʻanga" },
            "TTD": { symbol: "$", name: "Trinidad and Tobago Dollar" },
            "TND": { symbol: "د.ت", name: "Tunisian Dinar" },
            "TRY": { symbol: "₺", name: "Turkish Lira" },
            "TMT": { symbol: "m", name: "Turkmenistani Manat" },
            "UGX": { symbol: "USh", name: "Ugandan Shilling" },
            "UAH": { symbol: "₴", name: "Ukrainian Hryvnia" },
            "GBP": { symbol: "£", name: "British Pound Sterling" },
            "UYU": { symbol: "$", name: "Uruguayan Peso" },
            "UZS": { symbol: "лв", name: "Uzbekistan Som" },
            "VUV": { symbol: "Vt", name: "Vanuatu Vatu" },
            "VES": { symbol: "Bs.S", name: "Venezuelan Bolívar" },
            "VND": { symbol: "₫", name: "Vietnamese Dong" },
            "WST": { symbol: "T", name: "Samoan Tala" },
            "YER": { symbol: "﷼", name: "Yemeni Rial" },
            "ZMW": { symbol: "ZK", name: "Zambian Kwacha" },
            "ZWL": { symbol: "Z$", name: "Zimbabwean Dollar" }
    };

export const FLAG_MAP = {
    'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Andorra': '🇦🇩', 
                'Angola': '🇦🇴', 'Argentina': '🇦🇷', 'Armenia': '🇦🇲', 'Australia': '🇦🇺',
                'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿', 'Bahamas': '🇧🇸', 'Bahrain': '🇧🇭',
                'Bangladesh': '🇧🇩', 'Barbados': '🇧🇧', 'Belarus': '🇧🇾', 'Belgium': '🇧🇪',
                'Belize': '🇧🇿', 'Benin': '🇧🇯', 'Bhutan': '🇧🇹', 'Bolivia': '🇧🇴',
                'Bosnia And Herzegovina': '🇧🇦', 'Botswana': '🇧🇼', 'Brazil': '🇧🇷', 'Brunei': '🇧🇳',
                'Bulgaria': '🇧🇬', 'Burkina Faso': '🇧🇫', 'Burundi': '🇧🇮', 'Cambodia': '🇰🇭',
                'Cameroon': '🇨🇲', 'Canada': '🇨🇦', 'Cape Verde': '🇨🇻', 'Central African Republic': '🇨🇫',
                'Chad': '🇹🇩', 'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴',
                'Comoros': '🇰🇲', 'Congo (Brazzaville)': '🇨🇬', 'Congo (Kinshasa)': '🇨🇩', 'Costa Rica': '🇨🇷',
                'Croatia': '🇭🇷', 'Cuba': '🇨🇺', 'Cyprus': '🇨🇾', 'Czech Republic': '🇨🇿',
                'Denmark': '🇩🇰', 'Djibouti': '🇩🇯', 'Dominica': '🇩🇲', 'Dominican Republic': '🇩🇴',
                'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'El Salvador': '🇸🇻', 'Equatorial Guinea': '🇬🇶',
                'Eritrea': '🇪🇷', 'Estonia': '🇪🇪', 'Eswatini': '🇸🇿', 'Ethiopia': '🇪🇹',
                'Fiji': '🇫🇯', 'Finland': '🇫🇮', 'France': '🇫🇷', 'Gabon': '🇬🇦',
                'Gambia': '🇬🇲', 'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭',
                'Greece': '🇬🇷', 'Greenland': '🇬🇱', 'Grenada': '🇬🇩', 'Guatemala': '🇬🇹',
                'Guinea': '🇬🇳', 'Guinea-Bissau': '🇬🇼', 'Guyana': '🇬🇾', 'Haiti': '🇭🇹',
                'Honduras': '🇭🇳', 'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺', 'Iceland': '🇮🇸',
                'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
                'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Jamaica': '🇯🇲',
                'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪',
                'Kiribati': '🇰🇮', 'Kuwait': '🇰🇼', 'Kyrgyzstan': '🇰🇬', 'Laos': '🇱🇦',
                'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Lesotho': '🇱🇸', 'Liberia': '🇱🇷',
                'Libya': '🇱🇾', 'Liechtenstein': '🇱🇮', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺',
                'Madagascar': '🇲🇬', 'Malawi': '🇲🇼', 'Malaysia': '🇲🇾', 'Maldives': '🇲🇻',
                'Mali': '🇲🇱', 'Malta': '🇲🇹', 'Mauritania': '🇲🇷', 'Mauritius': '🇲🇺',
                'Mexico': '🇲🇽', 'Moldova': '🇲🇩', 'Monaco': '🇲🇨', 'Mongolia': '🇲🇳',
                'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Mozambique': '🇲🇿', 'Myanmar': '🇲🇲',
                'Namibia': '🇳🇦', 'Nepal': '🇳🇵', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿',
                'Nicaragua': '🇳🇮', 'Niger': '🇳🇪', 'Nigeria': '🇳🇬', 'North Korea': '🇰🇵',
                'North Macedonia': '🇲🇰', 'Norway': '🇳🇴', 'Oman': '🇴🇲', 'Pakistan': '🇵🇰',
                'Palestine': '🇵🇸', 'Panama': '🇵🇦', 'Papua New Guinea': '🇵🇬', 'Paraguay': '🇵🇾',
                'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',
                'Qatar': '🇶🇦', 'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Rwanda': '🇷🇼',
                'Saint Kitts And Nevis': '🇰🇳', 'Saint Lucia': '🇱🇨', 'Saint Vincent And The Grenadines': '🇻🇨',
                'Samoa': '🇼🇸', 'San Marino': '🇸🇲', 'Saudi Arabia': '🇸🇦', 'Senegal': '🇸🇳',
                'Serbia': '🇷🇸', 'Seychelles': '🇸🇨', 'Sierra Leone': '🇸🇱', 'Singapore': '🇸🇬',
                'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'Solomon Islands': '🇸🇧', 'Somalia': '🇸🇴',
                'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'South Sudan': '🇸🇸', 'Spain': '🇪🇸',
                'Sri Lanka': '🇱🇰', 'Sudan': '🇸🇩', 'Suriname': '🇸🇷', 'Sweden': '🇸🇪',
                'Switzerland': '🇨🇭', 'Syria': '🇸🇾', 'Taiwan': '🇹🇼', 'Tajikistan': '🇹🇯',
                'Tanzania': '🇹🇿', 'Thailand': '🇹🇭', 'Timor-Leste': '🇹🇱', 'Togo': '🇹🇬',
                'Tonga': '🇹🇴', 'Trinidad And Tobago': '🇹🇹', 'Tunisia': '🇹🇳', 'Turkey': '🇹🇷',
                'Turkmenistan': '🇹🇲', 'Tuvalu': '🇹🇻', 'Uganda': '🇺🇬', 'Ukraine': '🇺🇦',
                'United Arab Emirates': '🇦🇪', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
                'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Vanuatu': '🇻🇺', 'Vatican City': '🇻🇦',
                'Venezuela': '🇻🇪', 'Vietnam': '🇻🇳', 'Yemen': '🇾🇪', 'Zambia': '🇿🇲',
                'Zimbabwe': '🇿🇼'
    };

export const API_PROVIDERS = {
    exchangeratehost: {
        name: 'ExchangeRate.host',
        baseUrl: 'https://api.exchangerate.host',
        rateLimit: 1000,
        available: true,
        corsEnabled: true
    },
    exchangerate: {
        name: 'ExchangeRate-API',
        baseUrl: 'https://api.exchangerate-api.com/v4',
        rateLimit: 1500,
        available: true,
        corsEnabled: true
    }
};
export const OVERLAY_COLORS = ['#34a853', '#ea4335', '#fbbc04', '#9c27b0', '#ff6b35'];

// Request throttling system
export const requestThrottle = {
    requests: new Map(),
    maxRequests: 10,
    timeWindow: 60000, // 1 minute
    
    canRequest: function(key = 'default') {
        const now = Date.now();
        const windowStart = now - this.timeWindow;
        
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }
        
        const keyRequests = this.requests.get(key);
        const validRequests = keyRequests.filter(time => time > windowStart);
        this.requests.set(key, validRequests);
        
        if (validRequests.length >= this.maxRequests) {
            console.warn(`Request throttled for ${key}. Max ${this.maxRequests} requests per minute.`);
            return false;
        }
        
        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }
};