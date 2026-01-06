"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, authLoading, router]);

  // Show nothing while checking authentication or redirecting
  if (authLoading || !isAuthenticated) {
    return null;
  }

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Fetch fresh user data from the API
        const response = await fetch("/api/user/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success && data.data) {
          setName(data.data.name || "");
          if (data.data.dateOfBirth) {
            setDateOfBirth(new Date(data.data.dateOfBirth));
          } else {
            setDateOfBirth(null);
          }
        } else {
          // Fallback to user from context
          setName(user.name || "");
          if (user.dateOfBirth) {
            setDateOfBirth(new Date(user.dateOfBirth));
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to user from context
        setName(user.name || "");
        if (user.dateOfBirth) {
          setDateOfBirth(new Date(user.dateOfBirth));
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to update your profile");
        setLoading(false);
        return;
      }

      // Ensure dateOfBirth is always included in the request body
      // Convert Date object to "YYYY-MM-DD" format, or send null if not set
      const requestBody = {
        name: name.trim(),
        dateOfBirth: dateOfBirth
          ? dateOfBirth.toISOString().split("T")[0]
          : null,
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      if (data.success) {
        toast.success("Profile updated successfully!");

        // Update local state with the response data (already includes updated data)
        if (data.data) {
          setName(data.data.name || "");
          if (data.data.dateOfBirth) {
            setDateOfBirth(new Date(data.data.dateOfBirth));
          } else {
            setDateOfBirth(null);
          }
        }
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted min-h-full">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Account</h1>
            <p className="text-muted-foreground">
              Update your account settings. Set your preferred language and
              timezone.
            </p>
          </div>

          <div className="border-t" />

          {/* Form */}
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the name that will be displayed on your profile and
                    in emails.
                  </p>
                </div>

                {/* Date of Birth Field */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateOfBirth"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? (
                          format(dateOfBirth, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        initialFocus
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground">
                    Your date of birth is used to calculate your age.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
