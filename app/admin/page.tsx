import Link from "next/link"
import Image from "next/image"
import {
  Coffee,
  Plus,
  Store,
  Globe2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
} from "lucide-react"
import { getBeans, getAdminStats } from "@/lib/db/beans"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const beans = await getBeans()
  const stats = await getAdminStats()
  const recentBeans = beans.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/50 px-3 py-1 text-xs font-bold text-accent-foreground mb-2">
            <Sparkles className="size-3.5" />
            Admin Control Center
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Dashboard & Catalog Summary
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Overview of specialty coffee bean listings, inventory health, and partner roasters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/coffee-beans"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
          >
            Manage Catalog
          </Link>
          <Link
            href="/admin/coffee-beans/new"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="size-4" />
            <span>Add New Bean</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Total Beans</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Coffee className="size-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-black text-foreground">
            {stats.totalBeans}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Listed products</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Roasters</span>
            <div className="size-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Store className="size-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-black text-foreground">
            {stats.totalRoasters}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Specialty roasters</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Origins</span>
            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe2 className="size-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-black text-foreground">
            {stats.totalCountries}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Growing countries</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Out of Stock</span>
            <div className="size-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-black text-foreground">
            {stats.outOfStockCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Items unavailable</p>
        </div>
      </div>

      {/* Quick Actions & Recent Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Beans List */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Recently Added Coffee Beans
            </h3>
            <Link
              href="/admin/coffee-beans"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/60">
            {recentBeans.map((bean) => (
              <div
                key={bean.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-secondary/20 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-[#F5F2F0] flex items-center justify-center">
                    {bean.image ? (
                      <Image
                        src={bean.image}
                        alt={bean.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Coffee className="size-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm text-foreground truncate">
                      {bean.name}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground truncate">
                      {bean.roaster} • {bean.country} • £{bean.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      bean.inStock
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {bean.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                  <Link
                    href={`/admin/coffee-beans/${bean.id}/edit`}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Help & Shortcuts */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3">
              Quick Shortcuts
            </h3>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/admin/coffee-beans/new"
                className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="size-4 text-primary" />
                  <span>Add New Coffee Bean</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/admin/coffee-beans"
                className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="size-4 text-primary" />
                  <span>Manage Catalog Table</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe2 className="size-4 text-primary" />
                  <span>Explore Public Storefront</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
