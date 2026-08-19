"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Coffee,
  Globe,
  Sliders,
  Check as CheckIcon,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  Award,
  Sparkles,
  Info
} from "lucide-react"

import { getLiveBeansAction } from "@/app/admin/actions"
import initialBeans from "@/data/beans.json"
import { type Bean } from "@/lib/types"
import { cn } from "@/lib/utils"
import { SiteHeader, SiteFooter } from "@/app/page"

// ==========================================
// Helper functions (Duplicated from homepage to prevent circular deps)
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

function getTasteDescription(bean: Bean): string {
  const isChocolatey = bean.flavors.some(f => ["Chocolate", "Nutty", "Earthy"].includes(f))
  const isFruity = bean.flavors.some(f => ["Citrus", "Stone Fruit", "Berry", "Tropical Fruit", "Blueberry", "Apple", "Peach"].includes(f))
  const isFloral = bean.flavors.some(f => ["Floral", "Jasmine"].includes(f))
  const isSweet = bean.flavors.some(f => ["Caramel", "Honey", "Vanilla", "Peach"].includes(f))

  if (isChocolatey) {
    return `Expect a deeply satisfying, rich, and comforting cup. This coffee tastes like a warm chocolate cookie or a handful of roasted hazelnuts. It has a full, creamy body and very low fruit acidity, making it smooth, sweet, and incredibly easy to drink—especially in the morning with a splash of milk.`
  }
  if (isFruity) {
    return `Expect a vibrant, juicy, and refreshing cup of coffee. It features lively fruit-like acidity reminiscent of fresh berries, citrus, or stone fruits. It feels bright and light on the palate, with a sweet, jammy finish. Perfect if you enjoy coffees that taste natural, clean, and energetic.`
  }
  if (isFloral) {
    return `Expect a delicate, light, and highly fragrant cup. It features elegant tea-like characteristics with soft notes of jasmine and blossom. It has a light mouthfeel and refined sweetness. This is an elegant coffee that is best enjoyed black so you can experience all its subtle layers.`
  }
  if (isSweet) {
    return `Expect a beautifully balanced, sweet, and harmonious coffee. It has smooth notes of honey, caramel, or vanilla, with a round body and pleasant, mild acidity. It sits perfectly in the middle—not too heavy, not too light, just naturally sweet and highly satisfying.`
  }
  
  return `Expect a delicious, classic, and well-balanced cup. It features a harmonious blend of sweetness and body, offering a clean finish that is easy to enjoy at any time of day.`
}

function getIsThisForMe(bean: Bean) {
  const isChocolatey = bean.flavors.some(f => ["Chocolate", "Nutty", "Earthy"].includes(f))
  const isFruity = bean.flavors.some(f => ["Citrus", "Stone Fruit", "Berry", "Tropical Fruit", "Blueberry", "Apple", "Peach"].includes(f))
  const isFloral = bean.flavors.some(f => ["Floral", "Jasmine"].includes(f))
  
  const pros = []
  const cons = []

  if (bean.purposes.includes("Espresso")) {
    pros.push("You want a coffee that excels as a rich espresso shot.")
  }
  if (bean.purposes.some(p => ["Pour Over", "French Press", "Aeropress"].includes(p))) {
    pros.push("You enjoy filter brewing methods like pour over, drip, or French press.")
  }
  
  if (isChocolatey) {
    pros.push("You love drinking coffee with milk (latte, flat white, cappuccino).")
    pros.push("You prefer comforting, traditional, and chocolatey coffee flavors.")
    cons.push("You prefer light, fruity, and highly acidic coffee profiles.")
  } else if (isFruity) {
    pros.push("You like bright, fruity, and juicy flavors in your cup.")
    pros.push("You want to try something lively and distinctive.")
    cons.push("You want a low-acidity coffee to drink with lots of milk.")
  } else if (isFloral) {
    pros.push("You prefer a light, tea-like, delicate coffee.")
    pros.push("You enjoy drinking your coffee black to taste its subtle notes.")
    cons.push("You want a heavy, dark-roast style coffee.")
  } else {
    pros.push("You want a highly balanced, clean, and crowd-pleasing cup.")
    cons.push("You are looking for extremely intense or unusual flavor notes.")
  }

  return { pros, cons }
}

export default function BeanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [liveBeans, setLiveBeans] = useState<Bean[]>(initialBeans as Bean[])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false)

  // Fetch live beans on mount to keep data fresh
  useEffect(() => {
    getLiveBeansAction()
      .then((res) => {
        if (res && res.length > 0) {
          setLiveBeans(res)
        }
      })
      .catch((err) => console.error("Failed to load live beans:", err))
  }, [])

  // Find target bean
  const bean = useMemo(() => {
    return liveBeans.find((b) => b.id === id) || null
  }, [liveBeans, id])

  // Reset selected variant index when bean changes
  useEffect(() => {
    setSelectedVariantIndex(0)
  }, [id])

  if (!bean) {
    return (
      <main className="min-h-screen bg-[#FCF8F5] text-foreground font-sans">
        <SiteHeader placeholder="Search..." />
        <div className="mx-auto max-w-xl text-center py-24 px-5">
          <span className="text-4xl block mb-4">😢</span>
          <h2 className="font-heading text-2xl font-bold text-[#3C322B] mb-2">Coffee bean not found</h2>
          <p className="text-sm text-muted-foreground mb-6">The coffee you are looking for might have been removed or is currently unavailable.</p>
          <Link href="/" className="rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm">
            Back to Directory
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  // Get current variant values
  const currentWeight = bean.variants && bean.variants.length > 0
    ? bean.variants[selectedVariantIndex].weight
    : (bean.weight || "250g")

  const currentPrice = bean.variants && bean.variants.length > 0
    ? bean.variants[selectedVariantIndex].price
    : bean.price

  const pricePer100g = calculatePricePer100g(currentPrice, currentWeight)

  // Tracking URL
  const trackingUrl = (() => {
    if (typeof window === "undefined") return `/go/${bean.id}`
    const urlParams = new URLSearchParams()
    urlParams.set("path", `/beans/${bean.id}`)
    urlParams.set("cta", "detail_page")
    urlParams.set("weight", currentWeight)
    return `/go/${bean.id}?${urlParams.toString()}`
  })()

  // Calculate friendliness stats
  const isChocolatey = bean.flavors.some(f => ["Chocolate", "Nutty", "Earthy"].includes(f))
  const isFruity = bean.flavors.some(f => ["Citrus", "Stone Fruit", "Berry", "Tropical Fruit"].includes(f))
  const isFloral = bean.flavors.some(f => ["Floral", "Jasmine"].includes(f))

  let beginnerLevel = 3 // out of 5
  let adventurousLevel = 3

  if (isChocolatey) {
    beginnerLevel = 5
    adventurousLevel = 1
  } else if (isFloral) {
    beginnerLevel = 2
    adventurousLevel = 5
  } else if (isFruity) {
    beginnerLevel = 3
    adventurousLevel = 4
  }

  const beginnerText = 
    beginnerLevel >= 5 ? "Extremely Beginner Friendly — Smooth, sweet, and very forgiving to brew." :
    beginnerLevel >= 4 ? "Beginner Friendly — Balanced profiles that taste great on standard coffee makers." :
    beginnerLevel >= 3 ? "A Good Stepping Stone — Has some fruit acidity but remains highly accessible." :
    "Experienced Brewers — Delicate notes that reward precise temperature and grind control.";

  const adventurousText =
    adventurousLevel >= 5 ? "Adventurous & Complex — Tea-like, highly floral or wild fruit flavors." :
    adventurousLevel >= 4 ? "Adventurous — Interesting fruit profiles that stand out from typical coffee." :
    adventurousLevel >= 3 ? "Balanced & Interesting — Classic base with a splash of unique tasting notes." :
    "Familiar & Comforting — The traditional, cozy coffee flavor profile you know and love.";

  const { pros, cons } = getIsThisForMe(bean)
  const tasteDescription = getTasteDescription(bean)
  const recommendedUses = getRecommendedUses(bean)

  const cleanedName = bean.name
    .replace(`${bean.roaster} - `, "")
    .replace(new RegExp(`,\\s*${bean.country}\\s*$`, 'i'), '')
    .replace(/^(The Baron:\s*|The Estate:\s*|The Fields:\s*|Decaf:\s*)/i, '')
    .trim()

  return (
    <main className="min-h-screen bg-[#FCF8F5] text-foreground font-sans">
      <SiteHeader placeholder="Search coffee beans..." />

      <div className="mx-auto max-w-4xl px-5 py-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-[#6D5A50] hover:text-[#3C322B] transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="size-4" />
          Back to list
        </button>

        {/* Dynamic Two Column Detail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
          
          {/* LEFT COLUMN: Visuals and Meters */}
          <div className="space-y-6">
            
            {/* Main Product Image Container */}
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-[#EADFD7] bg-white p-3 shadow-sm">
              <div className="relative w-full h-full overflow-hidden rounded-[2.1rem]">
                <Image
                  src={bean.image || "/placeholder.svg"}
                  alt={`${bean.name} coffee profile`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Beginner Friendliness / Adventurousness meters */}
            <div className="rounded-3xl border border-[#EADFD7] bg-white p-6 space-y-5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#6D5A50]">
                Vibe Guide
              </h3>

              {/* Beginner Friendliness Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#3C322B]">Beginner Friendliness</span>
                  <span className="font-extrabold text-[#3C322B]">{beginnerLevel} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      className={`h-2.5 flex-1 rounded-full ${
                        dot <= beginnerLevel ? "bg-emerald-600" : "bg-neutral-100 border border-neutral-200/50"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">{beginnerText}</p>
              </div>

              {/* Adventurousness Meter */}
              <div className="space-y-1.5 pt-2 border-t border-[#EADFD7]/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#3C322B]">Adventurousness</span>
                  <span className="font-extrabold text-[#3C322B]">{adventurousLevel} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      className={`h-2.5 flex-1 rounded-full ${
                        dot <= adventurousLevel ? "bg-amber-600" : "bg-neutral-100 border border-neutral-200/50"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal mt-1">{adventurousText}</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Info, Price, CTA, Details */}
          <div className="space-y-6">
            
            {/* 1. Header (Name + Roaster) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF5F0] border border-[#EADFD7] px-2.5 py-0.5 text-[9px] font-extrabold text-[#3C322B] uppercase tracking-wider">
                  <MapPin className="size-3 text-amber-700" />
                  {bean.country}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[9px] font-extrabold text-neutral-800 uppercase tracking-wider">
                  {bean.roast} Roast
                </span>
              </div>
              
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#3C322B] leading-tight">
                {cleanedName}
              </h1>
              <p className="text-sm font-bold text-muted-foreground">
                Roasted by <span className="text-[#3C322B] font-extrabold">{bean.roaster}</span>
              </p>
            </div>

            {/* 2. Flavour Notes */}
            <div className="flex flex-wrap gap-2 py-1 border-y border-[#EADFD7]/50">
              {bean.flavors.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-[#FAF5F0] border border-[#EADFD7] px-3.5 py-1.5 text-xs font-bold text-[#3C322B] shadow-2xs"
                >
                  <span className="mr-1.5">{getFlavorEmoji(f)}</span>
                  {f}
                </span>
              ))}
            </div>

            {/* 3. Simple Description */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {bean.blurb}
            </p>

            {/* 5. Best Brewing Methods */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#6D5A50]">Recommended Brew Style</h4>
              <div className="flex flex-wrap gap-1.5">
                {recommendedUses.map((use) => (
                  <span
                    key={use}
                    className="rounded-xl border border-[#EADFD7] bg-white px-3 py-1 text-xs font-bold text-neutral-800"
                  >
                    Best for {use}
                  </span>
                ))}
              </div>
            </div>

            {/* 6. Variants Selector & Pricing Display */}
            <div className="rounded-3xl border border-[#EADFD7] bg-white p-5 space-y-4">
              {/* Variant selector if available */}
              {bean.variants && bean.variants.length > 1 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6D5A50]">Select Bag Size</span>
                  <div className="flex flex-wrap gap-2">
                    {bean.variants.map((v, idx) => {
                      const active = selectedVariantIndex === idx
                      return (
                        <button
                          key={v.weight}
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={cn(
                            "rounded-full px-4 py-2 text-xs font-extrabold transition-all border cursor-pointer select-none",
                            active
                              ? "bg-[#3C322B] text-white border-transparent shadow-xs"
                              : "bg-[#FCF8F5] text-neutral-700 border-[#EADFD7] hover:bg-neutral-100"
                          )}
                        >
                          {v.weight} · £{v.price.toFixed(2)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Price comparison display */}
              <div className="flex items-end justify-between pt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D5A50]">Purchase Price</span>
                  <span className="font-heading text-2xl font-black text-[#3C322B]">
                    £{currentPrice.toFixed(2)} · <span className="text-base font-semibold text-neutral-500">{currentWeight}</span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Standardized Rate</span>
                  <span className="text-sm font-bold text-neutral-700">
                    £{pricePer100g.toFixed(2)} / 100g
                  </span>
                </div>
              </div>

              {/* 8. Affiliate CTA Button */}
              <div className="space-y-2 pt-2">
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center rounded-full bg-primary hover:bg-primary/95 text-primary-foreground py-3.5 text-sm font-extrabold transition-all shadow-sm hover:translate-y-[-1px] cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <span>View at {bean.roaster}</span>
                  <span className="font-sans">→</span>
                </a>
                <p className="text-[10px] text-center text-muted-foreground leading-snug italic max-w-xs mx-auto">
                  "We may earn a commission if you purchase through this link, at no extra cost to you."
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM CONTENT SECTIONS */}
        <div className="space-y-6 mb-12">
          
          {/* 9. "What will it taste like?" Section */}
          <div className="rounded-3xl bg-[#FAF5F0] border border-[#EADFD7] p-6 sm:p-8 space-y-3">
            <h3 className="font-heading text-xl font-bold text-[#3C322B] flex items-center gap-2">
              <span>☕</span> What will it taste like?
            </h3>
            <p className="text-sm leading-relaxed text-[#5c4a3e]">
              {tasteDescription}
            </p>
          </div>

          {/* 10. "Is this for me?" Section */}
          <div className="rounded-3xl bg-white border border-[#EADFD7] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-heading text-lg font-bold text-emerald-800 flex items-center gap-2">
                <CheckIcon className="size-5 text-emerald-700 stroke-[3]" />
                You will love this if:
              </h4>
              <ul className="space-y-2.5">
                {pros.map((pro, i) => (
                  <li key={i} className="text-xs font-semibold text-neutral-700 flex items-start gap-2.5">
                    <span className="text-emerald-600 font-extrabold text-sm shrink-0">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 md:border-l md:border-[#EADFD7]/50 md:pl-6">
              <h4 className="font-heading text-lg font-bold text-amber-900 flex items-center gap-2">
                <XIcon className="size-5 text-amber-700 stroke-[3]" />
                Skip this if:
              </h4>
              <ul className="space-y-2.5">
                {cons.map((con, i) => (
                  <li key={i} className="text-xs font-semibold text-neutral-700 flex items-start gap-2.5">
                    <span className="text-amber-700 font-extrabold text-sm shrink-0">✗</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 11. Technical Coffee Details (Collapsible Drawer) */}
          <div className="rounded-3xl border border-[#EADFD7] bg-white overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-left p-6 font-heading text-lg font-bold text-[#3C322B] hover:bg-neutral-50 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Sliders className="size-5 text-[#6D5A50]" />
                <span>Advanced Coffee Technical Details</span>
              </div>
              {showTechnicalDetails ? <ChevronUp className="size-5 text-[#6D5A50]" /> : <ChevronDown className="size-5 text-[#6D5A50]" />}
            </button>

            {showTechnicalDetails && (
              <div className="border-t border-[#EADFD7] p-6 bg-[#FAF8F5] grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Origin Country</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.country}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Specific Region</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.region || "Not specified"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Processing Method</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.process || "Washed"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Altitude / Elevation</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.altitude || "1,200m - 1,500m"}</span>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Botanical Variety</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.variety || "Typical Heirloom"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Roast Style</span>
                  <span className="text-sm font-bold text-[#3C322B]">{bean.roast} Roast</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Merchant System</span>
                  <span className="text-sm font-bold text-[#3C322B] uppercase text-muted-foreground/80">{bean.affiliateNetwork || "Direct Partnership"}</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      <SiteFooter />
    </main>
  )
}
