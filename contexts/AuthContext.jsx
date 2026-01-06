"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Set cookie for middleware authentication (7 days expiry)
          document.cookie = `token=${storedToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Clear cookie
        document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    // Set cookie for middleware authentication (7 days expiry)
    if (typeof document !== "undefined") {
      document.cookie = `token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cookie for middleware authentication
    if (typeof document !== "undefined") {
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

