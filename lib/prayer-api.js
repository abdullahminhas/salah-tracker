/**
 * Client-side utility functions for interacting with the Prayer API
 * Use these functions in your React components to save/fetch prayer data
 */

/**
 * Get authentication token from localStorage
 * @returns {string|null} Token or null if not found
 */
function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Get headers with authentication token
 * @returns {Object} Headers object with Content-Type and Authorization
 */
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Save prayer data to MongoDB
 * @param {Object} prayerData - The prayer data object (from generatePrayerData)
 * @returns {Promise<Object>} Response from the API
 */
export async function savePrayerData(prayerData) {
  try {
    const response = await fetch("/api/prayers", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(prayerData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save prayer data");
    }

    return data;
  } catch (error) {
    console.error("Error saving prayer data:", error);
    throw error;
  }
}

/**
 * Get prayer data for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Prayer data or null if not found
 * Note: Email is automatically extracted from JWT token on the server
 */
export async function getPrayerData(date) {
  try {
    const url = `/api/prayers?date=${date}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    // Handle 401 (Unauthorized) - user not logged in
    if (response.status === 401) {
      console.log("ℹ️ User not authenticated, returning null");
      return null;
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    // Console log the API response
    console.log(
      "📥 API Response for prayer data:",
      JSON.stringify(data, null, 2)
    );
    console.log("📥 API Response (raw):", data);

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch prayer data");
    }

    // Return null if no data found, otherwise return the data
    const result = data.data || null;
    console.log("📥 Processed prayer data result:", result);
    return result;
  } catch (error) {
    console.error("Error fetching prayer data:", error);
    // If it's a 401, return null instead of throwing
    if (error.message && error.message.includes("401")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get today's prayer data
 * @returns {Promise<Object|null>} Today's prayer data or null if not found
 * Note: Email is automatically extracted from JWT token on the server
 */
export async function getTodayPrayers() {
  const today = new Date().toISOString().split("T")[0];
  return await getPrayerData(today);
}

/**
 * Get prayer data by date using the dynamic route
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Prayer data or null if not found
 */
export async function getPrayerByDate(date) {
  try {
    const response = await fetch(`/api/prayers/${date}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || "Failed to fetch prayer data");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching prayer data:", error);
    throw error;
  }
}

/**
 * Update prayer data for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {Object} prayerData - The prayer data object
 * @returns {Promise<Object>} Updated prayer data
 */
export async function updatePrayerData(date, prayerData) {
  try {
    const response = await fetch(`/api/prayers/${date}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ prayers: prayerData.prayers }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update prayer data");
    }

    return data.data;
  } catch (error) {
    console.error("Error updating prayer data:", error);
    throw error;
  }
}

/**
 * Delete prayer data for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePrayerData(date) {
  try {
    const response = await fetch(`/api/prayers/${date}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete prayer data");
    }

    return true;
  } catch (error) {
    console.error("Error deleting prayer data:", error);
    throw error;
  }
}

/**
 * Get prayer statistics
 * @param {Object} options - Optional filters
 * @param {string} options.startDate - Start date in YYYY-MM-DD format
 * @param {string} options.endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Statistics object
 */
export async function getPrayerStats(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.startDate) params.append("startDate", options.startDate);
    if (options.endDate) params.append("endDate", options.endDate);

    const url = `/api/prayers/stats${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch statistics");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
}

/**
 * Get last 7 days of prayer data (including today)
 * @returns {Promise<Array>} Array of last 7 days data with completion percentages
 */
export async function getLast7DaysPrayers() {
  try {
    const response = await fetch("/api/prayers/last7days", {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch last 7 days prayers");
    }

    return data.data || [];
  } catch (error) {
    console.error("Error fetching last 7 days prayers:", error);
    throw error;
  }
}

/**
 * Get prayer data for a specific month
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12, where 1 = January, 12 = December)
 * @returns {Promise<Array>} Array of all days in the month with completion percentages
 */
export async function getMonthPrayers(year, month) {
  try {
    const response = await fetch(
      `/api/prayers/month?year=${year}&month=${month}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch month prayers");
    }

    return data.data || [];
  } catch (error) {
    console.error("Error fetching month prayers:", error);
    throw error;
  }
}

/**
 * Get total expected prayers since user registration
 * @returns {Promise<Object>} Object containing totalExpectedPrayers, totalDays, and registrationDate
 */
export async function getTotalExpectedPrayers() {
  try {
    const response = await fetch("/api/prayers/total-expected", {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch total expected prayers");
    }

    return data.data || null;
  } catch (error) {
    console.error("Error fetching total expected prayers:", error);
    throw error;
  }
}
