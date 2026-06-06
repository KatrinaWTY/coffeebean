"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Coffee,
  Globe,
  Sparkles,
  MapPin,
  Heart,
  FlaskConical,
  Search,
  SlidersHorizontal,
  Star,
  X,
  Check as CheckIcon,
} from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"

// ==========================================
// Types & Data Model
// ==========================================

export type Purpose = "Espresso" | "Pour Over" | "Drip" | "French Press" | "Cold Brew"

export type Roast = "Light" | "Medium" | "Medium-Dark" | "Dark"

export type Bean = {
  id: string
  name: string
  region: string
  country: string
  image: string
  roast: Roast
  flavors: string[]
  purposes: Purpose[]
  acidity: number // 1-5
  body: number // 1-5
  sweetness: number // 1-5
  price: number
  rating: number
  blurb: string
}

export const ALL_FLAVORS = [
  "Floral",
  "Berry",
  "Citrus",
  "Chocolate",
  "Caramel",
  "Nutty",
  "Stone Fruit",
  "Earthy",
  "Spice",
  "Honey",
] as const

export const ALL_PURPOSES: Purpose[] = [
  "Espresso",
  "Pour Over",
  "Drip",
  "French Press",
  "Cold Brew",
]

export const beans: Bean[] = [
  {
    id: "ethiopia-yirgacheffe",
    name: "Yirgacheffe",
    region: "Yirgacheffe",
    country: "Ethiopia",
    image: "/beans/ethiopia.png",
    roast: "Light",
    flavors: ["Floral", "Citrus", "Berry"],
    purposes: ["Pour Over", "Drip"],
    acidity: 5,
    body: 2,
    sweetness: 4,
    price: 19,
    rating: 4.8,
    blurb: "Bright and tea-like with jasmine florals and a lemon-zest finish.",
  },
  {
    id: "colombia-huila",
    name: "Huila Supremo",
    region: "Huila",
    country: "Colombia",
    image: "/beans/colombia.png",
    roast: "Medium",
    flavors: ["Caramel", "Citrus", "Nutty"],
    purposes: ["Drip", "Pour Over", "Espresso"],
    acidity: 3,
    body: 3,
    sweetness: 4,
    price: 17,
    rating: 4.6,
    blurb: "A crowd-pleasing cup balancing sweet caramel with gentle orange.",
  },
  {
    id: "brazil-cerrado",
    name: "Cerrado",
    region: "Cerrado",
    country: "Brazil",
    image: "/beans/brazil.png",
    roast: "Medium-Dark",
    flavors: ["Chocolate", "Nutty", "Caramel"],
    purposes: ["Espresso", "French Press"],
    acidity: 1,
    body: 5,
    sweetness: 4,
    price: 15,
    rating: 4.5,
    blurb: "Low-acid, nutty, and rich — the cozy backbone of any espresso.",
  },
  {
    id: "kenya-nyeri",
    name: "Nyeri AA",
    region: "Nyeri",
    country: "Kenya",
    image: "/beans/kenya.png",
    roast: "Light",
    flavors: ["Berry", "Citrus", "Stone Fruit"],
    purposes: ["Pour Over", "Cold Brew"],
    acidity: 5,
    body: 3,
    sweetness: 3,
    price: 21,
    rating: 4.7,
    blurb: "Juicy blackcurrant and grapefruit with a wine-like sparkle.",
  },
  {
    id: "guatemala-antigua",
    name: "Antigua",
    region: "Antigua",
    country: "Guatemala",
    image: "/beans/guatemala.png",
    roast: "Medium",
    flavors: ["Chocolate", "Spice", "Caramel"],
    purposes: ["Drip", "Espresso", "French Press"],
    acidity: 3,
    body: 4,
    sweetness: 4,
    price: 18,
    rating: 4.6,
    blurb: "Velvety cocoa with a whisper of baking spice and brown sugar.",
  },
  {
    id: "sumatra-mandheling",
    name: "Mandheling",
    region: "Mandheling",
    country: "Sumatra",
    image: "/beans/sumatra.png",
    roast: "Dark",
    flavors: ["Earthy", "Spice", "Chocolate"],
    purposes: ["French Press", "Cold Brew", "Espresso"],
    acidity: 1,
    body: 5,
    sweetness: 2,
    price: 18,
    rating: 4.4,
    blurb: "Bold, syrupy, and earthy with cedar and dark chocolate depth.",
  },
  {
    id: "costa-rica-tarrazu",
    name: "Tarrazú",
    region: "Tarrazú",
    country: "Costa Rica",
    image: "/beans/costa-rica.png",
    roast: "Medium",
    flavors: ["Honey", "Citrus", "Stone Fruit"],
    purposes: ["Pour Over", "Drip", "Cold Brew"],
    acidity: 4,
    body: 3,
    sweetness: 5,
    price: 20,
    rating: 4.7,
    blurb: "Honeyed sweetness with bright apricot and a clean, crisp finish.",
  },
  {
    id: "yemen-mokha",
    name: "Mokha",
    region: "Bani Matar",
    country: "Yemen",
    image: "/beans/yemen.png",
    roast: "Medium-Dark",
    flavors: ["Spice", "Berry", "Chocolate"],
    purposes: ["Espresso", "French Press"],
    acidity: 2,
    body: 4,
    sweetness: 3,
    price: 26,
    rating: 4.5,
    blurb: "Wild and complex with dried fruit, cardamom, and cocoa nibs.",
  },
]

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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <a href="#" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Coffee className="size-5" />
          </span>
          <span className="font-heading text-xl font-semibold text-foreground">
            Bean Buddy
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground sm:flex">
          <a href="#explore" className="transition-colors hover:text-foreground">
            Explore
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </nav>
        <a
          href="#explore"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start brewing
        </a>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Coffee className="size-4" />
          </span>
          <span className="font-heading text-lg font-semibold text-foreground">
            Bean Buddy
          </span>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          A cozy little place to compare coffee beans and find your perfect cup.
        </p>
        <p className="text-xs text-muted-foreground">
          {"© "}
          {new Date().getFullYear()} Bean Buddy. Brewed with love.
        </p>
      </div>
    </footer>
  )
}

// ==========================================
// Hero & How It Works Components
// ==========================================

export function Hero() {
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
            <Stat icon={<Coffee className="size-4" />} value="8" label="Beans" />
            <Stat
              icon={<Globe className="size-4" />}
              value="8"
              label="Origins"
            />
            <Stat
              icon={<Sparkles className="size-4" />}
              value="10"
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

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-1" aria-label={`${label}: ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-full rounded-full ${
              i < value ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function BeanCard({ bean }: { bean: Bean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(120,80,40,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={bean.image || "/placeholder.svg"}
          alt={`${bean.name} coffee beans from ${bean.country}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
          <Star className="size-3.5 fill-primary text-primary" />
          {bean.rating}
        </div>
        <Badge className="absolute right-3 top-3 rounded-full bg-accent text-accent-foreground hover:bg-accent">
          {bean.roast}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <MapPin className="size-3.5" />
            {bean.region}, {bean.country}
          </div>
          <h3 className="font-heading text-xl font-semibold leading-tight text-foreground">
            {bean.name}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {bean.blurb}
        </p>

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

        <div className="grid grid-cols-3 gap-3 pt-1">
          <Meter label="Acidity" value={bean.acidity} />
          <Meter label="Body" value={bean.body} />
          <Meter label="Sweet" value={bean.sweetness} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
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
          <span className="font-heading text-lg font-semibold text-primary">
            ${bean.price}
          </span>
        </div>
      </div>
    </article>
  )
}

export type Filters = {
  region: string | null
  flavors: string[]
  purposes: Purpose[]
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function BeanFilters({
  filters,
  setFilters,
  total,
}: {
  filters: Filters
  setFilters: (f: Filters) => void
  total: number
}) {
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const hasActive =
    filters.region || filters.flavors.length > 0 || filters.purposes.length > 0

  return (
    <aside className="flex flex-col gap-7 rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Filters
          </h2>
        </div>
        {hasActive && (
          <button
            onClick={() =>
              setFilters({ region: null, flavors: [], purposes: [] })
            }
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" /> Clear
          </button>
        )}
      </div>

      <FilterGroup title="Region">
        <div className="flex flex-col gap-1">
          {REGIONS.map((region) => {
            const active = filters.region === region
            return (
              <button
                key={region}
                onClick={() =>
                  setFilters({ ...filters, region: active ? null : region })
                }
                className={`rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {region}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Flavor Notes">
        <div className="flex flex-wrap gap-2">
          {ALL_FLAVORS.map((flavor) => {
            const active = filters.flavors.includes(flavor)
            return (
              <button
                key={flavor}
                onClick={() =>
                  setFilters({
                    ...filters,
                    flavors: toggle(filters.flavors, flavor),
                  })
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent/60"
                }`}
              >
                {flavor}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Brew Method">
        <div className="flex flex-col gap-2.5">
          {ALL_PURPOSES.map((purpose) => {
            const active = filters.purposes.includes(purpose)
            return (
              <label
                key={purpose}
                className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-muted-foreground"
              >
                <Checkbox
                  checked={active}
                  onCheckedChange={() =>
                    setFilters({
                      ...filters,
                      purposes: toggle(filters.purposes, purpose),
                    })
                  }
                />
                {purpose}
              </label>
            )
          })}
        </div>
      </FilterGroup>

      <p className="rounded-2xl bg-secondary px-4 py-3 text-center text-sm font-semibold text-secondary-foreground">
        {total} {total === 1 ? "bean" : "beans"} found
      </p>
    </aside>
  )
}

// ==========================================
// Bean Explorer Component
// ==========================================

export function BeanExplorer() {
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    region: null,
    flavors: [],
    purposes: [],
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return beans.filter((bean) => {
      if (filters.region && bean.country !== filters.region) return false
      if (
        filters.flavors.length > 0 &&
        !filters.flavors.every((f) => bean.flavors.includes(f))
      )
        return false
      if (
        filters.purposes.length > 0 &&
        !filters.purposes.some((p) => bean.purposes.includes(p))
      )
        return false
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
  }, [query, filters])

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-6">
            <BeanFilters
              filters={filters}
              setFilters={setFilters}
              total={results.length}
            />
          </div>
        </div>

        <div>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((bean) => (
                <BeanCard key={bean.id} bean={bean} />
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
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <BeanExplorer />
      <SiteFooter />
    </main>
  )
}
