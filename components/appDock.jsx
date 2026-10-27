import react, { useEffect, useState } from "react";
import { Home, Settings, Calendar, Sun, Moon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Dock, DockIcon } from "@/components/ui/dock";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

export function AppDock() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      const footer = document.getElementById("footer");

      if (!footer) return;

      const footerTop = footer.getBoundingClientRect().top;
      const footerVisible = footerTop <= window.innerHeight - 75;

      if (footerVisible) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-10 z-30 mx-auto mb-4 flex origin-bottom h-full max-h-14",
        "transition-transform duration-300 ease-out",
        hidden && "translate-y-[calc(100%+1rem)]",
      )}
    >
      <div className="fixed bottom-0 inset-x-0 h-16 w-full bg-background to-transparent backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_top,black,transparent)] dark:bg-background"></div>
      {mounted && (
        <Dock className="z-50 pointer-events-auto relative flex min-h-full h-full items-center px-1 bg-background transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)]  ">
          {/* [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] */}
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12",
                  )}
                >
                  <Home
                    className={
                      pathname === "/"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          {isAuthenticated && (
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/prayerProgress"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12",
                    )}
                  >
                    <Calendar
                      className={
                        pathname === "/prayerProgress"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Prayer Progress</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          )}
          {/* <Separator orientation="vertical" className="h-full" /> */}
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12",
                  )}
                >
                  <Settings
                    className={
                      pathname === "/settings"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
          {/* <Separator orientation="vertical" className="h-full py-2" />
      <DockIcon>
        <Tooltip>
          <TooltipTrigger asChild>
          </TooltipTrigger>
          <TooltipContent>
            <p>Theme</p>
          </TooltipContent>
        </Tooltip>
      </DockIcon> */}
        </Dock>
      )}
    </div>
  );
}
