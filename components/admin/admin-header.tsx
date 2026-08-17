"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Coffee,
  PlusCircle,
  ListFilter,
  LogOut,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
} from "lucide-react"
import { logoutAdminAction } from "@/app/admin/actions"
import { cn } from "@/lib/utils"

export function AdminHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoginPage = pathname === "/admin/login"

  if (isLoginPage) return null

  const navLinks = [
    {
      href: "/admin/coffee-beans",
      label: "All Coffee Beans",
      icon: ListFilter,
      active: pathname === "/admin/coffee-beans" || pathname === "/admin",
    },
    {
      href: "/admin/coffee-beans/new",
      label: "Add New Bean",
      icon: PlusCircle,
      active: pathname === "/admin/coffee-beans/new",
    },
    {
      href: "/admin/affiliate",
      label: "Affiliate Performance",
      icon: LayoutDashboard,
      active: pathname === "/admin/affiliate",
    },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#FCF8F5]/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-3">
          <Link href="/admin/coffee-beans" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Coffee className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                  Bean Buddy
                </span>
                <span className="rounded-md bg-accent/40 border border-accent px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground hidden sm:block">
                Catalog & Inventory Management
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all",
                  link.active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Utility Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            title="Open public website in new tab"
          >
            <span>View Public Site</span>
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full border border-transparent bg-destructive/10 px-3.5 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-white cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </button>
          </form>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden rounded-xl border border-border p-2 text-foreground hover:bg-secondary"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-[#FCF8F5] px-4 py-4 md:hidden animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold transition-colors",
                    link.active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              )
            })}

            <div className="my-2 border-t border-border" />

            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <span>View Public Store</span>
              <ExternalLink className="size-4 text-muted-foreground" />
            </Link>

            <form action={logoutAdminAction} className="mt-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive hover:text-white transition-colors"
              >
                <LogOut className="size-4" />
                <span>Log out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
