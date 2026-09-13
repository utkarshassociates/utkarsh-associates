"use client";

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

// §5.2: "Sidebar navigation renders dynamically based on the logged-in
// admin's resolved permission set — someone without team.manage simply
// never sees a 'Team' item in their sidebar."
export function Sidebar({ isSuper, permissions, adminName, roleName }: SidebarProps) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const visibleItems = ADMIN_NAV.filter((item) => {
    if (isSuper) return true;
    if (item.anyPermission) return item.anyPermission.some((p) => permissionSet.has(p));
    if (item.permission) return permissionSet.has(item.permission);
    return true; // no permission requirement — visible to every authenticated admin
  });

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-300 bg-white">
      <div className="border-b border-gray-300 px-6 py-5">
        <div className="font-serif text-[18px] font-semibold text-navy-700">Utkarsh Associates</div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-gray-500">Admin</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
      </nav>

      <div className="border-t border-gray-300 px-6 py-4">
        <div className="text-small font-semibold text-ink-900">{adminName}</div>
        <div className="mb-3 text-[12px] text-gray-500">{roleName}</div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[13px] font-medium text-navy-700 hover:text-gold-700"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
