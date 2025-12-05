"use client";

import { useState } from "react";
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

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

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
                    {/* <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Team</DropdownMenuItem>
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
