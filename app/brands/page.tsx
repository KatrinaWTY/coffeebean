"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Coffee, 
  MapPin, 
  Sparkles, 
  X, 
  Info,
  ExternalLink,
  Search,
  Bookmark,
  User
} from "lucide-react"
import { SiteHeader, SiteFooter } from "../page"
import { cn } from "@/lib/utils"

// ==========================================
// Types & Data Structures
// ==========================================

export type BrandKey = "climpson" | "formative" | "rave" | "monmouth" | "origin" | "workshop" | "colonna"
export type ButtonVariant = "solid" | "outline" | "soft" | "ghost" | "gradient"
export type ButtonState = "normal" | "hover" | "active" | "loading" | "success" | "disabled"
export type IconPosition = "none" | "left" | "right"

export type BrandProfile = {
  key: BrandKey
  name: string
  tagline: string
  headquarters: string
  established: string
  bio: string
  personality: string[]
  signatureBean: {
    name: string
    roast: string
    notes: string[]
  }
  designAesthetic: {
    description: string
    colors: { name: string; hex: string; role: string }[]
    typography: string
    radii: string
  }
  homepageUrl: string
  logoUrl: string
  coverUrl: string
}

// ==========================================
// Mock Data for Brands (Active Roasters)
// ==========================================

export const BRANDS: BrandProfile[] = [
  {
    key: "climpson",
    name: "Climpson & Sons",
    tagline: "Pioneers of London's specialty coffee scene",
    headquarters: "Hackney, London",
    established: "2002",
    bio: "Based in a former butcher shop in Broadway Market, Hackney, Climpson & Sons are pioneers of the London specialty coffee scene. They focus on sustainable sourcing, local roasting, and crafting accessible, high-quality flavor profiles with a refined East London industrial aesthetic.",
    personality: ["Industrial", "Sustainable", "Artisanal", "Heritage"],
    signatureBean: {
      name: "The Baron: Fazenda Inhame",
      roast: "Medium",
      notes: ["Chocolate", "Hazelnut", "Marzipan"]
    },
    designAesthetic: {
      description: "Classic British industrial elegance. Deep forest greens, brass outlines, textured charcoal surfaces, and clean serif typography reminiscent of traditional London shops.",
      colors: [
        { name: "Forest Green", hex: "#1b4332", role: "Primary Identity" },
        { name: "Polished Brass", hex: "#d4af37", role: "Highlights & Accents" },
        { name: "Charcoal Ink", hex: "#2f3e46", role: "Body Typography" }
      ],
      typography: "Warm Serif / Playfair Display / Georgia",
      radii: "Refined Rounded (8px)"
    },
    homepageUrl: "https://climpsonandsons.com/",
    logoUrl: "https://cdn.shopify.com/s/files/1/0232/4869/files/C_S_Symbol_Lockup_RGB_72ppi_noback_x320.png?v=1669819027",
    coverUrl: "/climpson_sons_cover.png"
  },
  {
    key: "formative",
    name: "Formative Coffee",
    tagline: "Intense flavor focus, scientific precision",
    headquarters: "Westminster, London",
    established: "2019",
    bio: "A hyper-progressive specialty roaster and cafe in the heart of London. Formative treats coffee with scientific precision, showcasing rare micro-lots and experimental processing methods with a clean, technical, minimalist presentation.",
    personality: ["Scientific", "Minimalist", "Progressive", "Flavor-focused"],
    signatureBean: {
      name: "BERRY JAM",
      roast: "Light-Medium",
      notes: ["Blackberry Jam", "Goji Berry", "Blueberry"]
    },
    designAesthetic: {
      description: "Scientific minimalism. Electric blue and clean margins, hyper-minimal layout structures, precise typography, and subtle light-cyan neon accents.",
      colors: [
        { name: "Electric Indigo", hex: "#4f46e5", role: "Primary UI" },
        { name: "Science Cyan", hex: "#06b6d4", role: "Status & Hover" },
        { name: "Sterile White", hex: "#ffffff", role: "App Background" }
      ],
      typography: "Monospace / Space Grotesk / Fira Code",
      radii: "Sharp Tech (6px)"
    },
    homepageUrl: "https://formative.coffee/",
    logoUrl: "https://formative.coffee/cdn/shop/files/fullLogoWhite.png?v=1614786827",
    coverUrl: "/formative_coffee_cover.png"
  },
  {
    key: "rave",
    name: "Rave Coffee",
    tagline: "No nonsense. Just great coffee.",
    headquarters: "Cirencester, Gloucestershire",
    established: "2011",
    bio: "Born out of a desire to make specialty coffee accessible, Rave is about no-nonsense quality and absolute sourcing transparency. Known for their bold kraft-punk cardboard bags, vibrant humor, and delicious blends.",
    personality: ["Bold", "Fun", "Approachable", "Transparent"],
    signatureBean: {
      name: "Signature Blend Nº 1",
      roast: "Medium",
      notes: ["Caramel", "Almond", "Milk Chocolate"]
    },
    designAesthetic: {
      description: "Raw craft cardboard-punk. Thick black outlines, solid offset blocky shadows, bold sans-serif, high-contrast, and vibrant neon lime hits.",
      colors: [
        { name: "Rave Neon Lime", hex: "#d4fc34", role: "Vibrant Core Accent" },
        { name: "Raw Kraft Black", hex: "#000000", role: "Thick Borders & Ink" },
        { name: "Cardboard Cream", hex: "#f1ede2", role: "Card Background" }
      ],
      typography: "Heavy Sans-Serif / Archivo / Impact",
      radii: "Chunky Round (12px)"
    },
    homepageUrl: "https://ravecoffee.co.uk/",
    logoUrl: "https://ravecoffee.co.uk/cdn/shop/files/Rave_Coffee_Logo_New_Jun_2024_115x43_c520a1f7-4d51-46d2-b79e-829aaad17219_500x.svg?v=1718718423",
    coverUrl: "/rave_coffee_cover.png"
  },
  {
    key: "monmouth",
    name: "Monmouth Coffee Company",
    tagline: "The grandmother of London specialty coffee",
    headquarters: "Borough Market, London",
    established: "1978",
    bio: "The absolute standard-bearer of London coffee. Sourcing and roasting since 1978, Monmouth popularized direct-trade coffee in the UK. Their styling is warm, nostalgic, rustic, and deeply rooted in community values.",
    personality: ["Nostalgic", "Authentic", "Direct-Trade", "Pioneer"],
    signatureBean: {
      name: "Monmouth Espresso",
      roast: "Medium",
      notes: ["Dark Chocolate", "Toasted Caramel", "Red Grape"]
    },
    designAesthetic: {
      description: "Nostalgic artisan coffeehouse. Deep warm espresso browns, traditional double-lined frames, soft parchment cream, and elegant serif type.",
      colors: [
        { name: "Espresso Brown", hex: "#4e3629", role: "Primary Ink" },
        { name: "Parchment Cream", hex: "#fcf8f2", role: "Main Surface" },
        { name: "Toasted Caramel", hex: "#b5838d", role: "Accents" }
      ],
      typography: "Traditional Serif / Georgia / Baskerville",
      radii: "Pill (9999px)"
    },
    homepageUrl: "https://www.monmouthcoffee.co.uk/",
    logoUrl: "https://www.monmouthcoffee.co.uk/wp-content/themes/monmouth-coffee/assets/images/logo.svg",
    coverUrl: "/placeholder.jpg"
  }
]

// ==========================================
// Brand Button Styles Dictionary
// ==========================================

export const BRAND_BUTTON_STYLES: Record<BrandKey, {
  font: string
  radius: string
  transition: string
  solid: string
  outline: string
  soft: string
  ghost: string
  gradient: string
  success: string
  disabled: string
}> = {
  climpson: {
    font: "font-sans font-semibold text-xs tracking-wider uppercase",
    radius: "rounded-lg",
    transition: "transition-all duration-300 ease-in-out",
    solid: "bg-[#1b4332] text-white hover:bg-[#081c15] border border-transparent shadow-sm",
    outline: "border border-[#1b4332] text-[#1b4332] bg-transparent hover:bg-[#1b4332]/5",
    soft: "bg-[#e9f5ed] text-[#1b4332] hover:bg-[#d8edd3]",
    ghost: "text-[#1b4332] hover:bg-slate-100",
    gradient: "bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white hover:opacity-95",
    success: "bg-emerald-900 text-emerald-100",
    disabled: "bg-[#1b4332]/20 text-[#1b4332]/40 cursor-not-allowed"
  },
  formative: {
    font: "font-mono font-medium text-xs tracking-tight",
    radius: "rounded-md",
    transition: "transition-all duration-150 ease-out",
    solid: "bg-[#4f46e5] text-white hover:bg-[#3730a3] border border-transparent focus:ring-2 focus:ring-[#4f46e5]/40",
    outline: "border border-[#4f46e5] text-[#4f46e5] bg-transparent hover:bg-[#4f46e5]/5",
    soft: "bg-[#e0e7ff] text-[#4f46e5] hover:bg-[#c7d2fe]",
    ghost: "text-[#4f46e5] hover:bg-[#e0e7ff]/30",
    gradient: "bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] text-white hover:brightness-105",
    success: "bg-green-700 text-white",
    disabled: "bg-slate-100 text-slate-400"
  },
  rave: {
    font: "font-sans font-black text-sm uppercase tracking-wide",
    radius: "rounded-xl",
    transition: "transition-all duration-200 ease-out",
    solid: "bg-[#d4fc34] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    outline: "bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    soft: "bg-[#f1f5f9] text-black border-2 border-black hover:bg-slate-100",
    ghost: "text-black hover:bg-slate-100/50",
    gradient: "bg-gradient-to-r from-[#d4fc34] to-[#f43f5e] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    success: "bg-green-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    disabled: "bg-slate-200 text-slate-400 border-2 border-slate-300 shadow-none cursor-not-allowed"
  },
  monmouth: {
    font: "font-serif italic font-semibold text-sm",
    radius: "rounded-3xl",
    transition: "transition-all duration-300 ease-in-out",
    solid: "bg-[#4e3629] text-[#f7ebe1] hover:bg-[#3d2a20] border border-[#4e3629]",
    outline: "border border-[#4e3629] text-[#4e3629] bg-transparent hover:bg-[#4e3629]/5",
    soft: "bg-[#fcf8f2] text-[#4e3629] hover:bg-[#ebdcc5]",
    ghost: "text-[#4e3629] hover:bg-amber-50/20",
    gradient: "bg-gradient-to-r from-[#4e3629] to-[#7f5539] text-[#f7ebe1] hover:brightness-105",
    success: "bg-[#1b4332] text-white",
    disabled: "bg-[#fcf8f2] text-[#4e3629]/40 border border-[#4e3629]/20"
  },
  origin: {
    font: "font-sans font-semibold text-xs tracking-wider uppercase",
    radius: "rounded-xl",
    transition: "transition-all duration-300 ease-in-out",
    solid: "bg-[#0b2545] text-white hover:bg-[#134074] border border-transparent shadow-sm",
    outline: "border border-[#0b2545] text-[#0b2545] bg-transparent hover:bg-[#0b2545]/5",
    soft: "bg-[#e2eafc] text-[#0b2545] hover:bg-[#c5d3e8]",
    ghost: "text-[#0b2545] hover:bg-slate-100",
    gradient: "bg-gradient-to-r from-[#0b2545] to-[#3d5a80] text-white hover:opacity-95",
    success: "bg-emerald-900 text-emerald-100",
    disabled: "bg-[#0b2545]/20 text-[#0b2545]/40 cursor-not-allowed"
  },
  workshop: {
    font: "font-sans font-medium text-xs tracking-tight uppercase",
    radius: "rounded-sm",
    transition: "transition-all duration-150 ease-out",
    solid: "bg-black text-white hover:bg-neutral-800 border border-transparent shadow-sm",
    outline: "border border-black text-black bg-transparent hover:bg-black/5",
    soft: "bg-neutral-100 text-black hover:bg-neutral-200",
    ghost: "text-black hover:bg-neutral-100",
    gradient: "bg-gradient-to-r from-black via-neutral-900 to-neutral-800 text-white hover:opacity-95",
    success: "bg-emerald-900 text-emerald-100",
    disabled: "bg-black/20 text-black/40 cursor-not-allowed"
  },
  colonna: {
    font: "font-serif italic font-semibold text-sm",
    radius: "rounded-none",
    transition: "transition-all duration-300 ease-in-out",
    solid: "bg-[#333] text-white hover:bg-[#111] border border-[#333]",
    outline: "border border-[#333] text-[#333] bg-transparent hover:bg-[#333]/5",
    soft: "bg-[#fdfbf7] text-[#333] hover:bg-[#ebdcc5]",
    ghost: "text-[#333] hover:bg-amber-50/20",
    gradient: "bg-gradient-to-r from-[#333] to-[#8c6239] text-[#f7ebe1] hover:brightness-105",
    success: "bg-[#1b4332] text-white",
    disabled: "bg-[#fdfbf7] text-[#333]/40 border border-[#333]/20"
  }
}

export default function BrandsPage() {
  const [modalBrand, setModalBrand] = useState<BrandProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return BRANDS
    return BRANDS.filter(brand => 
      brand.name.toLowerCase().includes(q) || 
      brand.headquarters.toLowerCase().includes(q) || 
      brand.bio.toLowerCase().includes(q) || 
      brand.personality.some(p => p.toLowerCase().includes(q))
    )
  }, [searchQuery])

  return (
    <main className="min-h-screen bg-[#FCF8F5] text-foreground">
      <SiteHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Hero Header Section */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
        <h1 className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl max-w-2xl text-balance">
          Discover the world&apos;s finest craft roasters.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          A curated selection of artisanal coffee roasters dedicated to precision, transparency, and the perfect brew.
        </p>
      </section>

      {/* Brand Showcase Grid */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => {
            const btnStyles = BRAND_BUTTON_STYLES[brand.key]
            
            return (
              <div 
                key={brand.key}
                className="group flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  {/* Card Image Wrapper with Centered Logo */}
                  <div 
                    onClick={() => setModalBrand(brand)}
                    className={cn(
                      "relative aspect-[8/3] overflow-hidden rounded-[2rem] shadow-sm cursor-pointer flex items-center justify-center p-4 transition-transform duration-300 hover:scale-[1.02] border border-black/5 bg-[#FCF8F5] shadow-xs",
                      brand.key === "formative" ? "bg-neutral-950 border-neutral-900" : "bg-[#FCF8F5]"
                    )}
                  >
                    {brand.logoUrl && !brand.logoUrl.includes("placeholder") ? (
                      <img
                        src={brand.logoUrl}
                        alt={`${brand.name} logo`}
                        className="max-w-[80%] max-h-[75%] object-contain"
                      />
                    ) : (
                      <span className={cn(
                        "font-heading text-xl font-bold text-center px-4 whitespace-normal select-none",
                        brand.key === "formative" ? "text-white" : "text-[#333]"
                      )}>
                        {brand.name}
                      </span>
                    )}
                  </div>

                  {/* Metadata & Details below the image */}
                  <div className="mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      <MapPin className="size-3.5 text-primary" />
                      {brand.headquarters}
                    </div>
                    <h3 
                      onClick={() => setModalBrand(brand)}
                      className="font-heading text-2xl font-semibold text-foreground mt-0.5 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      {brand.name}
                    </h3>
                    <div className="mt-1">
                      <span className="text-xs font-mono font-medium rounded-md px-2 py-0.5 border border-border bg-secondary/50 text-muted-foreground">
                        Est. {brand.established}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredBrands.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">
              No roasters match your search
            </p>
            <p className="text-sm text-muted-foreground">
              Try typing a different name or location.
            </p>
          </div>
        )}
      </section>

      {/* Brand Inspection Modal */}
      {modalBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Close */}
            <button 
              onClick={() => setModalBrand(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mt-2">
                <div className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border p-2 bg-card border-border`}>
                  <img
                    src={modalBrand.logoUrl}
                    alt={`${modalBrand.name} logo`}
                    className="h-full w-full object-contain rounded-full"
                    onError={(e) => {
                      // fallback for placeholder logos
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">{modalBrand.headquarters}</span>
                  <h3 className="font-heading text-2xl font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <a
                      href={modalBrand.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {modalBrand.name}
                      <ExternalLink className="size-4 text-muted-foreground" />
                    </a>
                  </h3>
                  <p className="text-xs italic text-muted-foreground mt-0.5">&quot;{modalBrand.tagline}&quot;</p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 flex flex-col gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Bio</h4>
                  <p className="text-sm leading-relaxed text-foreground mt-1">{modalBrand.bio}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Typography Theme</h4>
                    <p className="text-sm font-semibold text-foreground mt-1">{modalBrand.designAesthetic.typography}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Border Radii</h4>
                    <p className="text-sm font-semibold text-foreground mt-1">{modalBrand.designAesthetic.radii}</p>
                  </div>
                </div>

                <div className="mt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Design Palette Color Swatches</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {modalBrand.designAesthetic.colors.map((color) => (
                      <div key={color.name} className="flex flex-col gap-1.5 rounded-xl border border-border bg-[#FCF8F5]/30 p-2">
                        <div className="w-full h-8 rounded-lg border border-black/10 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <div>
                          <p className="text-[10px] font-bold truncate text-foreground leading-none">{color.name}</p>
                          <p className="text-[9px] font-mono text-muted-foreground mt-1">{color.hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Showcase Button */}
                <div className="rounded-2xl border border-border/40 bg-secondary/20 p-3 mt-2 flex flex-col gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Custom Button System Showcase</h5>
                    <p className="text-[10px] text-muted-foreground">Preview of buttons customized specifically with their design aesthetics.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <button className={`py-1.5 px-3 border transition-all ${BRAND_BUTTON_STYLES[modalBrand.key].font} ${BRAND_BUTTON_STYLES[modalBrand.key].radius} ${BRAND_BUTTON_STYLES[modalBrand.key].transition} ${BRAND_BUTTON_STYLES[modalBrand.key].solid}`}>
                      Solid Button
                    </button>
                    <button className={`py-1.5 px-3 border transition-all ${BRAND_BUTTON_STYLES[modalBrand.key].font} ${BRAND_BUTTON_STYLES[modalBrand.key].radius} ${BRAND_BUTTON_STYLES[modalBrand.key].transition} ${BRAND_BUTTON_STYLES[modalBrand.key].outline}`}>
                      Outline Button
                    </button>
                    <button className={`py-1.5 px-3 border transition-all ${BRAND_BUTTON_STYLES[modalBrand.key].font} ${BRAND_BUTTON_STYLES[modalBrand.key].radius} ${BRAND_BUTTON_STYLES[modalBrand.key].transition} ${BRAND_BUTTON_STYLES[modalBrand.key].soft}`}>
                      Soft Button
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/40 bg-[#FCF8F5]/50 p-3 flex gap-3 items-start mt-2">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Branding Strategy</h5>
                    <p className="text-xs leading-relaxed text-muted-foreground mt-1">{modalBrand.designAesthetic.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <a
                  href={modalBrand.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Visit Homepage</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <button
                  onClick={() => setModalBrand(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  )
}
