# MongoDB Setup - Prayer Data API

## Database Configuration

- **Cluster**: salah-tracker
- **Database**: salah-tracker
- **Collection**: salah

## API Endpoint

### POST `/api/prayers` - Save Prayer Data

This endpoint automatically saves prayer data to MongoDB whenever prayers are updated in your app.

**Request Body:**
```json
{
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

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "date": "2024-01-15",
    "prayers": [...],
    "createdAt": "2024-01-15T...",
    "updatedAt": "2024-01-15T..."
  }
}
```

## How It Works

1. **Automatic Saving**: When you select prayers in the app, the data is automatically saved to MongoDB
2. **Update on Change**: If a prayer entry already exists for a date, it gets updated instead of creating a duplicate
3. **Collection Name**: Data is saved to the `salah` collection in the `salah-tracker` database

## Testing

### Test the API directly:

```bash
# Save prayer data
curl -X POST http://localhost:3000/api/prayers \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Test the connection:

```bash
# Test MongoDB connection
curl http://localhost:3000/api/test-db
```

## Integration

The app automatically saves prayer data when:
- A prayer is selected/deselected
- Sub-prayers are checked/unchecked
- Prayer timestamps are updated

Check the browser console to see:
- ✅ "Prayer data saved to MongoDB" - Success message
- ❌ "Error saving prayer data to MongoDB" - Error message

## View Data in MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Navigate to your cluster: **salah-tracker**
3. Click "Browse Collections"
4. Select database: **salah-tracker**
5. Select collection: **salah**
6. View your saved prayer data!

