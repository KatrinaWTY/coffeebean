"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  LayoutDashboard,
  Coffee,
  Store,
  Globe2,
  Calendar,
  ArrowUpDown,
  Plus,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Layers,
} from "lucide-react"
import {
  Bean,
  Retailer,
  AffiliateNetwork,
  AffiliateClick,
  AffiliateConversion,
} from "@/lib/types"
import {
  saveConversionAction,
  importConversionsCsvAction,
} from "@/app/admin/actions"
import { cn } from "@/lib/utils"

interface AffiliateDashboardClientProps {
  initialClicks: AffiliateClick[]
  initialConversions: AffiliateConversion[]
  retailers: Retailer[]
  beans: Bean[]
  networks: AffiliateNetwork[]
  activeRange: string
  activeStart: string
  activeEnd: string
}

export function AffiliateDashboardClient({
  initialClicks,
  initialConversions,
  retailers,
  beans,
  networks,
  activeRange,
  activeStart,
  activeEnd,
}: AffiliateDashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"overview" | "conversions" | "import">("overview")

  // Date Filter Form State
  const [dateRange, setDateRange] = useState(activeRange)
  const [customStart, setCustomStart] = useState(activeStart)
  const [customEnd, setCustomEnd] = useState(activeEnd)

  // Manual Conversion Entry Form State
  const [formNetwork, setFormNetwork] = useState("")
  const [formRetailerId, setFormRetailerId] = useState("")
  const [formBeanId, setFormBeanId] = useState("")
  const [formTxId, setFormTxId] = useState("")
  const [formOrderVal, setFormOrderVal] = useState("0.00")
  const [formCommVal, setFormCommVal] = useState("0.00")
  const [formStatus, setFormStatus] = useState<"Pending" | "Approved" | "Rejected" | "Paid">("Pending")
  const [formOrderDate, setFormOrderDate] = useState(() => new Date().toISOString().substring(0, 10))

  const [formFeedback, setFormFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null)

  // CSV Import State
  const [csvText, setCsvText] = useState("")
  const [importFeedback, setImportFeedback] = useState<{ text: string; type: "success" | "error"; errors?: string[] } | null>(null)

  // Sorting States
  const [beanSortBy, setBeanSortBy] = useState<"name" | "clicks" | "conversions" | "commission" | "epc">("clicks")
  const [beanSortDir, setBeanSortDir] = useState<"asc" | "desc">("desc")
  const [retailerSortBy, setRetailerSortBy] = useState<"name" | "clicks" | "conversions" | "commission" | "epc">("clicks")
  const [retailerSortDir, setRetailerSortDir] = useState<"asc" | "desc">("desc")

  // ==========================================
  // Date Filtering triggers
  // ==========================================
  const applyDateFilter = (rangeVal: string, startVal?: string, endVal?: string) => {
    startTransition(() => {
      const params = new URLSearchParams()
      params.set("range", rangeVal)
      if (rangeVal === "custom") {
        if (startVal) params.set("start", startVal)
        if (endVal) params.set("end", endVal)
      }
      router.push(`/admin/affiliate?${params.toString()}`)
      router.refresh()
    })
  }

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setDateRange(val)
    if (val !== "custom") {
      applyDateFilter(val)
    }
  }

  // ==========================================
  // KPIs Calculations
  // ==========================================
  const kpis = useMemo(() => {
    const totalClicks = initialClicks.length
    const uniqueSessionIds = new Set(initialClicks.map((c) => c.sessionId))
    const uniqueSessions = uniqueSessionIds.size

    const totalConversions = initialConversions.length
    const conversionRate = uniqueSessions > 0 ? (totalConversions / uniqueSessions) * 100 : 0

    let orderValue = 0
    let pendingCommission = 0
    let approvedCommission = 0
    let paidCommission = 0
    let totalCommission = 0

    initialConversions.forEach((c) => {
      if (c.status !== "Rejected") {
        orderValue += c.orderValue || 0
        totalCommission += c.commissionValue || 0
        if (c.status === "Pending") pendingCommission += c.commissionValue || 0
        if (c.status === "Approved") approvedCommission += c.commissionValue || 0
        if (c.status === "Paid") paidCommission += c.commissionValue || 0
      }
    })

    const epc = totalClicks > 0 ? totalCommission / totalClicks : 0
    const averageCommission = totalConversions > 0 ? totalCommission / totalConversions : 0

    return {
      totalClicks,
      uniqueSessions,
      totalConversions,
      conversionRate,
      orderValue,
      pendingCommission,
      approvedCommission,
      paidCommission,
      totalCommission,
      epc,
      averageCommission,
    }
  }, [initialClicks, initialConversions])

  // ==========================================
  // Groupings & Tables Data
  // ==========================================

  // Coffee Bean Performance
  const beanPerformance = useMemo(() => {
    const dataMap: Record<string, {
      beanId: string
      name: string
      roaster: string
      retailerName: string
      clicks: number
      conversions: number
      commission: number
    }> = {}

    // Init with active catalog
    beans.forEach((b) => {
      const retailer = retailers.find((r) => r.id === b.retailerId)
      dataMap[b.id] = {
        beanId: b.id,
        name: b.name,
        roaster: b.roaster,
        retailerName: retailer ? retailer.name : b.roaster || "Unknown",
        clicks: 0,
        conversions: 0,
        commission: 0,
      }
    })

    // Sum clicks
    initialClicks.forEach((c) => {
      if (dataMap[c.coffeeBeanId]) {
        dataMap[c.coffeeBeanId].clicks++
      } else {
        // click on deleted/unloaded bean
        dataMap[c.coffeeBeanId] = {
          beanId: c.coffeeBeanId,
          name: `Unlisted Bean (${c.coffeeBeanId})`,
          roaster: "Unknown",
          retailerName: retailers.find((r) => r.id === c.retailerId)?.name || "Unknown",
          clicks: 1,
          conversions: 0,
          commission: 0,
        }
      }
    })

    // Sum conversions
    initialConversions.forEach((conv) => {
      const bid = conv.coffeeBeanId || ""
      if (bid && dataMap[bid]) {
        dataMap[bid].conversions++
        if (conv.status !== "Rejected") {
          dataMap[bid].commission += conv.commissionValue || 0
        }
      }
    })

    const list = Object.values(dataMap)

    // Sort
    return list.sort((a, b) => {
      let comparison = 0
      if (beanSortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (beanSortBy === "clicks") {
        comparison = a.clicks - b.clicks
      } else if (beanSortBy === "conversions") {
        comparison = a.conversions - b.conversions
      } else if (beanSortBy === "commission") {
        comparison = a.commission - b.commission
      } else if (beanSortBy === "epc") {
        const epcA = a.clicks > 0 ? a.commission / a.clicks : 0
        const epcB = b.clicks > 0 ? b.commission / b.clicks : 0
        comparison = epcA - epcB
      }

      return beanSortDir === "desc" ? -comparison : comparison
    })
  }, [beans, retailers, initialClicks, initialConversions, beanSortBy, beanSortDir])

  // Retailer Performance
  const retailerPerformance = useMemo(() => {
    const dataMap: Record<string, {
      retailerId: string
      name: string
      networkName: string
      clicks: number
      conversions: number
      revenue: number
      commission: number
    }> = {}

    // Init with retailers
    retailers.forEach((r) => {
      dataMap[r.id] = {
        retailerId: r.id,
        name: r.name,
        networkName: "Direct",
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commission: 0,
      }
    })

    // Add clicks
    initialClicks.forEach((c) => {
      if (c.retailerId && dataMap[c.retailerId]) {
        dataMap[c.retailerId].clicks++
        if (c.affiliateNetwork && c.affiliateNetwork !== "direct") {
          dataMap[c.retailerId].networkName = networks.find(n => n.id === c.affiliateNetwork)?.name || c.affiliateNetwork
        }
      }
    })

    // Add conversions
    initialConversions.forEach((conv) => {
      const rid = conv.retailerId
      if (rid && dataMap[rid]) {
        dataMap[rid].conversions++
        if (conv.status !== "Rejected") {
          dataMap[rid].revenue += conv.orderValue || 0
          dataMap[rid].commission += conv.commissionValue || 0
        }
      }
    })

    const list = Object.values(dataMap)

    return list.sort((a, b) => {
      let comparison = 0
      if (retailerSortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (retailerSortBy === "clicks") {
        comparison = a.clicks - b.clicks
      } else if (retailerSortBy === "conversions") {
        comparison = a.conversions - b.conversions
      } else if (retailerSortBy === "commission") {
        comparison = a.commission - b.commission
      } else if (retailerSortBy === "epc") {
        const epcA = a.clicks > 0 ? a.commission / a.clicks : 0
        const epcB = b.clicks > 0 ? b.commission / b.clicks : 0
        comparison = epcA - epcB
      }

      return retailerSortDir === "desc" ? -comparison : comparison
    })
  }, [retailers, initialClicks, initialConversions, networks, retailerSortBy, retailerSortDir])

  // Network Performance
  const networkPerformance = useMemo(() => {
    const dataMap: Record<string, {
      networkId: string
      name: string
      clicks: number
      conversions: number
      pending: number
      approved: number
      paid: number
    }> = {}

    // Init common networks
    networks.forEach((n) => {
      dataMap[n.id] = {
        networkId: n.id,
        name: n.name,
        clicks: 0,
        conversions: 0,
        pending: 0,
        approved: 0,
        paid: 0,
      }
    })
    // Also add "direct"
    dataMap["direct"] = {
      networkId: "direct",
      name: "Direct Link (No Network)",
      clicks: 0,
      conversions: 0,
      pending: 0,
      approved: 0,
      paid: 0,
    }

    // Add clicks
    initialClicks.forEach((c) => {
      const net = c.affiliateNetwork || "direct"
      if (dataMap[net]) {
        dataMap[net].clicks++
      } else {
        dataMap[net] = {
          networkId: net,
          name: net,
          clicks: 1,
          conversions: 0,
          pending: 0,
          approved: 0,
          paid: 0,
        }
      }
    })

    // Add conversions
    initialConversions.forEach((conv) => {
      const net = conv.affiliateNetwork || "direct"
      if (dataMap[net]) {
        dataMap[net].conversions++
        if (conv.status === "Pending") dataMap[net].pending += conv.commissionValue || 0
        if (conv.status === "Approved") dataMap[net].approved += conv.commissionValue || 0
        if (conv.status === "Paid") dataMap[net].paid += conv.commissionValue || 0
      }
    })

    return Object.values(dataMap).filter((item) => item.clicks > 0 || item.conversions > 0)
  }, [networks, initialClicks, initialConversions])

  // ==========================================
  // Event Handlers (Form submissions)
  // ==========================================
  const handleAddConversion = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormFeedback(null)

    if (!formNetwork || !formRetailerId || !formTxId) {
      setFormFeedback({ text: "Please fill in all required fields (Network, Retailer, Transaction ID)", type: "error" })
      return
    }

    const formData = new FormData()
    formData.set("affiliateNetwork", formNetwork)
    formData.set("retailerId", formRetailerId)
    formData.set("coffeeBeanId", formBeanId)
    formData.set("externalTransactionId", formTxId)
    formData.set("orderValue", formOrderVal)
    formData.set("commissionValue", formCommVal)
    formData.set("status", formStatus)
    formData.set("orderDate", new Date(formOrderDate).toISOString())
    formData.set("conversionDate", new Date().toISOString())

    startTransition(async () => {
      const result = await saveConversionAction(null, formData)
      if (result.success) {
        setFormFeedback({ text: "Conversion saved successfully!", type: "success" })
        setFormTxId("")
        setFormOrderVal("0.00")
        setFormCommVal("0.00")
        router.refresh()
      } else {
        setFormFeedback({ text: result.message || "Failed to save conversion.", type: "error" })
      }
    })
  }

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setImportFeedback(null)

    if (!csvText.trim()) {
      setImportFeedback({ text: "Please paste CSV content first.", type: "error" })
      return
    }

    startTransition(async () => {
      const result = await importConversionsCsvAction(csvText)
      if (result.success) {
        setImportFeedback({
          text: result.message,
          type: "success",
          errors: result.errors?.length ? result.errors : undefined,
        })
        setCsvText("")
        router.refresh()
      } else {
        setImportFeedback({ text: result.message || "Failed to import CSV.", type: "error" })
      }
    })
  }

  // Helper toggle sorting
  const requestBeanSort = (column: typeof beanSortBy) => {
    if (beanSortBy === column) {
      setBeanSortDir(beanSortDir === "asc" ? "desc" : "asc")
    } else {
      setBeanSortBy(column)
      setBeanSortDir("desc")
    }
  }

  const requestRetailerSort = (column: typeof retailerSortBy) => {
    if (retailerSortBy === column) {
      setRetailerSortDir(retailerSortDir === "asc" ? "desc" : "asc")
    } else {
      setRetailerSortBy(column)
      setRetailerSortDir("desc")
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Header with Period Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/50 px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
              <TrendingUp className="size-3" />
              Affiliate Insights
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Affiliate & Revenue Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track outbound redirects, CTR, conversions, commission, and merchant performance.
          </p>
        </div>

        {/* Date Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-card border border-border p-2.5 rounded-2xl shadow-xs">
          <Calendar className="size-4 text-muted-foreground hidden sm:block ml-1" />
          <select
            value={dateRange}
            onChange={handleRangeChange}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-white cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="prev_month">Previous Month</option>
            <option value="custom">Custom Range...</option>
            <option value="all">All Time</option>
          </select>

          {dateRange === "custom" && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-3 duration-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
              />
              <span className="text-xs font-bold text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => applyDateFilter("custom", customStart, customEnd)}
                className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold hover:bg-primary/95 cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top-level KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Clicks */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Outbound Clicks</p>
          <p className="font-heading text-2xl font-black text-foreground mt-1.5">{kpis.totalClicks}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Total redirections to retailers
          </p>
        </div>

        {/* Unique Sessions */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Unique Sessions</p>
          <p className="font-heading text-2xl font-black text-foreground mt-1.5">{kpis.uniqueSessions}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Unique outbound users tracking
          </p>
        </div>

        {/* Conversions Count */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Conversions</p>
          <p className="font-heading text-2xl font-black text-foreground mt-1.5">{kpis.totalConversions}</p>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Conv. Rate:</span>
            <span className="font-bold text-primary">{kpis.conversionRate.toFixed(2)}%</span>
          </p>
        </div>

        {/* EPC */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Earnings Per Click (EPC)</p>
          <p className="font-heading text-2xl font-black text-foreground mt-1.5">£{kpis.epc.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Avg. commission value per click
          </p>
        </div>

        {/* Total Commissions */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs bg-emerald-50/50 border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Total Commission</p>
          <p className="font-heading text-2xl font-black text-emerald-950 mt-1.5">£{kpis.totalCommission.toFixed(2)}</p>
          <div className="text-[9px] text-emerald-700 mt-1 grid grid-cols-3 gap-0.5 font-medium leading-none">
            <div>
              <span className="block font-bold">Pend:</span> £{kpis.pendingCommission.toFixed(0)}
            </div>
            <div>
              <span className="block font-bold">Appr:</span> £{kpis.approvedCommission.toFixed(0)}
            </div>
            <div>
              <span className="block font-bold">Paid:</span> £{kpis.paidCommission.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-border/80 gap-6 text-sm font-bold text-muted-foreground">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3.5 relative transition-colors hover:text-foreground cursor-pointer",
            activeTab === "overview" ? "text-foreground" : ""
          )}
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="size-4" />
            Performance breakdown
          </span>
          {activeTab === "overview" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("conversions")}
          className={cn(
            "pb-3.5 relative transition-colors hover:text-foreground cursor-pointer",
            activeTab === "conversions" ? "text-foreground" : ""
          )}
        >
          <span className="flex items-center gap-2">
            <Layers className="size-4" />
            Conversions Log ({initialConversions.length})
          </span>
          {activeTab === "conversions" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("import")}
          className={cn(
            "pb-3.5 relative transition-colors hover:text-foreground cursor-pointer",
            activeTab === "import" ? "text-foreground" : ""
          )}
        >
          <span className="flex items-center gap-2">
            <Upload className="size-4" />
            Import CSV & Webhook info
          </span>
          {activeTab === "import" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Coffee Beans Performance Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="border-b border-border bg-secondary/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="size-4.5 text-primary" />
                <h3 className="font-heading text-base font-bold text-foreground">Coffee Bean Performance</h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Click headers to sort</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/10 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th onClick={() => requestBeanSort("name")} className="py-3.5 pl-6 pr-3 cursor-pointer select-none hover:bg-secondary/20">
                      <span className="flex items-center gap-1">Coffee Bean <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th className="py-3.5 px-3">Retailer</th>
                    <th onClick={() => requestBeanSort("clicks")} className="py-3.5 px-3 cursor-pointer select-none hover:bg-secondary/20 text-center">
                      <span className="flex items-center justify-center gap-1">Clicks <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th onClick={() => requestBeanSort("conversions")} className="py-3.5 px-3 cursor-pointer select-none hover:bg-secondary/20 text-center">
                      <span className="flex items-center justify-center gap-1">Conversions <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th className="py-3.5 px-3 text-center">Conversion Rate</th>
                    <th onClick={() => requestBeanSort("commission")} className="py-3.5 px-3 cursor-pointer select-none hover:bg-secondary/20 text-right">
                      <span className="flex items-center justify-end gap-1">Commission <ArrowUpDown className="size-3" /></span>
                    </th>
                    <th onClick={() => requestBeanSort("epc")} className="py-3.5 pl-3 pr-6 cursor-pointer select-none hover:bg-secondary/20 text-right">
                      <span className="flex items-center justify-end gap-1">EPC <ArrowUpDown className="size-3" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs font-semibold text-foreground">
                  {beanPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">No coffee bean traffic recorded.</td>
                    </tr>
                  ) : (
                    beanPerformance.map((bp) => {
                      const epc = bp.clicks > 0 ? bp.commission / bp.clicks : 0
                      const convRate = bp.clicks > 0 ? (bp.conversions / bp.clicks) * 100 : 0
                      return (
                        <tr key={bp.beanId} className="hover:bg-[#FCF8F5]/80 transition-colors">
                          <td className="py-3.5 pl-6 pr-3 font-bold text-foreground">{bp.name}</td>
                          <td className="py-3.5 px-3 font-semibold text-muted-foreground">{bp.retailerName}</td>
                          <td className="py-3.5 px-3 text-center font-bold text-neutral-800">{bp.clicks}</td>
                          <td className="py-3.5 px-3 text-center font-bold text-neutral-850">{bp.conversions}</td>
                          <td className="py-3.5 px-3 text-center font-bold text-primary">{convRate.toFixed(1)}%</td>
                          <td className="py-3.5 px-3 text-right font-extrabold text-emerald-700">£{bp.commission.toFixed(2)}</td>
                          <td className="py-3.5 pl-3 pr-6 text-right font-bold text-foreground">£{epc.toFixed(2)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retailer Performance Table */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="border-b border-border bg-secondary/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="size-4.5 text-[#801854]" />
                  <h3 className="font-heading text-base font-bold text-foreground">Retailer Performance</h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">Click to sort</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/10 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <th onClick={() => requestRetailerSort("name")} className="py-3 px-4 cursor-pointer select-none hover:bg-secondary/20">
                        Retailer
                      </th>
                      <th className="py-3 px-2 text-center">Clicks</th>
                      <th className="py-3 px-2 text-center">Conversions</th>
                      <th className="py-3 px-2 text-right">Commission</th>
                      <th onClick={() => requestRetailerSort("epc")} className="py-3 pl-2 pr-4 cursor-pointer select-none hover:bg-secondary/20 text-right">
                        EPC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-semibold text-foreground">
                    {retailerPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">No retailer data available.</td>
                      </tr>
                    ) : (
                      retailerPerformance.map((rp) => {
                        const epc = rp.clicks > 0 ? rp.commission / rp.clicks : 0
                        return (
                          <tr key={rp.retailerId} className="hover:bg-[#FCF8F5]/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-foreground">
                              {rp.name}
                              <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">{rp.networkName}</span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold">{rp.clicks}</td>
                            <td className="py-3 px-2 text-center font-bold">{rp.conversions}</td>
                            <td className="py-3 px-2 text-right font-extrabold text-emerald-700">£{rp.commission.toFixed(2)}</td>
                            <td className="py-3 pl-2 pr-4 text-right font-bold">£{epc.toFixed(2)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Affiliate Network Performance */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="border-b border-border bg-secondary/20 p-5 flex items-center">
                <Globe2 className="size-4.5 text-emerald-700 mr-2" />
                <h3 className="font-heading text-base font-bold text-foreground">Affiliate Network Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/10 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Network</th>
                      <th className="py-3 px-2 text-center">Clicks</th>
                      <th className="py-3 px-2 text-center">Conversions</th>
                      <th className="py-3 px-2 text-right">Pend. Comm</th>
                      <th className="py-3 px-2 text-right">Appr. Comm</th>
                      <th className="py-3 pl-2 pr-4 text-right">Paid Comm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-semibold text-foreground">
                    {networkPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">No activity reported on networks yet.</td>
                      </tr>
                    ) : (
                      networkPerformance.map((np) => (
                        <tr key={np.networkId} className="hover:bg-[#FCF8F5]/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-foreground">{np.name}</td>
                          <td className="py-3 px-2 text-center font-bold">{np.clicks}</td>
                          <td className="py-3 px-2 text-center font-bold">{np.conversions}</td>
                          <td className="py-3 px-2 text-right text-stone-500 font-medium">£{np.pending.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right text-emerald-600 font-bold">£{np.approved.toFixed(2)}</td>
                          <td className="py-3 pl-2 pr-4 text-right text-emerald-800 font-extrabold">£{np.paid.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONVERSIONS LOG & MANUAL DATA ENTRY */}
      {activeTab === "conversions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Conversions Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="border-b border-border bg-secondary/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4.5 text-primary" />
                  <h3 className="font-heading text-base font-bold text-foreground">Recorded Conversions Log</h3>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">Filtered range: {initialConversions.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-secondary/10 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pl-6 pr-3">Tx ID</th>
                      <th className="py-3 px-3">Network</th>
                      <th className="py-3 px-3">Retailer</th>
                      <th className="py-3 px-3 text-right">Order Val</th>
                      <th className="py-3 px-3 text-right">Commission</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 pl-3 pr-6 text-right">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs font-medium text-foreground">
                    {initialConversions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">No conversions registered during this period.</td>
                      </tr>
                    ) : (
                      initialConversions.map((conv) => {
                        const retailerName = retailers.find((r) => r.id === conv.retailerId)?.name || conv.retailerId
                        const formattedDate = new Date(conv.orderDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })

                        return (
                          <tr key={conv.id} className="hover:bg-[#FCF8F5]/80 transition-colors">
                            <td className="py-3.5 pl-6 pr-3 font-mono font-bold text-foreground truncate max-w-[100px]" title={conv.externalTransactionId}>
                              {conv.externalTransactionId}
                            </td>
                            <td className="py-3.5 px-3 font-bold uppercase text-muted-foreground">{conv.affiliateNetwork}</td>
                            <td className="py-3.5 px-3 font-bold text-foreground">{retailerName}</td>
                            <td className="py-3.5 px-3 text-right text-stone-500 font-semibold">£{conv.orderValue.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-right text-emerald-700 font-extrabold">£{conv.commissionValue.toFixed(2)}</td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={cn(
                                  "inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                  conv.status === "Pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : conv.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : conv.status === "Paid"
                                    ? "bg-emerald-950 text-emerald-100"
                                    : "bg-destructive/10 text-destructive"
                                )}
                              >
                                {conv.status}
                              </span>
                            </td>
                            <td className="py-3.5 pl-3 pr-6 text-right font-semibold text-muted-foreground whitespace-nowrap">{formattedDate}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 1 Column: Manual Conversion Entry Form */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Plus className="size-5 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">Record Conversion Manually</h3>
            </div>

            {formFeedback && (
              <div
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5",
                  formFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {formFeedback.type === "success" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <AlertCircle className="size-4 shrink-0" />}
                <span>{formFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleAddConversion} className="space-y-3.5">
              {/* Network */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                  Affiliate Network <span className="text-destructive">*</span>
                </label>
                <select
                  value={formNetwork}
                  onChange={(e) => setFormNetwork(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Network --</option>
                  {networks.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Retailer */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                  Retailer / Merchant <span className="text-destructive">*</span>
                </label>
                <select
                  value={formRetailerId}
                  onChange={(e) => setFormRetailerId(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Retailer --</option>
                  {retailers.map((ret) => (
                    <option key={ret.id} value={ret.id}>
                      {ret.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coffee Bean Link */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                  Associated Coffee Bean <span className="text-muted-foreground">(Optional)</span>
                </label>
                <select
                  value={formBeanId}
                  onChange={(e) => setFormBeanId(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Coffee Bean --</option>
                  {beans.map((bean) => (
                    <option key={bean.id} value={bean.id}>
                      {bean.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* External Transaction ID */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                  External Transaction ID <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formTxId}
                  onChange={(e) => setFormTxId(e.target.value)}
                  placeholder="e.g. AWIN-99521"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                />
              </div>

              {/* Values */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                    Order Value (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formOrderVal}
                    onChange={(e) => setFormOrderVal(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                    Commission (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCommVal}
                    onChange={(e) => setFormCommVal(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={formOrderDate}
                    onChange={(e) => setFormOrderDate(e.target.value)}
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>Record Conversion</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CSV IMPORT & INTEGRATION HELP */}
      {activeTab === "import" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSV Import card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Upload className="size-5 text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">Import Conversions via CSV</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Export conversion data from network interfaces (Awin, ShareASale, etc.), map headers to match the format, and paste the comma-separated data below.
            </p>

            {importFeedback && (
              <div
                className={cn(
                  "p-4 rounded-2xl border text-xs font-bold space-y-2",
                  importFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                <div className="flex items-center gap-2">
                  {importFeedback.type === "success" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{importFeedback.text}</span>
                </div>
                {importFeedback.errors && importFeedback.errors.length > 0 && (
                  <div className="border-t border-black/10 pt-2 text-[10px] font-semibold text-destructive space-y-0.5 max-h-24 overflow-y-auto">
                    <p className="font-bold">Errors occurred on some rows:</p>
                    {importFeedback.errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground tracking-wide mb-1">
                  Paste Comma-Separated Values (CSV)
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`network,retailerId,externalTransactionId,orderDate,orderValue,commissionValue,status,coffeeBeanId
awin,climpson-sons,TX10294,2025-01-10T12:00:00Z,30.00,3.00,Approved,climpson-sons-the-baron-fazenda-inhame-brazil
shareasale,climpson-sons,TX10295,2025-01-11T14:30:00Z,15.00,1.50,Paid,climpson-sons-the-estate-fero-ethiopia`}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] p-4 text-xs font-mono text-foreground outline-none focus:bg-white focus:border-primary resize-y min-h-[160px]"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="size-4" />
                <span>Upload Conversions Data</span>
              </button>
            </form>
          </div>

          {/* Integration Developer Note */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Globe2 className="size-4.5 text-emerald-700" />
              Automating Integrations (Developers Guide)
            </h3>

            <div className="text-xs text-muted-foreground leading-relaxed space-y-3.5">
              <p>
                Our tracking infrastructure is designed with a clean abstraction to easily extend into full affiliate network APIs or webhooks.
              </p>

              <div>
                <h4 className="font-bold text-foreground mb-1 text-[11px] uppercase tracking-wide">1. Webhook Postback Endpoint</h4>
                <p>
                  Create an API route at <code className="bg-secondary px-1 py-0.5 rounded text-foreground font-mono">app/api/webhooks/conversions/[network]/route.ts</code> to receive callbacks directly from networks when conversions occur. Inside, map the payload keys to `recordConversion` parameters:
                </p>
                <pre className="bg-[#F5F2F0] p-3 rounded-xl mt-1.5 font-mono text-[10px] text-foreground leading-tight overflow-x-auto">
{`import { recordConversion } from "@/lib/db/conversions"

export async function POST(req, { params }) {
  const { network } = await params
  const payload = await req.json()
  
  // Map Awin, Impact, or CJ webhook payloads:
  await recordConversion({
    affiliateNetwork: network,
    retailerId: payload.advertiserId,
    externalTransactionId: payload.txId,
    orderValue: Number(payload.saleAmount),
    commissionValue: Number(payload.commission),
    currency: payload.currency,
    status: payload.isApproved ? "Approved" : "Pending",
    coffeeBeanId: payload.customId, // passed as clickable subId
  })
  
  return Response.json({ success: true })
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-1 text-[11px] uppercase tracking-wide">2. Cron Job Sync (Vercel/Next Cron)</h4>
                <p>
                  To sync network statistics daily, schedule a cron task calling a background synchronizer that fetches from affiliate APIs (e.g. Awin API or ShareASale Reporting API) and registers the newly fetched transactions using the identical <code className="bg-secondary px-1 py-0.5 rounded text-foreground font-mono">recordConversion</code> method.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
