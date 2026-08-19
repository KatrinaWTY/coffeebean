"use client"

import { useMemo, useState, useEffect } from "react"
import { getLiveBeansAction } from "@/app/admin/actions"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Coffee,
  Globe,
  Sparkles,
  MapPin,
  Heart,
  FlaskConical,
  Search,
  SlidersHorizontal,
  X,
  Check as CheckIcon,
  ChevronDown,
  ChevronUp,
  Bookmark,
  User,
  Info
} from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"

import {
  type Purpose,
  type Roast,
  type Bean,
  ALL_FLAVORS,
  ALL_PURPOSES,
} from "@/lib/types"
import initialBeans from "@/data/beans.json"

export type { Purpose, Roast, Bean }

// ==========================================
// Custom UI Components (Inlined)
// ==========================================

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      {children}
    </span>
  )
}

// ==========================================
// Helper functions
// ==========================================

function getWeightInGrams(weight?: string): number {
  if (!weight) return 250
  const match = weight.match(/(\d+(?:\.\d+)?)\s*(g|kg)/i)
  if (!match) return 250
  const num = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  if (unit === 'kg') return num * 1000
  return num
}

function calculatePricePer100g(price: number, weight?: string): number {
  const weightG = getWeightInGrams(weight)
  return (price / weightG) * 100
}

function getFlavorEmoji(flavor: string): string {
  const mapping: Record<string, string> = {
    "Chocolate": "🍫",
    "Caramel": "🍯",
    "Nutty": "🥜",
    "Honey": "🍯",
    "Floral": "🌸",
    "Berry": "🍓",
    "Citrus": "🍋",
    "Stone Fruit": "🍑",
    "Spice": "🌶️",
    "Earthy": "🪵",
    "Tropical Fruit": "🍍",
    "Vanilla": "🍦",
    "Jasmine": "🌸",
    "Blueberry": "🫐",
    "Apple": "🍎",
    "Peach": "🍑"
  }
  return mapping[flavor] || "☕"
}

function getRecommendedUses(bean: Bean): string[] {
  const uses: string[] = []
  if (bean.purposes.includes("Espresso")) {
    uses.push("Espresso")
  }
  const hasFilter = bean.purposes.some(p => 
    ["Pour Over", "Drip", "French Press", "Aeropress", "Moka Pot"].includes(p)
  )
  if (hasFilter) {
    uses.push("Filter")
  }
  const suitableForMilk = 
    bean.roast === "Medium" || 
    bean.roast === "Medium-Dark" || 
    bean.roast === "Dark" || 
    bean.flavors.some(f => ["Chocolate", "Nutty", "Caramel", "Honey"].includes(f)) ||
    bean.purposes.includes("Espresso");
  if (suitableForMilk) {
    uses.push("With Milk")
  } else {
    uses.push("Black")
  }
  return uses
}

function getRecommendationBadge(bean: Bean, isBestMatch: boolean): string | null {
  if (isBestMatch) return "Best Match"
  const isBeginnerFriendly = 
    (bean.roast === "Medium" || bean.roast === "Medium-Dark") &&
    (bean.flavors.includes("Chocolate") || bean.flavors.includes("Nutty") || bean.flavors.includes("Caramel")) &&
    bean.acidity <= 3;
  if (isBeginnerFriendly) return "Beginner Friendly"
  const isEasyChoice = bean.rating >= 4.4 && bean.roast === "Medium";
  if (isEasyChoice) return "Easy Choice"
  const isTrySomethingNew = 
    bean.roast === "Light" || 
    bean.process === "Anaerobic" || 
    bean.process === "Natural" || 
    bean.flavors.includes("Floral") || 
    bean.flavors.includes("Tropical Fruit") ||
    bean.flavors.includes("Berry");
  if (isTrySomethingNew) return "Try Something New"
  return null
}

function matchAltitudeRange(altitudeStr?: string, range?: string): boolean {
  if (!range || !altitudeStr) return true
  const numMatch = altitudeStr.match(/(\d{1,3}(?:,\d{3})*)/)
  if (!numMatch) return true
  const elevation = parseInt(numMatch[1].replace(/,/g, ""), 10)
  if (range === "low") return elevation < 1200
  if (range === "mid") return elevation >= 1200 && elevation <= 1600
  if (range === "high") return elevation > 1600
  return true
}

// ==========================================
// App Layout Components
// ==========================================

export function SiteHeader({ 
  searchQuery, 
  setSearchQuery,
  placeholder = "Search..." 
}: { 
  searchQuery?: string
  setSearchQuery?: (q: string) => void
  placeholder?: string
}) {
  const pathname = usePathname()
  const isBrands = pathname === "/brands"
  const isContact = pathname === "/contact"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#FCF8F5]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold tracking-tight text-[#3C322B]">
            ☕ Bean Buddy
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
          <Link href="/brands" className={cn(
            "relative py-1 transition-colors hover:text-[#3C322B]",
            isBrands ? "text-[#3C322B] font-bold" : "text-muted-foreground"
          )}>
            Roasters
            {isBrands && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </Link>
          <Link href="/#explore" className="transition-colors hover:text-[#3C322B] py-1">
            Origins
          </Link>
          <Link href="/#explore" className="transition-colors hover:text-[#3C322B] py-1">
            Methods
          </Link>
          <Link href="/contact" className={cn(
            "relative py-1 transition-colors hover:text-[#3C322B]",
            isContact ? "text-[#3C322B] font-bold" : "text-muted-foreground"
          )}>
            Contact
            {isContact && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </Link>
        </nav>

        {/* Search & Icons */}
        <div className="flex items-center gap-4">
          <div className="relative w-40 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              disabled={!setSearchQuery}
              className="w-full rounded-full border border-border bg-[#FCF8F5]/50 hover:bg-[#FCF8F5] py-2 pl-9 pr-4 text-xs font-semibold text-[#3C322B] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed"
            />
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Bookmarks">
            <Bookmark className="size-5" />
          </button>
          <Link
            href="/admin"
            className="p-2 text-muted-foreground hover:text-[#3C322B] transition-colors"
            aria-label="Admin Portal"
            title="Admin Portal"
          >
            <User className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#FCF8F5] py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 md:flex-row md:justify-between md:items-start">
        <div className="flex flex-col gap-3 max-w-sm">
          <span className="font-heading text-xl font-bold text-[#3C322B]">
            ☕ Bean Buddy
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Helping normal coffee lovers discover and compare specialty beans without the technical jargon.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2026 Bean Buddy. Designed with love.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3C322B]">Explore</h4>
            <Link href="/#explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Taste Categories
            </Link>
            <Link href="/brands" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Roasters
            </Link>
            <Link href="/admin" className="text-sm font-semibold text-primary hover:underline transition-colors">
              Admin Area
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3C322B]">About</h4>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
            <p className="text-[10px] text-muted-foreground max-w-xs mt-2 italic leading-snug">
              We may earn an affiliate commission when you click and purchase coffee beans from our roaster links, at no extra cost to you.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ==========================================
// Hero Component
// ==========================================

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-4 pt-12 sm:pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/60 px-4 py-1.5 text-xs font-bold text-accent-foreground">
            <Sparkles className="size-4 text-amber-700" />
            Specialty coffee discovery, made simple
          </span>
          <h1 className="font-heading text-5xl font-extrabold leading-[1.05] text-[#3C322B] sm:text-6xl text-balance">
            Find coffee that fits your taste
          </h1>
          <p className="max-w-md text-pretty text-base sm:text-lg leading-relaxed text-muted-foreground">
            No technical snobbery here. Browse delicious beans based on what you actually like—from comforting chocolatey notes to bright and fruity vibes.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#explore"
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/95 shadow-sm hover:translate-y-[-1px]"
            >
              Start Discovering
            </a>
            <a
              href="#explore"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-bold text-neutral-700 transition-all hover:bg-neutral-50"
            >
              Browse All Beans
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] border border-[#EADFD7] bg-white p-3 shadow-xs">
            <Image
              src="/hero-beans.png"
              alt="Roasted coffee beans on a cozy natural wooden plate"
              width={720}
              height={620}
              className="h-full w-full object-cover rounded-[1.8rem]"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ==========================================
// Bean Card Component
// ==========================================

export function BeanCard({
  bean,
  query = "",
  filters = {},
  isBestMatch = false
}: {
  bean: Bean
  query?: string
  filters?: any
  isBestMatch?: boolean
}) {
  const cleanedName = useMemo(() => {
    let name = bean.name
    if (bean.roaster && name.startsWith(`${bean.roaster} - `)) {
      name = name.replace(`${bean.roaster} - `, "")
    }
    // Strip country suffix (e.g. ", Brazil" or ", Colombia" or ", Ethiopia")
    const countrySuffixReg = new RegExp(`,\\s*${bean.country}\\s*$`, 'i')
    name = name.replace(countrySuffixReg, '').trim()
    // Strip "The Baron: ", "The Estate: ", etc. if too wordy
    name = name.replace(/^(The Baron:\s*|The Estate:\s*|The Fields:\s*|Decaf:\s*)/i, '').trim()
    return name
  }, [bean.name, bean.country, bean.roaster])

  const trackingUrl = useMemo(() => {
    if (typeof window === "undefined") return `/go/${bean.id}`
    const params = new URLSearchParams()
    params.set("path", window.location.pathname)
    if (query) params.set("q", query)
    if (filters) params.set("filters", JSON.stringify(filters))
    params.set("cta", "card")
    return `/go/${bean.id}?${params.toString()}`
  }, [bean.id, query, filters])

  const badge = useMemo(() => getRecommendationBadge(bean, isBestMatch), [bean, isBestMatch])
  const recommendedUses = useMemo(() => getRecommendedUses(bean), [bean])
  const pricePer100g = useMemo(() => calculatePricePer100g(bean.price, bean.weight), [bean.price, bean.weight])

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[#EADFD7] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(120,80,40,0.35)]">
      {/* Visual Header clickable to Detail page */}
      <Link href={`/beans/${bean.id}`} className="block flex-1 relative">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={bean.image || "/placeholder.svg"}
            alt={`${bean.name} coffee beans from ${bean.country}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Dynamic Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
            {badge && (
              <span className={cn(
                "rounded-full text-[9px] font-extrabold px-2.5 py-1 uppercase tracking-wider shadow-sm text-white",
                badge === "Best Match" ? "bg-amber-800" :
                badge === "Beginner Friendly" ? "bg-emerald-700" :
                badge === "Easy Choice" ? "bg-blue-700" : "bg-purple-700"
              )}>
                {badge}
              </span>
            )}
          </div>
          
          <span className="absolute right-3 top-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[9px] font-bold text-neutral-800 shadow-sm border border-neutral-200/50 uppercase tracking-wide">
            {bean.roast} Roast
          </span>
        </div>

        {/* Content Details */}
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold tracking-wider text-muted-foreground/80 uppercase">
              {bean.roaster}
            </span>
            <h3 className="font-heading text-xl font-bold leading-snug text-[#3C322B] group-hover:text-primary transition-colors line-clamp-1">
              {cleanedName}
            </h3>
          </div>

          {/* Simple Taste Notes */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#5c4a3e]">
            {bean.flavors.map((f, i) => (
              <span key={f} className="inline-flex items-center bg-secondary/40 rounded-full px-2 py-0.5 text-[11px]">
                <span className="mr-1">{getFlavorEmoji(f)}</span> {f}
              </span>
            ))}
          </div>

          {/* Short beginner friendly description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {bean.blurb}
          </p>

          {/* Recommended Brew */}
          <div className="text-[11px] font-bold text-[#6D5A50] bg-[#FAF8F5] border border-[#EADFD7]/60 rounded-xl p-2 px-3 w-fit mt-1">
            Best for: <span className="text-[#3C322B] font-extrabold">{recommendedUses.join(" · ")}</span>
          </div>
        </div>
      </Link>

      {/* Pricing & CTA Section */}
      <div className="p-5 pt-0 border-t border-dashed border-[#EADFD7]/50 mt-auto">
        <div className="mt-4 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Purchase Price</span>
            <span className="font-heading text-lg font-black text-[#3C322B]">
              £{bean.price.toFixed(2)} · <span className="text-sm font-semibold text-neutral-500">{bean.weight || "250g"}</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-neutral-600">
              £{pricePer100g.toFixed(2)} / 100g
            </span>
          </div>
        </div>

        {/* Variants indicator */}
        {bean.variants && bean.variants.length > 1 && (
          <div className="mt-2 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 w-max">
            ✨ Other sizes available
          </div>
        )}

        {/* Affiliate Link */}
        <div className="mt-4 flex flex-col gap-1.5">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center rounded-full bg-primary hover:bg-primary/95 text-primary-foreground py-2.5 text-xs font-extrabold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1"
          >
            <span>View at {bean.roaster}</span>
            <span>→</span>
          </a>
          <p className="text-[9px] text-center text-muted-foreground/60 leading-tight">
            We may earn a commission if you purchase through this link, at no extra cost to you.
          </p>
        </div>
      </div>
    </article>
  )
}

// ==========================================
// Bean Explorer / Discovery Component
// ==========================================

export type Filters = {
  regions: string[]
  flavors: string[]
  purposes: Purpose[]
  roasts: Roast[]
  maxPrice: number | null
  countries: string[]
  processes: string[]
  varieties: string[]
  altitudeRange: string | null // "low", "mid", "high"
}

export function BeanExplorer({
  query,
  setQuery,
  beans,
}: {
  query: string
  setQuery: (q: string) => void
  beans: Bean[]
}) {
  const [selectedFlavorCategory, setSelectedFlavorCategory] = useState<string | null>(null)
  const [drinkingStyle, setDrinkingStyle] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("recommended")
  
  // Advanced filters accordion toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)

  const [filters, setFilters] = useState<Filters>({
    regions: [],
    flavors: [],
    purposes: [],
    roasts: [],
    maxPrice: null,
    countries: [],
    processes: [],
    varieties: [],
    altitudeRange: null,
  })

  // Extract lists dynamically from data
  const countries = useMemo(() => Array.from(new Set(beans.map((b) => b.country))).sort(), [beans])
  const processes = useMemo(() => Array.from(new Set(beans.map((b) => b.process).filter(Boolean))) as string[], [beans])
  
  // Flavor Category definitions
  const flavorCategories = [
    {
      id: "chocolatey",
      name: "Chocolatey & comforting",
      emoji: "🍫",
      description: "Cocoa, nuts, sweet cookies",
      flavors: ["Chocolate", "Nutty", "Earthy"]
    },
    {
      id: "nutty",
      name: "Nutty & smooth",
      emoji: "🥜",
      description: "Caramel, roasted nuts, hazelnut",
      flavors: ["Nutty", "Caramel"]
    },
    {
      id: "sweet",
      name: "Sweet & balanced",
      emoji: "🍯",
      description: "Honey, brown sugar, vanilla",
      flavors: ["Caramel", "Honey", "Vanilla", "Peach"]
    },
    {
      id: "fruity",
      name: "Fruity & bright",
      emoji: "🍓",
      description: "Berries, citrus fruits, stone fruits",
      flavors: ["Citrus", "Stone Fruit", "Berry", "Tropical Fruit", "Blueberry", "Apple", "Peach"]
    },
    {
      id: "floral",
      name: "Floral & light",
      emoji: "🌸",
      description: "Jasmine, flower blossoms, tea-like",
      flavors: ["Floral", "Jasmine"]
    }
  ]

  // Clean filters helper
  const handleClearFilters = () => {
    setSelectedFlavorCategory(null)
    setDrinkingStyle(null)
    setFilters({
      regions: [],
      flavors: [],
      purposes: [],
      roasts: [],
      maxPrice: null,
      countries: [],
      processes: [],
      varieties: [],
      altitudeRange: null,
    })
  }

  // Toggles for checkboxes
  const toggleFilterArray = (key: keyof Filters, value: any) => {
    const arr = filters[key] as any[]
    setFilters({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
    })
  }

  // Matching logic
  const filteredAndSortedBeans = useMemo(() => {
    const q = query.trim().toLowerCase()

    // 1. First, apply filters
    let results = beans.filter((bean) => {
      
      // A. Vibe Category Filter (intersection)
      if (selectedFlavorCategory) {
        const cat = flavorCategories.find(c => c.id === selectedFlavorCategory)
        if (cat) {
          const matchesCategory = bean.flavors.some(f => cat.flavors.includes(f))
          if (!matchesCategory) return false
        }
      }

      // B. How do you drink coffee?
      if (drinkingStyle) {
        if (drinkingStyle === "milk") {
          const suitable = bean.roast === "Medium" || bean.roast === "Medium-Dark" || bean.roast === "Dark" || bean.flavors.some(f => ["Chocolate", "Nutty", "Caramel", "Honey"].includes(f)) || bean.purposes.includes("Espresso");
          if (!suitable) return false
        } else if (drinkingStyle === "black") {
          const suitable = bean.roast === "Light" || bean.roast === "Medium" || bean.purposes.some(p => ["Pour Over", "Drip", "French Press", "Aeropress"].includes(p));
          if (!suitable) return false
        } else if (drinkingStyle === "espresso") {
          if (!bean.purposes.includes("Espresso")) return false
        } else if (drinkingStyle === "filter") {
          const hasFilter = bean.purposes.some(p => ["Pour Over", "Drip", "French Press", "Aeropress", "Moka Pot", "Cold Brew"].includes(p))
          if (!hasFilter) return false
        }
      }

      // C. Simple Taste Profile Filters
      if (filters.flavors.length > 0) {
        if (!filters.flavors.every(f => bean.flavors.includes(f))) return false
      }

      // D. Price limit (absolute price)
      if (filters.maxPrice !== null) {
        if (bean.price > filters.maxPrice) return false
      }

      // E. Roast Levels
      if (filters.roasts.length > 0) {
        if (!filters.roasts.includes(bean.roast)) return false
      }

      // F. Technical - Origin Countries
      if (filters.countries.length > 0) {
        if (!filters.countries.includes(bean.country)) return false
      }

      // G. Technical - Process Method
      if (filters.processes.length > 0) {
        if (!bean.process || !filters.processes.includes(bean.process)) return false
      }

      // H. Technical - Altitude
      if (filters.altitudeRange !== null) {
        if (!matchAltitudeRange(bean.altitude, filters.altitudeRange)) return false
      }

      // I. Search Text
      if (q) {
        const haystack = [
          bean.name,
          bean.roaster,
          bean.country,
          bean.region,
          bean.roast,
          bean.process,
          bean.variety,
          ...bean.flavors,
          ...bean.purposes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })

    // 2. Sort results
    if (sortBy === "priceAsc") {
      // Sort by price per 100g (low to high)
      results.sort((a, b) => {
        const priceA = calculatePricePer100g(a.price, a.weight)
        const priceB = calculatePricePer100g(b.price, b.weight)
        return priceA - priceB
      })
    } else if (sortBy === "priceDesc") {
      // Sort by price per 100g (high to low)
      results.sort((a, b) => {
        const priceA = calculatePricePer100g(a.price, a.weight)
        const priceB = calculatePricePer100g(b.price, b.weight)
        return priceB - priceA
      })
    } else if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating)
    } else {
      // Recommended: featured first, then rating
      results.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return b.rating - a.rating
      })
    }

    return results
  }, [query, selectedFlavorCategory, drinkingStyle, filters, sortBy, beans])

  // Identify Best Match (top rated bean in filtered list)
  const bestMatchId = useMemo(() => {
    if (filteredAndSortedBeans.length === 0) return null
    let best = filteredAndSortedBeans[0]
    for (let i = 1; i < filteredAndSortedBeans.length; i++) {
      if (filteredAndSortedBeans[i].rating > best.rating) {
        best = filteredAndSortedBeans[i]
      }
    }
    return best.id
  }, [filteredAndSortedBeans])

  return (
    <section id="explore" className="mx-auto w-full max-w-6xl px-5 py-12 scroll-mt-20">
      
      {/* Discovery Section Heading */}
      <div className="mb-10 text-center max-w-xl mx-auto flex flex-col gap-2">
        <h2 className="font-heading text-3xl font-bold text-[#3C322B] sm:text-4xl">
          Bean Finder
        </h2>
        <p className="text-sm text-muted-foreground">
          Find your next favorite bag of coffee. Choose a flavour profile or select how you brew.
        </p>
      </div>

      {/* ==========================================
          STEP 1: FLAVOUR VIBES (At the top)
          ========================================== */}
      <div className="mb-10">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#6D5A50] text-center mb-6">
          1. Choose your flavour profile
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {flavorCategories.map((cat) => {
            const active = selectedFlavorCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedFlavorCategory(active ? null : cat.id)}
                className={cn(
                  "flex flex-col items-center text-center p-5 rounded-3xl border transition-all cursor-pointer select-none",
                  active
                    ? "bg-[#FAF5F0] border-[#3C322B] ring-2 ring-[#3C322B]/20 scale-[1.02] shadow-xs"
                    : "bg-white border-[#EADFD7] hover:bg-neutral-50 hover:translate-y-[-2px] shadow-2xs"
                )}
              >
                <span className="text-4xl mb-3 block transform transition-transform group-hover:scale-110">{cat.emoji}</span>
                <span className="font-bold text-sm text-[#3C322B] leading-tight mb-1">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground leading-normal">{cat.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==========================================
          STEP 2: DRINKING STYLE (At the top)
          ========================================== */}
      <div className="mb-12 border-b border-[#EADFD7]/60 pb-8">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#6D5A50] text-center mb-5">
          2. How do you drink your coffee?
        </h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: "milk", label: "🥛 With Milk", desc: "Best for Latte, Flat White, Cappuccino" },
            { id: "black", label: "☕ Black", desc: "Smooth, clean single origins" },
            { id: "espresso", label: "⚡ Espresso", desc: "Rich shots and stovetop makers" },
            { id: "filter", label: "💧 Filter", desc: "Pour over, French press, drip makers" },
            { id: "not-sure", label: "🤷 Not Sure", desc: "Show me all starter options" }
          ].map((style) => {
            const active = style.id === "not-sure" ? drinkingStyle === null : drinkingStyle === style.id
            return (
              <button
                key={style.id}
                onClick={() => setDrinkingStyle(style.id === "not-sure" ? null : style.id)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-xs font-bold transition-all border cursor-pointer select-none",
                  active
                    ? "bg-[#3C322B] text-white border-transparent shadow-xs"
                    : "bg-white text-neutral-700 border-[#EADFD7] hover:bg-neutral-50"
                )}
                title={style.desc}
              >
                {style.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ==========================================
          STEP 3: MAIN LISTING + FILTERS
          ========================================== */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        
        {/* FILTERS PANEL (LEFT) */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-[#3C322B]">Filters</h3>
            
            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Reset all
            </button>
          </div>

          <div className="rounded-3xl border border-[#EADFD7] bg-white p-5 space-y-5">
            {/* SEARCH BOX WITHIN FILTERS FOR MOBILE */}
            <div className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roaster or keyword..."
                className="w-full rounded-2xl border border-border bg-[#FCF8F5]/50 py-2.5 pl-9 pr-4 text-xs font-semibold text-[#3C322B] outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Price Filter (Simple) */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]">Max Price</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: null, label: "Any" },
                  { value: 5, label: "£5" },
                  { value: 10, label: "£10" },
                  { value: 15, label: "£15" },
                  { value: 20, label: "£20" }
                ].map((p) => {
                  const active = filters.maxPrice === p.value
                  return (
                    <button
                      key={p.label}
                      onClick={() => setFilters({ ...filters, maxPrice: p.value })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer",
                        active
                          ? "bg-[#3C322B] text-white border-transparent"
                          : "bg-[#FCF8F5] text-neutral-600 border-[#EADFD7] hover:bg-neutral-100"
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Roast Level Filter (Simple) */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]">Roast Level</span>
              <div className="flex flex-col gap-2">
                {["Light", "Medium", "Medium-Dark", "Dark"].map((roast) => {
                  const active = filters.roasts.includes(roast as Roast)
                  return (
                    <label key={roast} className="flex cursor-pointer items-center gap-3 text-xs font-bold text-neutral-700 select-none">
                      <Checkbox
                        checked={active}
                        onCheckedChange={() => toggleFilterArray("roasts", roast)}
                      />
                      <span className={active ? "text-neutral-900 font-extrabold" : "font-medium"}>
                        {roast}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Taste Profile Tags */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]">Specific Flavors</span>
              <div className="flex flex-wrap gap-1.5">
                {["Chocolate", "Nutty", "Caramel", "Honey", "Floral", "Berry", "Citrus", "Stone Fruit"].map((flavor) => {
                  const active = filters.flavors.includes(flavor)
                  return (
                    <button
                      key={flavor}
                      onClick={() => toggleFilterArray("flavors", flavor)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer",
                        active
                          ? "bg-[#3C322B] text-white border-transparent"
                          : "bg-white text-neutral-600 border-[#EADFD7] hover:bg-neutral-50"
                      )}
                    >
                      {getFlavorEmoji(flavor)} {flavor}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ADVANCED "MORE FILTERS" ACCORDION */}
            <div className="border-t border-[#EADFD7] pt-4 mt-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[#6D5A50] hover:text-[#3C322B] cursor-pointer"
              >
                <span>⚙️ Technical Filters</span>
                {showAdvancedFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>

              {showAdvancedFilters && (
                <div className="space-y-4 pt-3 transition-all duration-300">
                  {/* Country Origin */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]/80">Country</span>
                    <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {countries.map((country) => {
                        const active = filters.countries.includes(country)
                        return (
                          <label key={country} className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-neutral-600 select-none">
                            <Checkbox
                              checked={active}
                              onCheckedChange={() => toggleFilterArray("countries", country)}
                            />
                            <span className={active ? "text-neutral-900 font-bold" : ""}>{country}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Processing Method */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]/80">Process Method</span>
                    <div className="flex flex-wrap gap-1.5">
                      {processes.map((proc) => {
                        const active = filters.processes.includes(proc)
                        return (
                          <button
                            key={proc}
                            onClick={() => toggleFilterArray("processes", proc)}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all cursor-pointer",
                              active
                                ? "bg-[#3C322B] text-white border-transparent"
                                : "bg-white text-neutral-500 border-[#EADFD7] hover:bg-neutral-50"
                            )}
                          >
                            {proc}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Altitude */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]/80">Altitude (Elevation)</span>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { value: "low", label: "Low Elevation (Under 1,200m)" },
                        { value: "mid", label: "Medium Elevation (1,200m - 1,600m)" },
                        { value: "high", label: "High Elevation (Over 1,600m)" }
                      ].map((alt) => {
                        const active = filters.altitudeRange === alt.value
                        return (
                          <label key={alt.value} className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-600 select-none">
                            <input
                              type="radio"
                              name="altitudeRange"
                              checked={active}
                              onChange={() => setFilters({ ...filters, altitudeRange: active ? null : alt.value })}
                              onClick={() => {
                                if (active) {
                                  setFilters({ ...filters, altitudeRange: null })
                                }
                              }}
                              className="size-3.5 accent-[#3C322B]"
                            />
                            <span className={active ? "text-neutral-900 font-bold" : ""}>{alt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* RESULTS GRID (RIGHT) */}
        <div>
          {/* List Toolbar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-lg font-bold text-[#3C322B]">
                {filteredAndSortedBeans.length} {filteredAndSortedBeans.length === 1 ? 'coffee matching' : 'coffees found'}
              </span>
              {(selectedFlavorCategory || drinkingStyle) && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  {selectedFlavorCategory && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                      Vibe: {flavorCategories.find(c => c.id === selectedFlavorCategory)?.name.split(" ")[0]}
                      <X className="size-3 cursor-pointer ml-1" onClick={() => setSelectedFlavorCategory(null)} />
                    </span>
                  )}
                  {drinkingStyle && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[10px] font-bold text-neutral-800 uppercase tracking-wide">
                      Brew: {drinkingStyle}
                      <X className="size-3 cursor-pointer ml-1" onClick={() => setDrinkingStyle(null)} />
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-[#EADFD7] bg-white py-2 px-3 text-xs font-bold text-[#3C322B] focus:border-primary outline-none cursor-pointer"
              >
                <option value="recommended">⭐ Recommended</option>
                <option value="priceAsc">📈 Price: Low to High (per 100g)</option>
                <option value="priceDesc">📉 Price: High to Low (per 100g)</option>
                <option value="rating">🏆 Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Beans Loop */}
          {filteredAndSortedBeans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAndSortedBeans.map((bean) => (
                <BeanCard
                  key={bean.id}
                  bean={bean}
                  query={query}
                  filters={filters}
                  isBestMatch={bean.id === bestMatchId && (selectedFlavorCategory !== null || drinkingStyle !== null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-[#EADFD7] bg-white px-6 py-20 text-center">
              <span className="text-4xl">🤷‍♂️</span>
              <p className="font-heading text-xl font-bold text-[#3C322B]">
                No coffees match your preferences
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try selecting a different flavor profile, removing filters, or clearing your search term.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-2 rounded-full bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 transition-all shadow-2xs"
              >
                Start Fresh
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}

// ==========================================
// Main Page Component
// ==========================================

export default function Page() {
  const [query, setQuery] = useState("")
  const [liveBeans, setLiveBeans] = useState<Bean[]>(initialBeans as Bean[])

  // 1. Fetch live beans on mount
  useEffect(() => {
    getLiveBeansAction()
      .then((res) => {
        if (res && res.length > 0) {
          setLiveBeans(res)
        }
      })
      .catch((err) => console.error("Failed to load live beans:", err))
  }, [])

  // 2. Capture and store incoming UTM attributes in cookies
  useEffect(() => {
    if (typeof window === "undefined") return

    const searchParams = new URLSearchParams(window.location.search)
    const utmSource = searchParams.get("utm_source")
    const utmMedium = searchParams.get("utm_medium")
    const utmCampaign = searchParams.get("utm_campaign")

    const setCookie = (name: string, value: string) => {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }

    if (utmSource) setCookie("bean_buddy_utm_source", utmSource)
    if (utmMedium) setCookie("bean_buddy_utm_medium", utmMedium)
    if (utmCampaign) setCookie("bean_buddy_utm_campaign", utmCampaign)
  }, [])

  return (
    <main className="min-h-screen bg-[#FCF8F5] text-foreground font-sans">
      <SiteHeader searchQuery={query} setSearchQuery={setQuery} placeholder="Search coffee beans or roasters..." />
      <Hero />
      <BeanExplorer query={query} setQuery={setQuery} beans={liveBeans} />
      <SiteFooter />
    </main>
  )
}
