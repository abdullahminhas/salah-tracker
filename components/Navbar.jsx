"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { theme, setTheme } = useTheme();
  const handleAuthSuccess = () => {
    setOpen(false);
    setShowSignup(false);
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full cursor-pointer"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar>
                      <AvatarImage src="" alt={user?.name || "User"} />
                      <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="capitalize">
                      {user?.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      Profile
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem>Billing</DropdownMenuItem> */}
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Dialog
                  open={open}
                  onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    // Reset to login form when dialog closes
                    if (!isOpen) {
                      setShowSignup(false);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">Login</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[99vh] p-0 overflow-y-auto">
                    <DialogTitle className="sr-only">
                      {showSignup
                        ? "Create your Salah Tracker account"
                        : "Login to your Salah Tracker account"}
                    </DialogTitle>
                    {showSignup ? (
                      <SignupForm
                        onSwitchToLogin={() => setShowSignup(false)}
                        onSignupSuccess={handleAuthSuccess}
                      />
                    ) : (
                      <LoginForm
                        onSwitchToSignup={() => setShowSignup(true)}
                        onLoginSuccess={handleAuthSuccess}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
