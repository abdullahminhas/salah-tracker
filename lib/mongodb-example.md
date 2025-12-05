# MongoDB Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salah-tracker?retryWrites=true&w=majority
```

## Folder Structure

```
salah-tracker/
├── lib/
│   └── mongodb.js          # MongoDB connection utility
├── models/
│   └── Prayer.js           # Mongoose schema/model
└── app/
    └── api/
        └── prayers/
            ├── route.js           # GET (all), POST (create)
            ├── [date]/
            │   └── route.js      # GET, PUT, DELETE (by date)
            └── stats/
                └── route.js      # GET (statistics)
```

## API Endpoints

### 1. Get All Prayers
```javascript
GET /api/prayers
GET /api/prayers?date=2024-01-15
```

### 2. Create/Update Prayer Entry
```javascript
POST /api/prayers
Body: {
  "date": "2024-01-15",
  "prayers": [
    {
      "name": "Fajr",
      "time": "5:30 AM",
      "offered": true,
      "offeredAt": "2024-01-15T05:30:00.000Z",
      "offeredAtTime": "05:30:00",
      "subPrayers": [
        { "rakat": "2 Rakats", "type": "Sunnat" },
        { "rakat": "2 Rakats", "type": "Farz" }
      ]
    }
  ]
}
```

### 3. Get Prayer by Date
```javascript
GET /api/prayers/2024-01-15
```

### 4. Update Prayer by Date
```javascript
PUT /api/prayers/2024-01-15
Body: {
  "prayers": [...]
}
```

### 5. Delete Prayer by Date
```javascript
DELETE /api/prayers/2024-01-15
```

### 6. Get Statistics
```javascript
GET /api/prayers/stats
GET /api/prayers/stats?startDate=2024-01-01&endDate=2024-01-31
```

## Usage Examples

### Client-Side Usage

```javascript
// Create/Update prayer entry
const savePrayer = async (prayerData) => {
  const response = await fetch('/api/prayers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prayerData),
  });
  return await response.json();
};

// Get prayers for a date
const getPrayers = async (date) => {
  const response = await fetch(`/api/prayers?date=${date}`);
  return await response.json();
};

// Get statistics
const getStats = async () => {
  const response = await fetch('/api/prayers/stats');
  return await response.json();
};
```

## Connection Caching

The `lib/mongodb.js` file uses global caching to prevent multiple connections:
- In development: Connection persists across hot reloads
- In production: Connection is reused across requests
- No reconnection on every API call

