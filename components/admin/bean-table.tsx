"use client"

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react"
import { Bean, Roast, ALL_ROASTS, Retailer } from "@/lib/types"
import { deleteBeanAction, toggleStockAction } from "@/app/admin/actions"
import { DeleteDialog } from "@/components/admin/delete-dialog"
import { cn } from "@/lib/utils"

interface BeanTableProps {
  initialBeans: Bean[]
  clickCounts?: Record<string, number>
  commissions?: Record<string, number>
  retailers?: Retailer[]
}

export function BeanTable({
  initialBeans,
  clickCounts = {},
  commissions = {},
  retailers = [],
}: BeanTableProps) {
  const router = useRouter()
  const [beans, setBeans] = useState<Bean[]>(initialBeans)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoast, setSelectedRoast] = useState<string>("ALL")
  const [selectedStock, setSelectedStock] = useState<string>("ALL")
  const [selectedRoaster, setSelectedRoaster] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<"date" | "name" | "price-asc" | "price-desc">("date")
  const [beanToDelete, setBeanToDelete] = useState<Bean | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync if initialBeans changes from server revalidation
  useMemo(() => {
    setBeans(initialBeans)
  }, [initialBeans])

  // Extract unique roasters for filter dropdown
  const roasters = useMemo(() => {
    return Array.from(new Set(beans.map((b) => b.roaster).filter(Boolean))).sort()
  }, [beans])

  // Filter and sort beans
  const filteredBeans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return beans
      .filter((bean) => {
        // Roast filter
        if (selectedRoast !== "ALL" && bean.roast !== selectedRoast) return false

        // Stock filter
        if (selectedStock === "IN_STOCK" && !bean.inStock) return false
        if (selectedStock === "OUT_OF_STOCK" && bean.inStock) return false

        // Roaster filter
        if (selectedRoaster !== "ALL" && bean.roaster !== selectedRoaster) return false

        // Text search
        if (q) {
          const haystack = [
            bean.name,
            bean.roaster,
            bean.country,
            bean.region,
            bean.roast,
            bean.process,
            bean.variety,
            ...(bean.flavors || []),
            ...(bean.purposes || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          if (!haystack.includes(q)) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === "price-asc") {
          return (a.price || 0) - (b.price || 0)
        }
        if (sortBy === "price-desc") {
          return (b.price || 0) - (a.price || 0)
        }
        // default "date": newest first
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
  }, [beans, searchQuery, selectedRoast, selectedStock, selectedRoaster, sortBy])

  // Stock quick toggle
  const handleToggleStock = async (bean: Bean) => {
    const newStock = !bean.inStock
    // Optimistic UI update
    setBeans((prev) =>
      prev.map((b) => (b.id === bean.id ? { ...b, inStock: newStock } : b))
    )

    startTransition(async () => {
      const res = await toggleStockAction(bean.id)
      if (res.success) {
        setFeedback({
          text: `Status updated: ${bean.name} is now ${newStock ? "In Stock" : "Out of Stock"}`,
          type: "success",
        })
        setTimeout(() => setFeedback(null), 3000)
        router.refresh()
      } else {
        // Revert on error
        setBeans((prev) =>
          prev.map((b) => (b.id === bean.id ? { ...b, inStock: !newStock } : b))
        )
        setFeedback({ text: res.message || "Failed to update stock", type: "error" })
        setTimeout(() => setFeedback(null), 3000)
      }
    })
  }

  // Confirm delete handler
  const handleConfirmDelete = async (bean: Bean) => {
    const res = await deleteBeanAction(bean.id)
    if (res.success) {
      setBeans((prev) => prev.filter((b) => b.id !== bean.id))
      setFeedback({ text: `"${bean.name}" deleted successfully.`, type: "success" })
      setTimeout(() => setFeedback(null), 3000)
      router.refresh()
    } else {
      setFeedback({ text: res.message || "Failed to delete bean", type: "error" })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedRoast("ALL")
    setSelectedStock("ALL")
    setSelectedRoaster("ALL")
    setSortBy("date")
  }

  const hasActiveFilters =
    searchQuery ||
    selectedRoast !== "ALL" ||
    selectedStock !== "ALL" ||
    selectedRoaster !== "ALL" ||
    sortBy !== "date"

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl p-4 shadow-xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-200",
            feedback.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : "bg-destructive text-destructive-foreground border-destructive"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5 text-emerald-400" />
          ) : (
            <AlertCircle className="size-5" />
          )}
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 rounded-full p-1 hover:bg-white/20"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bean name, roaster, country, flavor notes..."
              className="w-full rounded-2xl border border-border bg-[#F5F2F0] py-3 pl-11 pr-4 text-xs font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:bg-white focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action Button */}
          <Link
            href="/admin/coffee-beans/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-4" />
            <span>Add New Bean</span>
          </Link>
        </div>

        {/* Filter Dropdowns & Sort */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/60">
          {/* Roast Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[#F5F2F0] px-3 py-1.5 text-xs font-semibold text-foreground">
            <span className="text-muted-foreground">Roast:</span>
            <select
              value={selectedRoast}
              onChange={(e) => setSelectedRoast(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Roasts</option>
              {ALL_ROASTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Roaster Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[#F5F2F0] px-3 py-1.5 text-xs font-semibold text-foreground">
            <span className="text-muted-foreground">Roaster:</span>
            <select
              value={selectedRoaster}
              onChange={(e) => setSelectedRoaster(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Roasters</option>
              {roasters.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[#F5F2F0] px-3 py-1.5 text-xs font-semibold text-foreground">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[#F5F2F0] px-3 py-1.5 text-xs font-semibold text-foreground ml-auto">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold outline-none cursor-pointer"
            >
              <option value="date">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline px-2 py-1 cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground">
        <span>
          Showing {filteredBeans.length} of {beans.length} coffee beans
        </span>
      </div>

      {/* Bean List - Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 pl-6 pr-3">Bean</th>
                <th className="py-4 px-3">Roaster</th>
                <th className="py-4 px-3">Retailer</th>
                <th className="py-4 px-3">Origin</th>
                <th className="py-4 px-3">Price</th>
                <th className="py-4 px-3">Availability</th>
                <th className="py-4 px-3">Affiliate Status</th>
                <th className="py-4 px-3">Clicks</th>
                <th className="py-4 px-3">Commission</th>
                <th className="py-4 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-medium text-foreground">
              {filteredBeans.map((bean) => (
                <tr
                  key={bean.id}
                  className="hover:bg-[#FCF8F5]/80 transition-colors group"
                >
                  {/* Bean Thumbnail & Name */}
                  <td className="py-4 pl-6 pr-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-[#F5F2F0] flex items-center justify-center">
                        {bean.image ? (
                          <Image
                            src={bean.image}
                            alt={bean.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Coffee className="size-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-foreground truncate block">
                            {bean.name}
                          </span>
                          {bean.featured && (
                            <span className="shrink-0 rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-black uppercase">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {bean.weight || "250g"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Roaster */}
                  <td className="py-4 px-3">
                    <span className="font-semibold text-foreground">
                      {bean.roaster || "—"}
                    </span>
                  </td>

                  {/* Retailer */}
                  <td className="py-4 px-3 font-semibold text-foreground">
                    {retailers.find((r) => r.id === bean.retailerId)?.name || bean.roaster || "—"}
                  </td>

                  {/* Origin */}
                  <td className="py-4 px-3">
                    <div>
                      <span className="font-semibold text-foreground block">
                        {bean.country}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate max-w-[140px]">
                        {bean.region || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-3">
                    <span className="font-heading font-extrabold text-sm text-foreground">
                      £{bean.price.toFixed(2)}
                    </span>
                  </td>

                  {/* Stock Status Toggle */}
                  <td className="py-4 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(bean)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer",
                        bean.inStock
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                      title="Click to toggle stock status"
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          bean.inStock ? "bg-emerald-600" : "bg-destructive"
                        )}
                      />
                      <span>{bean.inStock ? "In Stock" : "Out of Stock"}</span>
                    </button>
                  </td>

                  {/* Affiliate Status */}
                  <td className="py-4 px-3">
                    {bean.affiliateUrl ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                        Active ({bean.affiliateNetwork || "direct"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        None
                      </span>
                    )}
                  </td>

                  {/* Affiliate Clicks */}
                  <td className="py-4 px-3 font-heading font-extrabold text-sm text-foreground">
                    {clickCounts[bean.id] || 0}
                  </td>

                  {/* Commission */}
                  <td className="py-4 px-3 font-heading font-extrabold text-sm text-foreground">
                    £{(commissions[bean.id] || 0).toFixed(2)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 pl-3 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {bean.url && (
                        <a
                          href={bean.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          title="View store product"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      <Link
                        href={`/admin/coffee-beans/${bean.id}/edit`}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit bean"
                      >
                        <Edit2 className="size-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setBeanToDelete(bean)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Delete bean"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {filteredBeans.map((bean) => (
          <div
            key={bean.id}
            className="rounded-3xl border border-border bg-card p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start gap-3.5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-[#F5F2F0] flex items-center justify-center">
                {bean.image ? (
                  <Image
                    src={bean.image}
                    alt={bean.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <Coffee className="size-7 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-heading font-bold text-sm text-foreground truncate">
                    {bean.name}
                  </h4>
                  <span className="font-heading font-extrabold text-sm text-primary shrink-0">
                    £{bean.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {bean.roaster} • {bean.country}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
                      bean.roast === "Light"
                        ? "bg-amber-100 text-amber-800"
                        : bean.roast === "Medium"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-stone-800 text-stone-100"
                    )}
                  >
                    {bean.roast}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleStock(bean)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      bean.inStock
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {bean.inStock ? "● In Stock" : "● Out of Stock"}
                  </button>
                </div>
              </div>
            </div>

            {/* Flavor chips */}
            {bean.flavors && bean.flavors.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {bean.flavors.map((fl) => (
                  <span
                    key={fl}
                    className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
                  >
                    {fl}
                  </span>
                ))}
              </div>
            )}

            {/* Affiliate Performance Details */}
            <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-[11px] font-semibold text-muted-foreground">
              <div>
                Retailer: <span className="text-foreground">{retailers.find((r) => r.id === bean.retailerId)?.name || bean.roaster || "—"}</span>
              </div>
              <div>
                Affiliate: <span className="text-foreground">{bean.affiliateUrl ? `${bean.affiliateNetwork || "direct"}` : "None"}</span>
              </div>
              <div>
                Clicks: <span className="text-foreground font-bold">{clickCounts[bean.id] || 0}</span>
              </div>
              <div>
                Commission: <span className="text-foreground font-bold">£{(commissions[bean.id] || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-[11px] text-muted-foreground font-medium">
                {bean.weight || "250g"} • {bean.process || "Washed"}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/coffee-beans/${bean.id}/edit`}
                  className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
                >
                  <Edit2 className="size-3" />
                  <span>Edit</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setBeanToDelete(bean)}
                  className="flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBeans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
            <Coffee className="size-8" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground mb-1">
            No coffee beans found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-6">
            {hasActiveFilters
              ? "We couldn't find any beans matching your current search and filter criteria."
              : "Your catalog is empty. Add your first coffee bean to get started!"}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              href="/admin/coffee-beans/new"
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add First Coffee Bean
            </Link>
          )}
        </div>
      )}

      {/* Deletion Dialog */}
      <DeleteDialog
        bean={beanToDelete}
        isOpen={Boolean(beanToDelete)}
        onClose={() => setBeanToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
