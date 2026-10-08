"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/config/nav";
import type { Permission } from "@/config/permissions";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

interface SidebarProps {
  isSuper: boolean;
  permissions: Permission[];
  adminName: string;
  roleName: string;
}

// Sidebar navigation renders dynamically based on the logged-in admin's
// resolved permission set — someone without team.manage simply never sees
// a "Team" item in their sidebar.
//
// Responsive audit fix: below the `desktop` breakpoint (1024px, same
// convention the public Navbar uses) there's no room for a persistent
// 240px-wide sidebar next to page content, so it collapses into a top bar
// with a hamburger-toggled nav drawer instead. The persistent aside is kept
// for desktop/wide and simply hidden below that; nothing about its content
// or permission filtering changed, only how it's presented at narrow
// viewports.
export function Sidebar({ isSuper, permissions, adminName, roleName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const permissionSet = new Set(permissions);
  const visibleItems = ADMIN_NAV.filter((item) => {
    if (isSuper) return true;
    if (item.superOnly) return false;
    if (item.anyPermission) return item.anyPermission.some((p) => permissionSet.has(p));
    if (item.permission) return permissionSet.has(item.permission);
    return true; // no permission requirement — visible to every authenticated admin
  });

  const navList = (onNavigate?: () => void) => (
    <ul className="space-y-1">
      {visibleItems.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block rounded-md px-3 py-2 text-small font-medium transition-colors",
                active ? "bg-navy-100 text-navy-700" : "text-ink-900 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const accountBlock = (
    <div className="border-t border-gray-300 px-6 py-4">
      <div className="text-small font-semibold text-ink-900">{adminName}</div>
      <div className="mb-3 text-[12px] text-gray-500">{roleName}</div>
      <form action={logoutAction}>
        <button type="submit" className="text-[13px] font-medium text-navy-700 hover:text-gold-700">
          Log out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile/tablet top bar — below `desktop` (1024px), this replaces the
          persistent sidebar entirely. */}
      <header className="flex items-center justify-between border-b border-gray-300 bg-white px-4 py-3 desktop:hidden">
        <div>
          <div className="font-serif text-[16px] font-semibold text-navy-700">Utkarsh Associates</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-gray-500">Admin</div>
        </div>
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md text-navy-700"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {mobileOpen ? <path d="M6 6L18 18M18 6L6 18" /> : <path d="M4 7H20M4 12H20M4 17H20" />}
          </svg>
        </button>
      </header>
      {mobileOpen && (
        <div className="flex flex-col border-b border-gray-300 bg-white desktop:hidden">
          <nav className="px-3 py-4">{navList(() => setMobileOpen(false))}</nav>
          {accountBlock}
        </div>
      )}

      {/* Persistent sidebar — `desktop` (1024px) and up only. */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-gray-300 bg-white desktop:flex">
        <div className="border-b border-gray-300 px-6 py-5">
          <div className="font-serif text-[18px] font-semibold text-navy-700">Utkarsh Associates</div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-gray-500">Admin</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">{navList()}</nav>
        {accountBlock}
      </aside>
    </>
  );
}
