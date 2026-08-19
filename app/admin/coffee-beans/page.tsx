import Link from "next/link"
import {
  Coffee,
  Plus,
  Store,
  Globe2,
  AlertTriangle,
  Sparkles,
  Upload,
} from "lucide-react"
import { getBeans, getAdminStats } from "@/lib/db/beans"
import { getRetailers } from "@/lib/db/retailers"
import { getClicks } from "@/lib/db/clicks"
import { getConversions } from "@/lib/db/conversions"
import { BeanTable } from "@/components/admin/bean-table"

export const dynamic = "force-dynamic"

export default async function AdminCoffeeBeansPage() {
  const beans = await getBeans()
  const stats = await getAdminStats()
  const retailers = await getRetailers()
  
  // Aggregate affiliate clicks
  const clicks = await getClicks()
  const clickCounts: Record<string, number> = {}
  clicks.forEach((click) => {
    if (click.coffeeBeanId) {
      clickCounts[click.coffeeBeanId] = (clickCounts[click.coffeeBeanId] || 0) + 1
    }
  })

  // Aggregate commissions (Pending, Approved, Paid - excluding Rejected)
  const conversions = await getConversions()
  const commissions: Record<string, number> = {}
  conversions.forEach((conv) => {
    if (conv.coffeeBeanId && conv.status !== "Rejected") {
      commissions[conv.coffeeBeanId] = (commissions[conv.coffeeBeanId] || 0) + (conv.commissionValue || 0)
    }
  })

  return (
    <div className="space-y-8">
      {/* Header with Title & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/50 px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
              <Sparkles className="size-3" />
              Live Inventory
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Coffee Bean Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse, search, edit, stock-toggle, and manage all specialty coffee bean profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/coffee-beans/import"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EADFD7] bg-white px-5 py-3 text-xs font-bold text-foreground shadow-2xs hover:bg-[#FAF8F5] transition-all cursor-pointer w-fit"
          >
            <Upload className="size-4 text-primary" />
            <span>Import Beans (Excel / CSV)</span>
          </Link>

          <Link
            href="/admin/coffee-beans/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer w-fit"
          >
            <Plus className="size-4" />
            <span>Add Coffee Bean</span>
          </Link>
        </div>
      </div>

      {/* Quick Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beans */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Total Catalog</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Coffee className="size-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-foreground">
            {stats.totalBeans}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Active specialty coffee profiles
          </p>
        </div>

        {/* Total Roasters */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Partner Roasters</span>
            <div className="size-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Store className="size-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-foreground">
            {stats.totalRoasters}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Specialty roasters featured
          </p>
        </div>

        {/* Countries of Origin */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Origin Countries</span>
            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe2 className="size-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-foreground">
            {stats.totalCountries}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Worldwide growing origins
          </p>
        </div>

        {/* Stock Status */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold">Stock Attention</span>
            <div className="size-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-foreground">
            {stats.outOfStockCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {stats.outOfStockCount === 0
              ? "All items currently in stock"
              : "Items marked out of stock"}
          </p>
        </div>
      </div>

      {/* Main Interactive Table & Filter Component */}
      <BeanTable
        initialBeans={beans}
        clickCounts={clickCounts}
        commissions={commissions}
        retailers={retailers}
      />
    </div>
  )
}
