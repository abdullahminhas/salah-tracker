"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { TodaysPrayers } from "@/components/TodaysPrayers";
import { ProgressSection } from "@/components/ProgressSection";
import { prayerSubPrayers, mainPrayers } from "@/components/constants";
import {
  savePrayerData,
  getLast7DaysPrayers,
  getTodayPrayers,
} from "@/lib/prayer-api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Get showJumma setting from localStorage (initialize after mount to avoid hydration issues)
  const [showJumma, setShowJumma] = useState(null);

  // Load showJumma from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showJumma");
      // If localStorage has a value, use it; otherwise default to true
      const showJummaValue = saved !== null ? saved === "true" : true;
      setShowJumma(showJummaValue);
    }
  }, []);

  // Listen for changes to showJumma setting
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleShowJummaChange = () => {
      const saved = localStorage.getItem("showJumma");
      const showJummaValue = saved !== null ? saved === "true" : true;
      setShowJumma(showJummaValue);
    };

    window.addEventListener("storage", handleShowJummaChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener("showJummaChanged", handleShowJummaChange);

    return () => {
      window.removeEventListener("storage", handleShowJummaChange);
      window.removeEventListener("showJummaChanged", handleShowJummaChange);
    };
  }, []);

  // Load madhab from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMadhab = localStorage.getItem("madhab") || "Hanbali";
      setMadhab(savedMadhab);
    }
  }, []);

  // Listen for changes to madhab setting
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMadhabChange = () => {
      const savedMadhab = localStorage.getItem("madhab") || "Hanbali";
      setMadhab(savedMadhab);
    };

    window.addEventListener("storage", handleMadhabChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener("madhabChanged", handleMadhabChange);

    return () => {
      window.removeEventListener("storage", handleMadhabChange);
      window.removeEventListener("madhabChanged", handleMadhabChange);
    };
  }, []);

  const [selectedPrayers, setSelectedPrayers] = useState({
    Tahajjud: false,
    Fajr: false,
    Dhuhr: false,
    Jumma: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  });

  // Initialize state for all sub-prayers
  const [subPrayers, setSubPrayers] = useState(() => {
    const initialState = {};
    Object.keys(prayerSubPrayers).forEach((prayerName) => {
      initialState[prayerName] = {};
      if (prayerName === "Tahajjud") {
        // Tahajjud has 6 checkmarks, each representing 2 rakats
        for (let i = 0; i < 6; i++) {
          initialState[prayerName][`tahajjud-${i}`] = false;
        }
      } else {
        prayerSubPrayers[prayerName].forEach((subPrayer, index) => {
          const subPrayerKey = `${subPrayer}-${index}`;
          initialState[prayerName][subPrayerKey] = false;
        });
      }
    });
    return initialState;
  });

  const [prayerTimes, setPrayerTimes] = useState({
    Fajr: "",
    Dhuhr: "",
    Jumma: "",
    Asr: "",
    Maghrib: "",
    Isha: "",
  });

  const [madhab, setMadhab] = useState("Hanbali");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [cityName, setCityName] = useState(null);
  const [prayerTimestamps, setPrayerTimestamps] = useState({});
  const [openAccordion, setOpenAccordion] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => {
    // Initialize with today's date string (YYYY-MM-DD)
    return new Date().toISOString().split("T")[0];
  });
  const [last7Days, setLast7Days] = useState([]);
  const [last7DaysLoading, setLast7DaysLoading] = useState(false);

  // Loading states for the 3 important APIs
  const [locationLoading, setLocationLoading] = useState(true);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [prayerDataLoading, setPrayerDataLoading] = useState(true);

  // Track if user has interacted with checkboxes (not initial load)
  const hasUserInteractedRef = useRef(false);

  // Refs to store latest state values for save function
  const selectedPrayersRef = useRef(selectedPrayers);
  const subPrayersRef = useRef(subPrayers);
  const prayerTimestampsRef = useRef(prayerTimestamps);

  // Update refs whenever state changes
  useEffect(() => {
    selectedPrayersRef.current = selectedPrayers;
  }, [selectedPrayers]);

  useEffect(() => {
    subPrayersRef.current = subPrayers;
  }, [subPrayers]);

  useEffect(() => {
    prayerTimestampsRef.current = prayerTimestamps;
  }, [prayerTimestamps]);

  // Reset all prayer states to initial values
  const resetPrayerStates = () => {
    setSelectedPrayers({
      Tahajjud: false,
      Fajr: false,
      Dhuhr: false,
      Jumma: false,
      Asr: false,
      Maghrib: false,
      Isha: false,
    });

    // Reset sub-prayers
    const resetSubPrayers = {};
    Object.keys(prayerSubPrayers).forEach((prayerName) => {
      resetSubPrayers[prayerName] = {};
      if (prayerName === "Tahajjud") {
        for (let i = 0; i < 6; i++) {
          resetSubPrayers[prayerName][`tahajjud-${i}`] = false;
        }
      } else {
        prayerSubPrayers[prayerName].forEach((subPrayer, index) => {
          const subPrayerKey = `${subPrayer}-${index}`;
          resetSubPrayers[prayerName][subPrayerKey] = false;
        });
      }
    });
    setSubPrayers(resetSubPrayers);
    setPrayerTimestamps({});
    setOpenAccordion(null);
    hasUserInteractedRef.current = false; // Reset interaction flag for new day
  };

  // Check if a new day has started and reset if needed
  useEffect(() => {
    const checkNewDay = () => {
      const today = new Date().toISOString().split("T")[0];

      // If the date has changed, reset everything
      if (currentDate !== today) {
        console.log(
          `🔄 New day detected! Resetting progress. Old date: ${currentDate}, New date: ${today}`
        );
        setCurrentDate(today);
        resetPrayerStates();
      }
    };

    // Check immediately
    checkNewDay();

    // Set up interval to check every minute (in case user keeps the page open overnight)
    const intervalId = setInterval(checkNewDay, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [currentDate]);

  // Get user's current location
  useEffect(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setLocationError(null);
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(
            "Unable to get your location. Using default coordinates."
          );
          // Fallback to default coordinates
          setLatitude("50.91406");
          setLongitude("-1.39783");
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError(
        "Geolocation is not supported by your browser. Using default coordinates."
      );
      setLatitude("50.91406");
      setLongitude("-1.39783");
      setLocationLoading(false);
    }
  }, []);

  // Fetch prayer times from API
  // This effect runs whenever madhab, latitude, or longitude changes
  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchPrayerTimes = async () => {
      setPrayerTimesLoading(true);
      try {
        console.log(`🕌 Fetching prayer times for madhab: ${madhab}`);
        const response = await fetch(
          `https://www.ummahapi.com/api/prayer-times?lat=${latitude}&lng=${longitude}&madhab=${madhab}&method=MuslimWorldLeague`
        );
        const data = await response.json();

        if (data.success && data.data && data.data.prayer_times) {
          const times = data.data.prayer_times;

          // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
          const formatTime = (time24) => {
            const [hours, minutes] = time24.split(":");
            const hour = parseInt(hours, 10);
            const period = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${period}`;
          };

          setPrayerTimes({
            Fajr: formatTime(times.fajr),
            Dhuhr: formatTime(times.dhuhr),
            Jumma: formatTime(times.dhuhr), // Jumma uses Dhuhr time
            Asr: formatTime(times.asr),
            Maghrib: formatTime(times.maghrib),
            Isha: formatTime(times.isha),
          });

          // Set current prayer from API response
          if (
            data.data.current_status &&
            data.data.current_status.current_prayer &&
            data.data.current_status.current_prayer !== "none"
          ) {
            const currentPrayerName = data.data.current_status.current_prayer;
            // Capitalize first letter
            setCurrentPrayer(
              currentPrayerName.charAt(0).toUpperCase() +
                currentPrayerName.slice(1)
            );
          } else {
            setCurrentPrayer(null);
          }

          console.log(`✅ Prayer times updated for madhab: ${madhab}`);
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
        // Keep default empty times on error
      } finally {
        setPrayerTimesLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [madhab, latitude, longitude]);

  // Fetch city name from coordinates using reverse geocoding
  useEffect(() => {
    if (!latitude || !longitude) return;

    const controller = new AbortController();
    let timeoutId;

    const fetchCityName = async () => {
      try {
        timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "SalahTracker/1.0", // Required by Nominatim
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.address) {
          // Try to get city name from various possible fields
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.municipality ||
            data.address.county ||
            data.address.state ||
            "";
          setCityName(city);
        }
      } catch (error) {
        // Silently handle errors - city name is not critical
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Error fetching city name:", error);
        }
        // Only update state if not aborted (component still mounted)
        if (!controller.signal.aborted) {
          setCityName(null);
        }
      }
    };

    fetchCityName();

    // Cleanup: abort fetch if component unmounts or dependencies change
    return () => {
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [latitude, longitude]);

  // Check if today is Friday (0 = Sunday, 5 = Friday)
  // Use currentDate to ensure consistency between server and client
  const isFriday = useMemo(() => {
    if (!currentDate) return false;
    const date = new Date(currentDate + "T00:00:00"); // Use currentDate string to avoid timezone issues
    return date.getDay() === 5; // Friday
  }, [currentDate]);

  // Fetch today's prayer data from database and restore state
  useEffect(() => {
    const loadTodayPrayers = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated || !user) {
        setPrayerDataLoading(false);
        return;
      }

      // Wait for prayer times to be available
      const hasPrayerTimes = Object.values(prayerTimes).some(
        (time) => time !== ""
      );
      if (!hasPrayerTimes) {
        // Don't set loading to false here - wait for prayer times to load first
        return;
      }

      setPrayerDataLoading(true);
      try {
        console.log("🔄 Fetching today's prayer data from API...");
        const todayData = await getTodayPrayers();

        console.log("📥 Today's prayer data received:", todayData);

        if (todayData && todayData.prayers && todayData.prayers.length > 0) {
          console.log(
            `✅ Found ${todayData.prayers.length} prayers to restore`
          );

          // Initialize restored states
          const restoredSelectedPrayers = {
            Tahajjud: false,
            Fajr: false,
            Dhuhr: false,
            Jumma: false,
            Asr: false,
            Maghrib: false,
            Isha: false,
          };

          const restoredSubPrayers = {};
          Object.keys(prayerSubPrayers).forEach((prayerName) => {
            restoredSubPrayers[prayerName] = {};
            if (prayerName === "Tahajjud") {
              for (let i = 0; i < 6; i++) {
                restoredSubPrayers[prayerName][`tahajjud-${i}`] = false;
              }
            } else {
              prayerSubPrayers[prayerName].forEach((subPrayer, index) => {
                const subPrayerKey = `${subPrayer}-${index}`;
                restoredSubPrayers[prayerName][subPrayerKey] = false;
              });
            }
          });

          const restoredTimestamps = {};

          // Restore each prayer from the database
          todayData.prayers.forEach((prayer) => {
            let prayerName = prayer.name;
            let uiPrayerName = prayer.name; // Name to use in UI state

            // Map Dhuhr/Jumma for UI display based on showJumma setting and whether it's Friday
            const shouldShowJumma = (showJumma ?? true) && isFriday;

            // If database has "Jumma" and we should show Jumma, use "Jumma" in UI
            // If database has "Jumma" but we shouldn't show Jumma, use "Dhuhr" in UI
            // If database has "Dhuhr" and we should show Jumma, use "Jumma" in UI
            // If database has "Dhuhr" and we shouldn't show Jumma, use "Dhuhr" in UI
            if (prayerName === "Jumma") {
              uiPrayerName = shouldShowJumma ? "Jumma" : "Dhuhr";
            } else if (prayerName === "Dhuhr") {
              uiPrayerName = shouldShowJumma ? "Jumma" : "Dhuhr";
            }

            // Mark prayer as selected using the UI prayer name
            if (uiPrayerName in restoredSelectedPrayers) {
              restoredSelectedPrayers[uiPrayerName] = true;
            }

            // Restore timestamp using UI prayer name
            if (prayer.offeredAt) {
              restoredTimestamps[uiPrayerName] = prayer.offeredAt;
            }

            // Restore sub-prayers using UI prayer name
            if (uiPrayerName === "Tahajjud") {
              // For Tahajjud, map rakats back to checkboxes
              if (prayer.subPrayers && prayer.subPrayers.length > 0) {
                const tahajjudSubPrayer = prayer.subPrayers[0];
                const rakats = parseInt(tahajjudSubPrayer.rakat);
                const checkboxIndex = rakats / 2 - 1;

                // Check all checkboxes up to the index
                for (let i = 0; i <= checkboxIndex && i < 6; i++) {
                  restoredSubPrayers["Tahajjud"][`tahajjud-${i}`] = true;
                }
              }
            } else {
              // For other prayers, map sub-prayers back to checkboxes
              // Use UI prayer name to get the correct sub-prayers list
              if (prayer.subPrayers && prayer.subPrayers.length > 0) {
                const subPrayersList = prayerSubPrayers[uiPrayerName] || [];

                prayer.subPrayers.forEach((subPrayer) => {
                  // Find matching sub-prayer in the list
                  subPrayersList.forEach((expectedSubPrayer, index) => {
                    const parts = expectedSubPrayer.split(" ");
                    const expectedRakatCount = parts[0];
                    const expectedType = parts.slice(1).join(" ");

                    // Match by rakat count and type
                    if (
                      subPrayer.rakat.includes(expectedRakatCount) &&
                      subPrayer.type === expectedType
                    ) {
                      const subPrayerKey = `${expectedSubPrayer}-${index}`;
                      restoredSubPrayers[uiPrayerName][subPrayerKey] = true;
                    }
                  });
                });
              }
            }
          });

          // Update all states with restored data
          setSelectedPrayers(restoredSelectedPrayers);
          setSubPrayers(restoredSubPrayers);
          setPrayerTimestamps(restoredTimestamps);

          console.log("✅ Today's prayers restored successfully");
          console.log("📋 Restored selected prayers:", restoredSelectedPrayers);
          console.log("📋 Restored sub-prayers:", restoredSubPrayers);
        } else {
          console.log("ℹ️ No prayers found for today");
        }
      } catch (error) {
        // Handle 401 (Unauthorized) gracefully - user not logged in
        if (error.message && error.message.includes("401")) {
          console.log("ℹ️ User not authenticated, skipping prayer data load");
        } else {
          console.error("❌ Error fetching today's prayers:", error);
        }
      } finally {
        setPrayerDataLoading(false);
        console.log("✅ Prayer data loading complete");
      }
    };

    loadTodayPrayers();
  }, [isAuthenticated, user, prayerTimes, showJumma, isFriday]); // Fetch when auth, prayer times, showJumma, or isFriday changes

  // Save prayer data whenever state changes (only after user interaction)
  useEffect(() => {
    // Only save if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Don't save on initial page load - only save when user actually interacts
    if (!hasUserInteractedRef.current) {
      return;
    }

    // Function to generate prayer data JSON
    const generatePrayerData = () => {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      const prayerData = {
        date: dateStr,
        email: user?.email || "", // Include email in JSON (will be validated/overridden by server from JWT)
        prayers: [],
      };

      // Check each prayer
      Object.keys(selectedPrayers).forEach((prayerName) => {
        if (selectedPrayers[prayerName]) {
          const timestamp =
            prayerTimestamps[prayerName] || new Date().toISOString();
          const timeStr = new Date(timestamp).toTimeString().split(" ")[0];

          const prayerInfo = {
            name: prayerName,
            time:
              prayerName === "Tahajjud" ? "" : prayerTimes[prayerName] || "",
            offered: true,
            offeredAt: timestamp,
            offeredAtTime: timeStr,
            subPrayers: [],
          };

          // Get sub-prayer details
          if (prayerName === "Tahajjud") {
            // For Tahajjud, find the highest checked index (last checkbox)
            let highestIndex = -1;
            for (let i = 0; i < 6; i++) {
              if (subPrayers["Tahajjud"]?.[`tahajjud-${i}`]) {
                highestIndex = i; // Keep updating to get the highest index
              }
            }
            // Only include the highest checked option (not all checked ones)
            if (highestIndex >= 0) {
              const rakats = (highestIndex + 1) * 2; // Each checkbox = 2 rakats
              prayerInfo.subPrayers = [
                {
                  rakat: `${rakats} Rakats`,
                  type: "Nafl",
                },
              ];
            }
          } else {
            // For other prayers, get checked sub-prayers
            const subPrayersList = prayerSubPrayers[prayerName] || [];
            subPrayersList.forEach((subPrayer, index) => {
              const subPrayerKey = `${subPrayer}-${index}`;
              if (subPrayers[prayerName]?.[subPrayerKey]) {
                const parts = subPrayer.split(" ");
                const rakatCount = parts[0];
                const rakatType = parts.slice(1).join(" ");
                prayerInfo.subPrayers.push({
                  rakat: `${rakatCount} Rakats`,
                  type: rakatType,
                });
              }
            });
          }

          prayerData.prayers.push(prayerInfo);
        }
      });

      return prayerData;
    };

    // Debounce: Wait 500ms after last change before saving
    const timeoutId = setTimeout(() => {
      // Use refs to get the latest state values (always up-to-date)
      const currentSelectedPrayers = selectedPrayersRef.current;
      const currentSubPrayers = subPrayersRef.current;
      const currentPrayerTimestamps = prayerTimestampsRef.current;

      // Generate prayer data with the latest state from refs
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      // Check if today is Friday
      const isFridayToday = today.getDay() === 5; // Friday
      const shouldShowJumma = (showJumma ?? true) && isFridayToday;

      const prayerData = {
        date: dateStr,
        email: user?.email || "",
        prayers: [],
      };

      // Check each prayer
      Object.keys(currentSelectedPrayers).forEach((prayerName) => {
        if (currentSelectedPrayers[prayerName]) {
          const timestamp =
            currentPrayerTimestamps[prayerName] || new Date().toISOString();
          const timeStr = new Date(timestamp).toTimeString().split(" ")[0];

          // Map prayer name for saving:
          // - If it's Friday and showJumma is true, and user clicked Jumma, save as "Jumma"
          // - If it's Friday and showJumma is true, and user clicked Dhuhr (shouldn't happen), skip it
          // - If it's not Friday or showJumma is false, and user clicked Dhuhr, save as "Dhuhr"
          // - If it's not Friday or showJumma is false, and user clicked Jumma (shouldn't happen), map to "Dhuhr"
          let savePrayerName = prayerName;
          if (shouldShowJumma && prayerName === "Dhuhr") {
            return; // Skip saving Dhuhr when Jumma is enabled and it's Friday
          }
          if (!shouldShowJumma && prayerName === "Jumma") {
            savePrayerName = "Dhuhr"; // Map Jumma to Dhuhr when it's not Friday or Jumma is disabled
          }
          // If shouldShowJumma is true and prayerName is "Jumma", save as "Jumma" (no mapping needed)

          const prayerInfo = {
            name: savePrayerName,
            time:
              savePrayerName === "Tahajjud"
                ? ""
                : prayerTimes[savePrayerName] || prayerTimes[prayerName] || "",
            offered: true,
            offeredAt: timestamp,
            offeredAtTime: timeStr,
            subPrayers: [],
          };

          // Get sub-prayer details
          // Use savePrayerName to get the correct sub-prayers list structure
          if (savePrayerName === "Tahajjud") {
            // For Tahajjud, find the highest checked index (last checkbox)
            let highestIndex = -1;
            for (let i = 0; i < 6; i++) {
              if (currentSubPrayers["Tahajjud"]?.[`tahajjud-${i}`]) {
                highestIndex = i;
              }
            }
            if (highestIndex >= 0) {
              const rakats = (highestIndex + 1) * 2;
              prayerInfo.subPrayers = [
                {
                  rakat: `${rakats} Rakats`,
                  type: "Nafl",
                },
              ];
            }
          } else {
            // For other prayers, get checked sub-prayers
            // Use savePrayerName to get the correct sub-prayers list (Dhuhr or Jumma)
            // But look up the state using the original prayerName (what user sees)
            const subPrayersList = prayerSubPrayers[savePrayerName] || [];
            subPrayersList.forEach((subPrayer, index) => {
              const subPrayerKey = `${subPrayer}-${index}`;
              // Look up in state using original prayerName (what user sees in UI)
              if (currentSubPrayers[prayerName]?.[subPrayerKey]) {
                const parts = subPrayer.split(" ");
                const rakatCount = parts[0];
                const rakatType = parts.slice(1).join(" ");
                prayerInfo.subPrayers.push({
                  rakat: `${rakatCount} Rakats`,
                  type: rakatType,
                });
              }
            });
          }

          prayerData.prayers.push(prayerInfo);
        }
      });

      // Console the JSON when a prayer is checked (or state changes)
      console.log(
        "📋 Prayer Data JSON (when prayer checked):",
        JSON.stringify(prayerData, null, 2)
      );
      console.log("📋 Prayer Data JSON (compact):", JSON.stringify(prayerData));
      console.log(
        "🔍 Debug - Current selectedPrayers:",
        currentSelectedPrayers
      );
      console.log("🔍 Debug - Current subPrayers:", currentSubPrayers);

      // Save prayer data to database
      savePrayerData(prayerData)
        .then((result) => {
          console.log("✅ Prayer data saved/updated in MongoDB:", result);

          // Refresh last 7 days data after saving
          getLast7DaysPrayers()
            .then((data) => {
              setLast7Days(data);
            })
            .catch((err) => {
              console.error("Error refreshing last 7 days:", err);
            });
        })
        .catch((error) => {
          console.error(
            "❌ Error saving/updating prayer data in MongoDB:",
            error
          );
        });
    }, 500); // 500ms debounce

    // Cleanup timeout on unmount or when dependencies change
    return () => clearTimeout(timeoutId);
  }, [
    subPrayers,
    selectedPrayers,
    prayerTimes,
    prayerTimestamps,
    isAuthenticated,
    user,
    showJumma,
  ]);

  // Get effective main prayers list (Jumma instead of Dhuhr if enabled AND it's Friday)
  const effectiveMainPrayers = useMemo(() => {
    const shouldShowJumma = (showJumma ?? true) && isFriday;
    if (shouldShowJumma) {
      return mainPrayers.filter((p) => p !== "Dhuhr");
    }
    return mainPrayers.filter((p) => p !== "Jumma");
  }, [showJumma, isFriday]);

  const prayers = useMemo(() => {
    const basePrayers = [
      { name: "Tahajjud", time: "" },
      { name: "Fajr", time: prayerTimes.Fajr },
    ];

    // Show Jumma only if showJumma is enabled AND it's Friday
    const shouldShowJumma = (showJumma ?? true) && isFriday;
    if (shouldShowJumma) {
      basePrayers.push({ name: "Jumma", time: prayerTimes.Jumma });
    } else {
      basePrayers.push({ name: "Dhuhr", time: prayerTimes.Dhuhr });
    }

    basePrayers.push(
      { name: "Asr", time: prayerTimes.Asr },
      { name: "Maghrib", time: prayerTimes.Maghrib },
      { name: "Isha", time: prayerTimes.Isha }
    );

    return basePrayers;
  }, [showJumma, isFriday, prayerTimes]);

  // Calculate progress: count selected prayers excluding Tahajjud (20% each)
  const selectedMainPrayersCount = effectiveMainPrayers.filter(
    (prayer) => selectedPrayers[prayer]
  ).length;
  const progress = selectedMainPrayersCount * 20;

  // Calculate completion percentage for each prayer (based on checked sub-prayers)
  const getPrayerCompletion = (prayerName) => {
    if (prayerName === "Tahajjud") {
      // Tahajjud: 100% if any checkbox is checked (since each represents 2 rakats)
      const hasAnyChecked = Array.from({ length: 6 }).some((_, index) => {
        return subPrayers["Tahajjud"]?.[`tahajjud-${index}`] || false;
      });
      return hasAnyChecked ? 100 : 0;
    }

    const subPrayersList = prayerSubPrayers[prayerName];
    if (subPrayersList.length === 0) return 0;

    const checkedCount = subPrayersList.filter((subPrayer, index) => {
      const subPrayerKey = `${subPrayer}-${index}`;
      return subPrayers[prayerName]?.[subPrayerKey] || false;
    }).length;

    return Math.round((checkedCount / subPrayersList.length) * 100);
  };

  // Calculate total completion across all prayers and sub-prayers
  const getTotalCompletion = () => {
    let totalSubPrayers = 0;
    let checkedSubPrayers = 0;

    effectiveMainPrayers.forEach((prayerName) => {
      const subPrayersList = prayerSubPrayers[prayerName];
      totalSubPrayers += subPrayersList.length;

      subPrayersList.forEach((subPrayer, index) => {
        const subPrayerKey = `${subPrayer}-${index}`;
        if (subPrayers[prayerName]?.[subPrayerKey]) {
          checkedSubPrayers++;
        }
      });
    });

    if (totalSubPrayers === 0) return 0;
    return Math.round((checkedSubPrayers / totalSubPrayers) * 100);
  };

  // Helper function to generate empty last 7 days data with zero progress
  const generateEmptyLast7Days = () => {
    const today = new Date();
    const days = [];

    // Get last 7 days including today (6 days ago to today = 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      days.push({
        date: date,
        dateStr: dateStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
        completion: 0,
        selectedCount: 0,
      });
    }

    return days;
  };

  // Fetch last 7 days data from API
  useEffect(() => {
    const fetchLast7Days = async () => {
      // If user is not authenticated, show empty last 7 days with zero progress
      if (!isAuthenticated || !user) {
        setLast7Days(generateEmptyLast7Days());
        return;
      }

      setLast7DaysLoading(true);
      try {
        const data = await getLast7DaysPrayers();
        // Ensure we have 7 days of data (with zero progress if missing)
        if (data && data.length > 0) {
          setLast7Days(data);
        } else {
          // Generate last 7 days with zero progress as fallback
          setLast7Days(generateEmptyLast7Days());
        }
      } catch (error) {
        console.error("Error fetching last 7 days:", error);
        // Generate last 7 days with zero progress as fallback
        setLast7Days(generateEmptyLast7Days());
      } finally {
        setLast7DaysLoading(false);
      }
    };

    fetchLast7Days();
  }, [isAuthenticated, user, currentDate]); // Re-fetch when auth or date changes

  // Update today's data in last7Days when selectedPrayers changes (for real-time updates)
  useEffect(() => {
    if (last7Days.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const selectedCount = effectiveMainPrayers.filter(
      (prayer) => selectedPrayers[prayer]
    ).length;

    setLast7Days((prev) =>
      prev.map((day) => {
        if (day.dateStr === today) {
          return {
            ...day,
            completion: selectedCount * 20,
            selectedCount,
          };
        }
        return day;
      })
    );
  }, [selectedPrayers, last7Days.length]);

  // Find Farz checkbox key for a prayer
  const findFarzKey = (prayerName) => {
    const subPrayersList = prayerSubPrayers[prayerName];
    const farzIndex = subPrayersList.findIndex((subPrayer) =>
      subPrayer.includes("Farz")
    );
    if (farzIndex !== -1) {
      return `${subPrayersList[farzIndex]}-${farzIndex}`;
    }
    return null;
  };

  // Check if Farz is checked for a prayer
  const isFarzChecked = (prayerName) => {
    const farzKey = findFarzKey(prayerName);
    if (!farzKey) return false;
    return subPrayers[prayerName]?.[farzKey] || false;
  };

  // Check if a sub-prayer comes before Farz
  const isBeforeFarz = (prayerName, subPrayerIndex) => {
    const subPrayersList = prayerSubPrayers[prayerName];
    const farzIndex = subPrayersList.findIndex((subPrayer) =>
      subPrayer.includes("Farz")
    );
    if (farzIndex === -1) return false; // No Farz found
    return subPrayerIndex < farzIndex;
  };

  // Helper function to set selected prayer and record timestamp
  const setSelectedPrayerWithTimestamp = (prayerName, isSelected) => {
    hasUserInteractedRef.current = true; // Mark that user has interacted
    setSelectedPrayers((prev) => {
      const updated = {
        ...prev,
        [prayerName]: isSelected,
      };

      // Console the JSON immediately when prayer is checked
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const tempPrayerData = {
        date: dateStr,
        email: user?.email || "",
        prayers: [],
      };

      // Generate prayer data with updated state
      Object.keys(updated).forEach((name) => {
        if (updated[name]) {
          const timestamp = prayerTimestamps[name] || new Date().toISOString();
          const timeStr = new Date(timestamp).toTimeString().split(" ")[0];

          const prayerInfo = {
            name: name,
            time: name === "Tahajjud" ? "" : prayerTimes[name] || "",
            offered: true,
            offeredAt: timestamp,
            offeredAtTime: timeStr,
            subPrayers: [],
          };

          // Get sub-prayer details
          if (name === "Tahajjud") {
            let highestIndex = -1;
            for (let i = 0; i < 6; i++) {
              if (subPrayers["Tahajjud"]?.[`tahajjud-${i}`]) {
                highestIndex = i;
              }
            }
            if (highestIndex >= 0) {
              const rakats = (highestIndex + 1) * 2;
              prayerInfo.subPrayers = [
                {
                  rakat: `${rakats} Rakats`,
                  type: "Nafl",
                },
              ];
            }
          } else {
            const subPrayersList = prayerSubPrayers[name] || [];
            subPrayersList.forEach((subPrayer, index) => {
              const subPrayerKey = `${subPrayer}-${index}`;
              if (subPrayers[name]?.[subPrayerKey]) {
                const parts = subPrayer.split(" ");
                const rakatCount = parts[0];
                const rakatType = parts.slice(1).join(" ");
                prayerInfo.subPrayers.push({
                  rakat: `${rakatCount} Rakats`,
                  type: rakatType,
                });
              }
            });
          }

          tempPrayerData.prayers.push(prayerInfo);
        }
      });

      console.log(
        "✅ Prayer checked:",
        prayerName,
        isSelected ? "SELECTED" : "UNSELECTED"
      );
      console.log(
        "📋 Current Prayer Data JSON:",
        JSON.stringify(tempPrayerData, null, 2)
      );

      return updated;
    });

    // Record timestamp when prayer is selected
    if (isSelected) {
      setPrayerTimestamps((prev) => ({
        ...prev,
        [prayerName]: new Date().toISOString(),
      }));
    } else {
      // Remove timestamp when prayer is deselected
      setPrayerTimestamps((prev) => {
        const updated = { ...prev };
        delete updated[prayerName];
        return updated;
      });
    }
  };

  const handleAccordionChange = (value) => {
    setOpenAccordion(value);

    // Auto-select Farz checkbox when accordion opens
    if (value && value !== "Tahajjud") {
      const farzKey = findFarzKey(value);
      if (farzKey && !subPrayers[value]?.[farzKey]) {
        setSubPrayers((prev) => ({
          ...prev,
          [value]: {
            ...prev[value],
            [farzKey]: true,
          },
        }));

        // Show toast when Farz is auto-selected
        const subPrayersList = prayerSubPrayers[value] || [];
        const farzIndex = subPrayersList.findIndex((sp) => sp.includes("Farz"));
        if (farzIndex !== -1) {
          const farzSubPrayer = subPrayersList[farzIndex];
          const parts = farzSubPrayer.split(" ");
          const rakatCount = parts[0];
          const rakatType = parts.slice(1).join(" ");
          toast.success(
            `${value}, ${rakatType} (${rakatCount} Rakats) offered.`
          );
        }
      }

      // Mark prayer as selected when accordion opens
      if (!selectedPrayers[value]) {
        setSelectedPrayerWithTimestamp(value, true);
      }
    }
  };

  const toggleTahajjud = (index) => {
    hasUserInteractedRef.current = true; // Mark that user has interacted
    const tahajjudKey = `tahajjud-${index}`;
    const isCurrentlyChecked = subPrayers["Tahajjud"]?.[tahajjudKey] || false;

    setSubPrayers((prev) => {
      const updated = { ...prev["Tahajjud"] };

      if (isCurrentlyChecked) {
        // If unchecking, uncheck this and all subsequent checkboxes
        for (let i = index; i <= 5; i++) {
          updated[`tahajjud-${i}`] = false;
        }
      } else {
        // If checking, check this and all previous checkboxes (0 to index)
        // Show toast for each newly checked checkbox
        for (let i = 0; i <= index; i++) {
          const wasChecked = prev[`tahajjud-${i}`] || false;
          updated[`tahajjud-${i}`] = true;

          // Show toast only for newly checked checkboxes
          if (!wasChecked) {
            const rakats = (i + 1) * 2; // Each checkbox = 2 rakats
            toast.success(`Tahajjud, Nafl (${rakats} Rakats) offered.`);
          }
        }
      }

      // Check if any checkmark will be checked after this update
      const hasAnyChecked = Object.values(updated).some((checked) => checked);
      setSelectedPrayerWithTimestamp("Tahajjud", hasAnyChecked);

      return {
        ...prev,
        Tahajjud: updated,
      };
    });
  };

  const toggleSubPrayer = (prayerName, subPrayerKey, subPrayerIndex) => {
    hasUserInteractedRef.current = true; // Mark that user has interacted
    const isCurrentlyChecked = subPrayers[prayerName]?.[subPrayerKey] || false;
    const isFarzCheckbox = subPrayerKey.includes("Farz");
    const beforeFarz = isBeforeFarz(prayerName, subPrayerIndex);

    // Allow checking sub-prayers before Farz, or Farz itself
    // Disable sub-prayers after Farz if Farz is not checked
    if (!isFarzCheckbox && !beforeFarz && !isFarzChecked(prayerName)) {
      return;
    }

    // If unchecking Farz checkbox, uncheck all sub-prayers after Farz and deselect prayer
    if (isFarzCheckbox && isCurrentlyChecked && prayerName !== "Tahajjud") {
      // Uncheck all sub-prayers after Farz
      setSubPrayers((prev) => {
        const updated = { ...prev[prayerName] };
        const subPrayersList = prayerSubPrayers[prayerName];
        const farzIndex = subPrayersList.findIndex((sp) => sp.includes("Farz"));

        subPrayersList.forEach((subPrayer, idx) => {
          if (idx > farzIndex) {
            const key = `${subPrayer}-${idx}`;
            updated[key] = false;
          }
        });
        updated[subPrayerKey] = false; // Uncheck Farz itself

        return {
          ...prev,
          [prayerName]: updated,
        };
      });

      // Uncheck the prayer
      setSelectedPrayerWithTimestamp(prayerName, false);
    } else {
      // Normal toggle
      setSubPrayers((prev) => ({
        ...prev,
        [prayerName]: {
          ...prev[prayerName],
          [subPrayerKey]: !isCurrentlyChecked,
        },
      }));

      // If checking Farz checkbox, also select the prayer
      if (isFarzCheckbox && !isCurrentlyChecked && prayerName !== "Tahajjud") {
        setSelectedPrayerWithTimestamp(prayerName, true);
      }

      // Show toast notification when checking a sub-prayer
      if (!isCurrentlyChecked) {
        // Extract rakat count and type from subPrayerKey
        const subPrayersList = prayerSubPrayers[prayerName] || [];
        const subPrayer = subPrayersList[subPrayerIndex];
        if (subPrayer) {
          const parts = subPrayer.split(" ");
          const rakatCount = parts[0];
          const rakatType = parts.slice(1).join(" ");
          toast.success(
            `${prayerName}, ${rakatType} (${rakatCount} Rakats) offered.`
          );
        }
      }
    }
  };

  // Check if any API is still loading
  const isLoading = locationLoading || prayerTimesLoading || prayerDataLoading;

  return (
    <>
      {/* Loading Screen with Backdrop Blur */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-foreground">
              Loading prayer data...
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Today's Prayers (6 columns) */}
          <div className="col-span-12 lg:col-span-6">
            <BlurFade delay={0.25} inView>
              <TodaysPrayers
                madhab={madhab}
                setMadhab={setMadhab}
                cityName={cityName}
                locationError={locationError}
                progress={progress}
                prayers={prayers}
                currentPrayer={currentPrayer}
                openAccordion={openAccordion}
                subPrayers={subPrayers}
                getPrayerCompletion={getPrayerCompletion}
                isFarzChecked={isFarzChecked}
                isBeforeFarz={isBeforeFarz}
                onAccordionChange={handleAccordionChange}
                onToggleSubPrayer={toggleSubPrayer}
                onToggleTahajjud={toggleTahajjud}
              />
            </BlurFade>
          </div>

          {/* Right Column - Progress and Stats (6 columns) */}
          <div className="col-span-12 lg:col-span-6">
            <BlurFade delay={0.25 * 2} inView>
              <ProgressSection
                getPrayerCompletion={getPrayerCompletion}
                getTotalCompletion={getTotalCompletion}
                last7Days={last7Days}
                showJumma={showJumma}
                isFriday={isFriday}
              />
            </BlurFade>
          </div>
          <div className="col-span-12 lg:col-span-12">
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                This feature is intended solely to help you track your prayers
                and maintain consistency. All prayers are for Allah alone.
              </p>
              <p className="text-xs text-muted-foreground">
                Developed by{" "}
                <a
                  href="https://abdullahminhas.github.io"
                  target="_blank"
                  className="text-primary underline"
                >
                  Abdullah Minhas
                </a>{" "}
                ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
