"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Car, CarFront, LayoutDashboard, LogOut, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Özet", icon: LayoutDashboard },
  { href: "/vehicles", label: "Araçlar", icon: Car },
  { href: "/logs", label: "Kiralamalar", icon: CalendarDays },
  { href: "/customers", label: "Customers", icon: Users },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/vehicles") return pathname === "/vehicles" || pathname.startsWith("/vehicles/");
  if (href === "/customers") return pathname === "/customers" || pathname.startsWith("/customers/");
  if (href === "/logs") return pathname === "/logs" || pathname.startsWith("/logs/");
  return false;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      toast.success("Çıkış yapıldı");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Çıkış sırasında hata");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-card/50 sm:flex">
        <Link href="/dashboard" className="flex h-12 items-center gap-2 border-b border-border px-4 hover:bg-muted/50">
          <CarFront className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight">AlgoryRent</p>
            <p className="truncate text-[10px] text-muted-foreground">Yönetim paneli</p>
          </div>
        </Link>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-11 items-center justify-between gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:hidden">
          <div className="flex items-center gap-2">
            <CarFront className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">AlgoryRent</span>
          </div>
          <div className="flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = isNavActive(pathname, href);
              return (
                <Button key={href} variant={active ? "secondary" : "ghost"} size="sm" className="h-8 px-2 text-xs" asChild>
                  <Link href={href}>{label}</Link>
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => void logout()} aria-label="Çıkış">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <header className="sticky top-0 z-30 hidden h-11 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur sm:flex">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void logout()}>
            <LogOut className="h-3.5 w-3.5" />
            Çıkış
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
