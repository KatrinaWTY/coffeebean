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
  Bookmark,
  User
} from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"

// ==========================================
// Types & Data Model (Centralized)
// ==========================================

import {
  type Purpose,
  type Roast,
  type Bean,
  ALL_FLAVORS,
  ALL_PURPOSES,
} from "@/lib/types"
import initialBeans from "@/data/beans.json"

export type { Purpose, Roast, Bean }
export { ALL_FLAVORS, ALL_PURPOSES }

export const beans: Bean[] = initialBeans as Bean[]


export const REGIONS = Array.from(new Set(beans.map((b) => b.country))).sort()

// ==========================================
// Custom UI Components (Inlined)
// ==========================================

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
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
        "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      {children}
    </span>
  )
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
          <span className="font-heading text-2xl font-bold tracking-tight text-[#333]">
            Bean Directory
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
          <Link href="/brands" className={cn(
            "relative py-1 transition-colors hover:text-foreground",
            isBrands ? "text-foreground font-bold" : "text-muted-foreground"
          )}>
            Roasters
            {isBrands && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </Link>
          <Link href="/#explore" className="transition-colors hover:text-foreground py-1">
            Origins
          </Link>
          <Link href="/#explore" className="transition-colors hover:text-foreground py-1">
            Methods
          </Link>
          <Link href="/#how" className="transition-colors hover:text-foreground py-1">
            Sustainability
          </Link>
          <Link href="/contact" className={cn(
            "relative py-1 transition-colors hover:text-foreground",
            isContact ? "text-foreground font-bold" : "text-muted-foreground"
          )}>
            聯絡我們
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
              className="w-full rounded-full border border-border bg-[#FCF8F5]/50 hover:bg-[#FCF8F5] py-2 pl-9 pr-4 text-xs font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed"
            />
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Bookmarks">
            <Bookmark className="size-5" />
          </button>
          <Link
            href="/admin"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
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
          <span className="font-heading text-xl font-bold text-[#333]">
            Bean Directory
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Elevating the coffee experience through curated discovery and technical precision.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2024 Bean Directory. Brewed with precision.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#333]">Resources</h4>
            <Link href="/#explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Brewing Guides
            </Link>
            <Link href="/#explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Roasting Science
            </Link>
            <Link href="/admin" className="text-sm font-semibold text-primary hover:underline transition-colors">
              Admin Panel
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#333]">About</h4>
            <Link href="/#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Green Coffee Sourcing
            </Link>
            <Link href="/#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Accessibility
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              聯絡我們
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ==========================================
// Hero & How It Works Components
// ==========================================

export function Hero({ beans }: { beans: Bean[] }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-4 pt-12 sm:pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
            <Sparkles className="size-4" />
            Compare beans the cozy way
          </span>
          <h1 className="font-heading text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl text-balance">
            Find your perfect cup of coffee
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Browse specialty beans from around the world and compare them by
            region, flavor notes, and how you like to brew. Simple, sweet, and
            made for coffee lovers.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#explore"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore beans
            </a>
            <a
              href="#how"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              How it works
            </a>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <Stat icon={<Coffee className="size-4" />} value={beans.length.toString()} label="Beans" />
            <Stat
              icon={<Globe className="size-4" />}
              value={new Set(beans.map((b) => b.country)).size.toString()}
              label="Origins"
            />
            <Stat
              icon={<Sparkles className="size-4" />}
              value={ALL_FLAVORS.length.toString()}
              label="Flavor notes"
            />
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <Image
              src="/hero-beans.png"
              alt="Roasted coffee beans and a cup of coffee on a beige linen surface"
              width={720}
              height={620}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 font-heading text-2xl font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {value}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

const steps = [
  {
    icon: MapPin,
    title: "Pick a region",
    body: "Explore single-origin beans from Ethiopia to Sumatra and everywhere in between.",
  },
  {
    icon: Heart,
    title: "Choose your flavors",
    body: "Love it fruity, chocolatey, or floral? Filter by the notes you crave most.",
  },
  {
    icon: FlaskConical,
    title: "Match your brew",
    body: "Espresso, pour over, or cold brew — find beans that shine your way.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="bg-secondary/50">
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mb-10 flex flex-col gap-3 text-center">
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            How it works
          </h2>
          <p className="mx-auto max-w-md text-pretty leading-relaxed text-muted-foreground">
            Three little steps to your next favorite bag of beans.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <step.icon className="size-7" />
              </span>
              <span className="font-heading text-sm font-semibold text-primary">
                Step {i + 1}
              </span>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==========================================
// Bean Card & Filter Components
// ==========================================

export function BeanCard({
  bean,
  query = "",
  filters = { regions: [], flavors: [], purposes: [] },
}: {
  bean: Bean
  query?: string
  filters?: Filters
}) {
  const { brand, name: cleanedName } = useMemo(() => {
    if (bean.roaster) {
      let name = bean.name
      // If name starts with roaster prefix, clean it
      if (name.startsWith(`${bean.roaster} - `)) {
        name = name.replace(`${bean.roaster} - `, "")
      }
      return { brand: bean.roaster, name }
    }
    const parts = bean.name.split(" - ")
    const brand = parts[0]
    let name = parts.slice(1).join(" - ")
    
    // Clean up parenthesis if any (like Monmouth's " (Finca Santa Catalina)")
    name = name.replace(/^\s*\((.*)\)\s*$/, '$1').trim()
    
    // Strip country suffix (e.g. ", Brazil" or ", Colombia" or ", Ethiopia")
    const countrySuffixReg = new RegExp(`,\\s*${bean.country}\\s*$`, 'i')
    name = name.replace(countrySuffixReg, '').trim()
    
    // Strip "The Baron: ", "The Estate: ", etc.
    name = name.replace(/^(The Baron:\s*|The Estate:\s*|The Fields:\s*|Decaf:\s*)/i, '').trim()
    
    return { brand, name }
  }, [bean.name, bean.country, bean.roaster])

  const locationText = useMemo(() => {
    const loc = bean.region
      ? bean.region.toLowerCase().includes(bean.country.toLowerCase())
        ? bean.region
        : `${bean.region}, ${bean.country}`
      : bean.country
    return loc.toUpperCase()
  }, [bean.region, bean.country])

  const trackingUrl = useMemo(() => {
    if (typeof window === "undefined") return `/go/${bean.id}`
    const params = new URLSearchParams()
    params.set("path", window.location.pathname)
    if (query) params.set("q", query)
    if (filters) params.set("filters", JSON.stringify(filters))
    params.set("cta", "card")
    return `/go/${bean.id}?${params.toString()}`
  }, [bean.id, query, filters])

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[#EADFD7] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(120,80,40,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={bean.image || "/placeholder.svg"}
          alt={`${bean.name} coffee beans from ${bean.country}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute right-3 top-3 rounded-full bg-accent text-accent-foreground hover:bg-accent">
          {bean.roast}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
            <MapPin className="size-3.5 text-primary/70" />
            {locationText}
          </div>
          <h3 className="font-heading text-2xl font-bold leading-tight text-[#3C322B]">
            {cleanedName}
          </h3>
          <p className="text-xs font-semibold text-muted-foreground/80 font-sans">
            {brand}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {bean.flavors.map((f) => (
            <span
              key={f}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
              {bean.purposes.slice(0, 2).map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                >
                  {p}
                </span>
              ))}
              {bean.purposes.length > 2 && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  +{bean.purposes.length - 2}
                </span>
              )}
            </div>
          </div>
          {bean.url ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Buy Beans
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export type Filters = {
  regions: string[]
  flavors: string[]
  purposes: Purpose[]
}

export function BeanFilters({
  filters,
  setFilters,
  total,
  regions,
}: {
  filters: Filters
  setFilters: (f: Filters) => void
  total: number
  regions: string[]
}) {
  const [isRegionCollapsed, setIsRegionCollapsed] = useState(false)

  const hasActive =
    filters.regions.length > 0 || filters.flavors.length > 0 || filters.purposes.length > 0

  const toggleRegion = (region: string) => {
    setFilters({
      ...filters,
      regions: filters.regions.includes(region)
        ? filters.regions.filter((r) => r !== region)
        : [...filters.regions, region],
    })
  }

  const toggleFlavor = (flavor: string) => {
    setFilters({
      ...filters,
      flavors: filters.flavors.includes(flavor)
        ? filters.flavors.filter((f) => f !== flavor)
        : [...filters.flavors, flavor],
    })
  }

  const togglePurpose = (purpose: Purpose) => {
    setFilters({
      ...filters,
      purposes: filters.purposes.includes(purpose)
        ? filters.purposes.filter((p) => p !== purpose)
        : [...filters.purposes, purpose],
    })
  }

  // Dot colors for flavor profile groups
  const groupDots = {
    nutty: "bg-[#4E3629]", // espresso brown
    fruity: "bg-[#B33939]", // rich red/burgundy
    floral: "bg-[#8CA89E]", // soft sage green
  }

  return (
    <aside className="flex flex-col gap-6 rounded-3xl border border-[#EADFD7] bg-white p-6 shadow-xs">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-2">
        <svg className="size-6 text-[#3C322B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <h2 className="font-heading text-3xl font-bold text-[#3C322B]">
          Filters
        </h2>
      </div>

      {/* REGION SECTION */}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center justify-between cursor-pointer select-none py-2"
          onClick={() => setIsRegionCollapsed(!isRegionCollapsed)}
        >
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B5A50]">
            Region
          </h3>
          <ChevronDown
            className={cn(
              "size-4 text-[#6B5A50] transition-transform duration-200",
              isRegionCollapsed ? "" : "rotate-180"
            )}
          />
        </div>
        <div
          className={cn(
            "transition-all duration-200 overflow-hidden",
            isRegionCollapsed ? "max-h-0 opacity-0" : "opacity-100 mt-1"
          )}
        >
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {regions.map((region) => {
              const active = filters.regions.includes(region)
              return (
                <label
                  key={region}
                  className="flex cursor-pointer items-center gap-3 py-1 text-sm select-none"
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() => toggleRegion(region)}
                  />
                  <span className={cn(
                    "transition-colors text-[#3C322B]",
                    active ? "font-bold text-neutral-900" : "font-medium text-muted-foreground"
                  )}>
                    {region}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <hr className="border-t border-[#EADFD7] my-2" />

      {/* FLAVOR PROFILES SECTION */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B5A50]">
          Flavor Profiles
        </h3>

        {/* Nutty & Cocoa */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3C322B] mt-1">
            <span className={cn("size-2.5 rounded-full", groupDots.nutty)} />
            Nutty & Cocoa
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Chocolate", "Caramel", "Nutty", "Earthy"].map((flavor) => {
              const active = filters.flavors.includes(flavor)
              return (
                <button
                  key={flavor}
                  onClick={() => toggleFlavor(flavor)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                    active
                      ? "bg-[#22150D] text-white border-transparent"
                      : "bg-white hover:bg-neutral-50/50 text-[#3C322B] border-[#E2D8D0]"
                  )}
                >
                  {flavor}
                </button>
              )
            })}
          </div>
        </div>

        {/* Fruity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3C322B] mt-2">
            <span className={cn("size-2.5 rounded-full", groupDots.fruity)} />
            Fruity
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Citrus", "Stone Fruit", "Berry"].map((flavor) => {
              const active = filters.flavors.includes(flavor)
              return (
                <button
                  key={flavor}
                  onClick={() => toggleFlavor(flavor)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                    active
                      ? "bg-[#22150D] text-white border-transparent"
                      : "bg-white hover:bg-neutral-50/50 text-[#3C322B] border-[#E2D8D0]"
                  )}
                >
                  {flavor}
                </button>
              )
            })}
          </div>
        </div>

        {/* Floral & Sweet */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3C322B] mt-2">
            <span className={cn("size-2.5 rounded-full", groupDots.floral)} />
            Floral & Sweet
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Floral", "Honey", "Spice"].map((flavor) => {
              const active = filters.flavors.includes(flavor)
              return (
                <button
                  key={flavor}
                  onClick={() => toggleFlavor(flavor)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer",
                    active
                      ? "bg-[#22150D] text-white border-transparent"
                      : "bg-white hover:bg-neutral-50/50 text-[#3C322B] border-[#E2D8D0]"
                  )}
                >
                  {flavor}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <hr className="border-t border-[#EADFD7] my-2" />

      {/* BREW METHOD SECTION */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B5A50]">
          Brew Method
        </h3>
        <div className="flex flex-col gap-2.5 mt-1">
          {ALL_PURPOSES.map((purpose) => {
            const active = filters.purposes.includes(purpose)

            let iconSvg = null
            if (purpose === "Espresso") {
              iconSvg = (
                <svg className={cn("size-5 transition-colors", active ? "text-[#22150D]" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="16" x2="16" y2="16" />
                  <path d="M12 5v14" />
                  <path d="M10 5h4" />
                  <path d="M10 19h4" />
                </svg>
              )
            } else if (purpose === "Pour Over") {
              iconSvg = (
                <svg className={cn("size-5 transition-colors", active ? "text-[#22150D]" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6h12l-3 9H9z" />
                  <path d="M5 18h14" />
                  <path d="M18 8a2 2 0 0 1 0 4" />
                  <path d="M12 15v1" />
                </svg>
              )
            } else if (purpose === "Cold Brew") {
              iconSvg = (
                <svg className={cn("size-5 transition-colors", active ? "text-[#22150D]" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="7" />
                  <path d="M12 9v4l2.5 2.5" />
                  <path d="M12 2v2" />
                  <path d="M10 2h4" />
                  <path d="M19 6l-1.5 1.5" />
                </svg>
              )
            } else if (purpose === "Drip") {
              iconSvg = (
                <svg className={cn("size-5 transition-colors", active ? "text-[#22150D]" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M6 8h12" />
                  <path d="M14 12a2 2 0 1 1-4 0v-1h4v1z" />
                  <circle cx="12" cy="16" r="1" />
                </svg>
              )
            } else if (purpose === "French Press") {
              iconSvg = (
                <svg className={cn("size-5 transition-colors", active ? "text-[#22150D]" : "text-muted-foreground")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 5h10v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5z" />
                  <path d="M7 8H5v8h2" />
                  <path d="M12 2v3" />
                  <path d="M9 5h6" />
                  <circle cx="12" cy="2" r="1" />
                  <path d="M8 12h8" />
                </svg>
              )
            }

            return (
              <div
                key={purpose}
                onClick={() => togglePurpose(purpose)}
                className={cn(
                  "w-full p-3.5 px-4 rounded-2xl flex items-center justify-between cursor-pointer border transition-all select-none bg-[#FAF5F0]/30 hover:bg-[#F3ECE5]/50 border-[#EADFD7] text-[#3C322B]",
                  active && "bg-[#FAF5F0] border-neutral-900 text-neutral-900 shadow-xs font-bold"
                )}
              >
                <div className="flex items-center gap-3.5">
                  {iconSvg}
                  <span className="text-sm font-semibold tracking-tight">{purpose}</span>
                </div>
                <div className={cn(
                  "size-4.5 rounded-[5px] border flex items-center justify-center transition-colors shrink-0",
                  active
                    ? "bg-neutral-900 border-neutral-900 text-white"
                    : "border-[#C5B7AE] bg-transparent"
                )}>
                  {active && <CheckIcon className="size-3 stroke-[3]" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <hr className="border-t border-[#EADFD7] my-2" />

      {/* Clear Filters Button */}
      <button
        onClick={() => setFilters({ regions: [], flavors: [], purposes: [] })}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#EFE9E4] hover:bg-[#E5DCD6] py-3.5 text-xs font-bold uppercase tracking-wider text-[#3C322B] transition-colors cursor-pointer"
      >
        Clear Filters
        <X className="size-4" />
      </button>
    </aside>
  )
}


// ==========================================
// Bean Explorer Component
// ==========================================

export function BeanExplorer({
  query,
  setQuery,
  beans,
}: {
  query: string
  setQuery: (q: string) => void
  beans: Bean[]
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    regions: [],
    flavors: [],
    purposes: [],
  })

  const regions = useMemo(() => {
    return Array.from(new Set(beans.map((b) => b.country))).sort()
  }, [beans])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return beans.filter((bean) => {
      // 1. Region Filter
      if (filters.regions.length > 0) {
        if (!filters.regions.includes(bean.country)) return false
      }

      // 2. Flavor Filter
      if (
        filters.flavors.length > 0 &&
        !filters.flavors.every((f) => bean.flavors.includes(f))
      )
        return false

      // 3. Brew Method Filter
      if (
        filters.purposes.length > 0 &&
        !filters.purposes.some((p) => bean.purposes.includes(p))
      )
        return false

      // 4. Search text filter
      if (q) {
        const haystack = [
          bean.name,
          bean.country,
          bean.region,
          bean.roast,
          ...bean.flavors,
          ...bean.purposes,
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [query, filters, beans])

  return (
    <section id="explore" className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="mb-8 flex flex-col gap-3 text-center">
        <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl text-balance">
          Find your perfect bean
        </h2>
        <p className="mx-auto max-w-md text-pretty leading-relaxed text-muted-foreground">
          Search and filter by where it&apos;s grown, how it tastes, and the way
          you love to brew.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search beans, regions, or flavors..."
            className="w-full rounded-full border border-border bg-card py-3.5 pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
            <BeanFilters
              filters={filters}
              setFilters={setFilters}
              total={results.length}
              regions={regions}
            />
          </div>
        </div>

        <div>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((bean) => (
                <BeanCard key={bean.id} bean={bean} query={query} filters={filters} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <p className="font-heading text-xl font-semibold text-foreground">
                No beans match yet
              </p>
              <p className="text-sm text-muted-foreground">
                Try clearing a filter or searching something else.
              </p>
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
    <main className="min-h-screen bg-[#FCF8F5] text-foreground">
      <SiteHeader searchQuery={query} setSearchQuery={setQuery} placeholder="Search beans..." />
      <Hero beans={liveBeans} />
      <HowItWorks />
      <BeanExplorer query={query} setQuery={setQuery} beans={liveBeans} />
      <SiteFooter />
    </main>
  )
}
