"use client";

import { useState, useEffect } from "react";
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
  const [showJumma, setShowJumma] = useState(false);

  // Load values from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMadhab = localStorage.getItem("madhab") || "Hanbali";
      const savedShowJumma = localStorage.getItem("showJumma") === "true";
      setMadhab(savedMadhab);
      setShowJumma(savedShowJumma);
    }
  }, []);

  // Save madhab to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("madhab", madhab);
    }
  }, [madhab]);

  // Save showJumma to localStorage and dispatch event
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showJumma", showJumma.toString());
      // Dispatch a custom event to notify other components/tabs
      window.dispatchEvent(
        new CustomEvent("showJummaChange", {
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
                  Instead of showing Dhuhr, Jumma will be shown instead on
                  friday.
                </p>
              </div>
              <Switch
                id="jumma-switch"
                checked={showJumma}
                onCheckedChange={setShowJumma}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
