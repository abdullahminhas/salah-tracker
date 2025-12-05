# MongoDB Integration Example

## How to Integrate MongoDB with Your Existing Code

### Step 1: Update `app/page.js` to Save to MongoDB

In your `app/page.js` file, you can replace the `console.log` with an actual API call to save the data:

```javascript
// At the top of the file, import the utility function
import { savePrayerData } from "@/lib/prayer-api";

// In your useEffect where you generate prayer data, replace console.log with:
useEffect(() => {
  const generatePrayerData = () => {
    // ... your existing code ...
    
    // Instead of: console.log("Prayer Data JSON:", JSON.stringify(prayerData, null, 2));
    // Use this:
    savePrayerData(prayerData)
      .then((result) => {
        console.log("✅ Prayer data saved to MongoDB:", result);
      })
      .catch((error) => {
        console.error("❌ Error saving prayer data:", error);
      });
    
    return prayerData;
  };

  // ... rest of your code ...
}, [subPrayers, selectedPrayers, prayerTimes, prayerTimestamps]);
```

### Step 2: Load Prayer Data on Page Load

Add this useEffect to load existing prayer data when the page loads:

```javascript
// Load existing prayer data for today
useEffect(() => {
  const loadTodayPrayers = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const data = await getPrayerData(today);
      if (data && data.prayers) {
        // Restore prayer states from database
        // You'll need to map the data back to your state
        console.log("Loaded prayer data:", data);
      }
    } catch (error) {
      console.error("Error loading prayer data:", error);
    }
  };

  loadTodayPrayers();
}, []);
```

### Step 3: Load Prayer Data for Calendar Dates

In your `prayerProgress/page.js`, you can load data for specific dates:

```javascript
import { getPrayerByDate } from "@/lib/prayer-api";

// In your component
useEffect(() => {
  const loadPrayerData = async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const date = searchParams.get("date");
    
    if (date) {
      try {
        const data = await getPrayerByDate(date);
        if (data) {
          // Display the prayer data for this date
          console.log("Prayer data for", date, ":", data);
        }
      } catch (error) {
        console.error("Error loading prayer data:", error);
      }
    }
  };

  loadPrayerData();
}, []);
```

### Step 4: Environment Setup

1. Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/salah-tracker?retryWrites=true&w=majority
```

2. Get your MongoDB connection string from:
   - **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
   - **Local MongoDB**: `mongodb://localhost:27017/salah-tracker`

### Step 5: Test the API

You can test the API endpoints using:

```bash
# Get all prayers
curl http://localhost:3000/api/prayers

# Get prayers for a specific date
curl http://localhost:3000/api/prayers?date=2024-01-15

# Create/Update prayer entry
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

# Get statistics
curl http://localhost:3000/api/prayers/stats
```

## Complete Example: Auto-Save on Prayer Update

Here's a complete example of how to automatically save prayer data whenever it changes:

```javascript
import { savePrayerData } from "@/lib/prayer-api";

// In your component
useEffect(() => {
  const generateAndSavePrayerData = async () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const prayerData = {
      date: dateStr,
      prayers: [],
    };

    // ... your existing prayer data generation logic ...

    // Save to MongoDB
    try {
      await savePrayerData(prayerData);
      console.log("✅ Prayer data saved successfully");
    } catch (error) {
      console.error("❌ Failed to save prayer data:", error);
    }
  };

  // Only save if there are prayers selected
  const hasSelectedPrayer = Object.values(selectedPrayers).some(
    (selected) => selected
  );

  if (hasSelectedPrayer) {
    generateAndSavePrayerData();
  }
}, [subPrayers, selectedPrayers, prayerTimes, prayerTimestamps]);
```

## Notes

- The MongoDB connection is cached globally, so you won't have connection issues
- All API routes are in the `app/api` directory (Next.js App Router style)
- The Prayer model includes timestamps (createdAt, updatedAt) automatically
- The date field is indexed for faster queries

