"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  // Initialize with default values to avoid hydration mismatch
  const [madhab, setMadhab] = useState("Hanbali");
  const [showJumma, setShowJumma] = useState(null);
  const hasLoadedFromStorage = useRef(false);

  // Load values from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMadhab = localStorage.getItem("madhab") || "Hanbali";
      const savedShowJumma = localStorage.getItem("showJumma");
      // If localStorage has a value, use it; otherwise default to true
      const showJummaValue =
        savedShowJumma !== null ? savedShowJumma === "true" : true;
      setMadhab(savedMadhab);
      setShowJumma(showJummaValue);
      // Mark that we've loaded from storage
      hasLoadedFromStorage.current = true;
    }
  }, []);

  // Listen for changes to madhab from other tabs or components
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

  // Listen for changes to showJumma from other tabs or components
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

  // Save madhab to localStorage and dispatch event (only after initial load)
  useEffect(() => {
    if (typeof window !== "undefined" && hasLoadedFromStorage.current) {
      localStorage.setItem("madhab", madhab);
      // Dispatch a custom event to notify other components in the same tab
      window.dispatchEvent(
        new CustomEvent("madhabChanged", {
          detail: { key: "madhab", value: madhab },
        })
      );
    }
  }, [madhab]);

  // Save showJumma to localStorage and dispatch event (only after initial load)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      hasLoadedFromStorage.current &&
      showJumma !== null
    ) {
      localStorage.setItem("showJumma", showJumma.toString());
      // Dispatch a custom event to notify other components in the same tab
      window.dispatchEvent(
        new CustomEvent("showJummaChanged", {
          detail: { key: "showJumma", value: showJumma },
        })
      );
    }
  }, [showJumma]);

  return (
    <div className="bg-muted min-h-full">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* First Row: Madhab */}
            <div className="flex items-center justify-between">
              <Label htmlFor="madhab-select" className="text-sm font-medium">
                Madhab
              </Label>
              <Select value={madhab} onValueChange={setMadhab}>
                <SelectTrigger id="madhab-select" className="w-[140px]">
                  <SelectValue placeholder="Select madhab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hanafi">Hanafi</SelectItem>
                  <SelectItem value="Shafi">Shafi</SelectItem>
                  <SelectItem value="Maliki">Maliki</SelectItem>
                  <SelectItem value="Hanbali">Hanbali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second Row: Show Jumma */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <Label htmlFor="jumma-switch" className="text-sm font-semibold">
                  Show Jumma
                </Label>
                <p className="text-xs text-muted-foreground">
                  On Fridays, Jumma will be displayed in place of Dhuhr.
                </p>
              </div>
              <Switch
                id="jumma-switch"
                checked={showJumma ?? true}
                onCheckedChange={setShowJumma}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
