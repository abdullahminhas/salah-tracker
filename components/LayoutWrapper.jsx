"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { AppDock } from "./appDock";

export function LayoutWrapper({ children }) {
  return (
    <SidebarProvider>
      {/* <AppSidebar /> */}
      <AppDock />
      <SidebarInset>
        {/* <Navbar /> */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
