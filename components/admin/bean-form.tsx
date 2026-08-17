"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Coffee,
  Sparkles,
  Image as ImageIcon,
  Check,
  Plus,
  X,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { saveBeanAction, getRetailersAction, saveRetailerAction } from "@/app/admin/actions"
import {
  Bean,
  BeanFormData,
  Purpose,
  Roast,
  ProcessMethod,
  ALL_FLAVORS,
  ALL_PURPOSES,
  ALL_ROASTS,
  ALL_PROCESS_METHODS,
  FormState,
  Retailer,
  AffiliateNetwork,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface BeanFormProps {
  initialBean?: Bean | null
  mode: "create" | "edit"
}

export function BeanForm({ initialBean, mode }: BeanFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form Fields State
  const [name, setName] = useState(initialBean?.name || "")
  const [roaster, setRoaster] = useState(initialBean?.roaster || "")
  const [country, setCountry] = useState(initialBean?.country || "")
  const [region, setRegion] = useState(initialBean?.region || "")
  const [variety, setVariety] = useState(initialBean?.variety || "")
  const [processMethod, setProcessMethod] = useState<ProcessMethod | string>(
    initialBean?.process || "Washed"
  )
  const [roast, setRoast] = useState<Roast>(initialBean?.roast || "Medium")
  const [price, setPrice] = useState(initialBean?.price?.toString() || "15.00")
  const [currency, setCurrency] = useState(initialBean?.currency || "GBP")
  const [weight, setWeight] = useState(initialBean?.weight || "250g")
  const [imageUrl, setImageUrl] = useState(initialBean?.image || "")
  const [productUrl, setProductUrl] = useState(initialBean?.url || "")
  const [blurb, setBlurb] = useState(initialBean?.blurb || "")

  // Affiliate tracking fields
  const [retailerId, setRetailerId] = useState(initialBean?.retailerId || "")
  const [affiliateUrl, setAffiliateUrl] = useState(initialBean?.affiliateUrl || "")
  const [affiliateNetwork, setAffiliateNetwork] = useState(initialBean?.affiliateNetwork || "")
  const [merchantId, setMerchantId] = useState(initialBean?.merchantId || "")

  const [retailersList, setRetailersList] = useState<Retailer[]>([])
  const [networksList, setNetworksList] = useState<AffiliateNetwork[]>([])
  const [showNewRetailerInput, setShowNewRetailerInput] = useState(false)
  const [newRetailerName, setNewRetailerName] = useState("")
  const [isCreatingRetailer, setIsCreatingRetailer] = useState(false)

  useEffect(() => {
    getRetailersAction()
      .then((res) => setRetailersList(res))
      .catch((err) => console.error("Failed to load retailers:", err))

    setNetworksList([
      { id: "awin", name: "Awin" },
      { id: "shareasale", name: "ShareASale" },
      { id: "impact", name: "Impact" },
      { id: "custom", name: "Custom Direct / Coupon" },
    ])
  }, [])

  const handleCreateRetailer = async () => {
    const trimmed = newRetailerName.trim()
    if (!trimmed) return
    setIsCreatingRetailer(true)
    try {
      const newRet = await saveRetailerAction(trimmed)
      setRetailersList((prev) => [...prev, newRet].sort((a, b) => a.name.localeCompare(b.name)))
      setRetailerId(newRet.id)
      setNewRetailerName("")
      setShowNewRetailerInput(false)
    } catch (err) {
      console.error("Failed to create retailer:", err)
    } finally {
      setIsCreatingRetailer(false)
    }
  }
  
  // Sensory & Rating
  const [acidity, setAcidity] = useState(initialBean?.acidity || 3)
  const [body, setBody] = useState(initialBean?.body || 3)
  const [sweetness, setSweetness] = useState(initialBean?.sweetness || 4)
  const [rating, setRating] = useState(initialBean?.rating || 4.5)

  // Statuses
  const [inStock, setInStock] = useState(
    initialBean !== undefined && initialBean?.inStock !== undefined
      ? initialBean.inStock
      : true
  )
  const [featured, setFeatured] = useState(initialBean?.featured || false)

  // Tags & Multiselect
  const [flavors, setFlavors] = useState<string[]>(initialBean?.flavors || [])
  const [customFlavorInput, setCustomFlavorInput] = useState("")
  const [purposes, setPurposes] = useState<Purpose[]>(
    initialBean?.purposes || ["Espresso", "Pour Over"]
  )

  // Image Preview & Validation State
  const [imgLoadError, setImgLoadError] = useState(false)
  const [formFeedback, setFormFeedback] = useState<FormState | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  // Flavor tag handlers
  const addFlavor = (flavor: string) => {
    const trimmed = flavor.trim()
    if (!trimmed) return
    if (!flavors.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      setFlavors([...flavors, trimmed])
    }
    setCustomFlavorInput("")
  }

  const removeFlavor = (flavorToRemove: string) => {
    setFlavors(flavors.filter((f) => f !== flavorToRemove))
  }

  const handleFlavorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addFlavor(customFlavorInput)
    }
  }

  // Brew methods toggle handler
  const togglePurpose = (p: Purpose) => {
    if (purposes.includes(p)) {
      setPurposes(purposes.filter((item) => item !== p))
    } else {
      setPurposes([...purposes, p])
    }
  }

  // Client side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = "Bean name is required"
    if (!roaster.trim()) errors.roaster = "Roaster / Brand name is required"
    if (!country.trim()) errors.country = "Country of origin is required"
    
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = "Enter a valid positive price"
    }

    if (imageUrl.trim() && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("/")) {
      errors.imageUrl = "Image URL must be a valid http(s) URL"
    }

    if (productUrl.trim() && !productUrl.startsWith("http://") && !productUrl.startsWith("https://")) {
      errors.productUrl = "Product URL must start with http:// or https://"
    }

    if (affiliateUrl.trim() && !affiliateUrl.startsWith("http://") && !affiliateUrl.startsWith("https://")) {
      errors.affiliateUrl = "Affiliate URL must start with http:// or https://"
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormFeedback(null)

    if (!validateForm()) {
      setFormFeedback({
        success: false,
        message: "Please fix the highlighted errors before submitting.",
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const formData = new FormData()
    if (initialBean?.id) {
      formData.set("id", initialBean.id)
    }
    formData.set("name", name)
    formData.set("roaster", roaster)
    formData.set("country", country)
    formData.set("region", region)
    formData.set("variety", variety)
    formData.set("process", processMethod)
    formData.set("roast", roast)
    formData.set("price", price)
    formData.set("currency", currency)
    formData.set("weight", weight)
    formData.set("image", imageUrl)
    formData.set("url", productUrl)
    formData.set("blurb", blurb)
    formData.set("acidity", acidity.toString())
    formData.set("body", body.toString())
    formData.set("sweetness", sweetness.toString())
    formData.set("rating", rating.toString())
    formData.set("inStock", inStock ? "true" : "false")
    formData.set("featured", featured ? "true" : "false")
    formData.set("flavors", JSON.stringify(flavors))
    formData.set("purposes", JSON.stringify(purposes))
    formData.set("retailerId", retailerId)
    formData.set("affiliateUrl", affiliateUrl)
    formData.set("affiliateNetwork", affiliateNetwork)
    formData.set("merchantId", merchantId)

    startTransition(async () => {
      const result = await saveBeanAction(null, formData)
      setFormFeedback(result)
      if (result.success) {
        // Redirect back to list after short delay or instantly
        setTimeout(() => {
          router.push("/admin/coffee-beans")
          router.refresh()
        }, 800)
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/admin/coffee-beans"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Coffee Beans</span>
          </Link>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            {mode === "edit" ? "Edit Coffee Bean" : "Add New Coffee Bean"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "edit"
              ? `Updating bean: ${initialBean?.name || initialBean?.id}`
              : "Create and publish a new specialty coffee bean profile to the catalog."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/coffee-beans"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="size-4" />
                <span>{mode === "edit" ? "Save Changes" : "Create Bean"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {formFeedback && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold animate-in fade-in duration-200",
            formFeedback.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          )}
        >
          {formFeedback.success ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p>{formFeedback.message}</p>
            {formFeedback.errors && (
              <ul className="mt-2 list-disc list-inside text-xs font-normal space-y-0.5">
                {Object.entries(formFeedback.errors).map(([key, errs]) => (
                  <li key={key}>{errs.join(", ")}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Form Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Core Information & Profile */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Core Details */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-6">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Coffee className="size-4 text-primary" />
              General Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#801854] tracking-wide mb-1.5">
                Bean Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (clientErrors.name) setClientErrors({ ...clientErrors, name: "" })
                }}
                placeholder="e.g. The Baron: Fazenda Inhame"
                className={cn(
                  "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                  clientErrors.name ? "border-destructive bg-destructive/5" : "border-transparent"
                )}
              />
              {clientErrors.name && (
                <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.name}</p>
              )}
            </div>

            {/* Roaster & Country Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#801854] tracking-wide mb-1.5">
                  Roaster / Brand <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={roaster}
                  onChange={(e) => {
                    setRoaster(e.target.value)
                    if (clientErrors.roaster) setClientErrors({ ...clientErrors, roaster: "" })
                  }}
                  placeholder="e.g. Climpson & Sons, Formative, Rave"
                  className={cn(
                    "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                    clientErrors.roaster ? "border-destructive bg-destructive/5" : "border-transparent"
                  )}
                />
                {clientErrors.roaster && (
                  <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.roaster}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#801854] tracking-wide mb-1.5">
                  Country of Origin <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    if (clientErrors.country) setClientErrors({ ...clientErrors, country: "" })
                  }}
                  placeholder="e.g. Ethiopia, Brazil, Colombia, Blend"
                  className={cn(
                    "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                    clientErrors.country ? "border-destructive bg-destructive/5" : "border-transparent"
                  )}
                />
                {clientErrors.country && (
                  <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.country}</p>
                )}
              </div>
            </div>

            {/* Region / Farm & Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Region / Farm
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Cerrado Mineiro, Yirgacheffe"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Variety
                </label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. SL28, Red Bourbon, Geisha"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
                />
              </div>
            </div>

            {/* Roast Level & Processing Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Roast Level <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROASTS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoast(r)}
                      className={cn(
                        "rounded-xl border py-2.5 px-3 text-xs font-bold transition-all text-center",
                        roast === r
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border bg-[#F5F2F0] text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Processing Method
                </label>
                <select
                  value={processMethod}
                  onChange={(e) => setProcessMethod(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all focus:bg-white focus:border-primary cursor-pointer"
                >
                  {ALL_PROCESS_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#801854] tracking-wide mb-1.5">
                  Price <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    £
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value)
                      if (clientErrors.price) setClientErrors({ ...clientErrors, price: "" })
                    }}
                    placeholder="15.00"
                    className={cn(
                      "w-full rounded-2xl border bg-[#F5F2F0] pl-8 pr-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                      clientErrors.price ? "border-destructive bg-destructive/5" : "border-transparent"
                    )}
                  />
                </div>
                {clientErrors.price && (
                  <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="GBP"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Bag Weight
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 250g, 1kg"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Flavor Notes & Brew Methods */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-6">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Tasting Profile & Brewing
            </h3>

            {/* Flavor Notes Input */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                Flavour Notes
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Add structured flavor tags for smart filtering (e.g. Chocolate, Blueberry, Jasmine).
              </p>

              {/* Selected Flavors Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3 min-h-10 rounded-2xl border border-dashed border-border bg-[#F5F2F0]/50 p-2.5">
                {flavors.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic px-2">
                    No flavor notes selected yet. Click suggestions below or type your own.
                  </span>
                ) : (
                  flavors.map((fl) => (
                    <span
                      key={fl}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary animate-in zoom-in-95 duration-150"
                    >
                      {fl}
                      <button
                        type="button"
                        onClick={() => removeFlavor(fl)}
                        className="rounded-full hover:bg-primary/20 p-0.5 text-primary transition-colors cursor-pointer"
                        aria-label={`Remove ${fl}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFlavorInput}
                  onChange={(e) => setCustomFlavorInput(e.target.value)}
                  onKeyDown={handleFlavorKeyDown}
                  placeholder="Type custom note and press Enter..."
                  className="flex-1 rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2.5 text-xs font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => addFlavor(customFlavorInput)}
                  className="rounded-2xl bg-secondary hover:bg-accent px-4 py-2.5 text-xs font-bold text-secondary-foreground transition-colors cursor-pointer"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-3">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Popular Suggestions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_FLAVORS.map((sug) => {
                    const isSelected = flavors.includes(sug)
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => (isSelected ? removeFlavor(sug) : addFlavor(sug))}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold"
                            : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {isSelected ? `✓ ${sug}` : `+ ${sug}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Brew Methods */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-2">
                Recommended Brew Methods
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_PURPOSES.map((purpose) => {
                  const isChecked = purposes.includes(purpose)
                  return (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => togglePurpose(purpose)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer",
                        isChecked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-[#F5F2F0] text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span>{purpose}</span>
                      {isChecked && <Check className="size-3.5 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sensory Rating Sliders */}
            <div className="pt-2 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground/80 tracking-wide">
                  Sensory Attributes & Rating
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">1 (Mild) — 5 (High)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Acidity */}
                <div className="rounded-2xl bg-[#F5F2F0] p-3.5">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Acidity</span>
                    <span className="text-primary font-black">{acidity}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={acidity}
                    onChange={(e) => setAcidity(parseInt(e.target.value, 10))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Body */}
                <div className="rounded-2xl bg-[#F5F2F0] p-3.5">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Body</span>
                    <span className="text-primary font-black">{body}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={body}
                    onChange={(e) => setBody(parseInt(e.target.value, 10))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Sweetness */}
                <div className="rounded-2xl bg-[#F5F2F0] p-3.5">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Sweetness</span>
                    <span className="text-primary font-black">{sweetness}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={sweetness}
                    onChange={(e) => setSweetness(parseInt(e.target.value, 10))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Overall Rating */}
              <div className="rounded-2xl bg-[#F5F2F0] p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">Catalog Rating Score</span>
                  <p className="text-[11px] text-muted-foreground">Default displayed star score</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value) || 4.5)}
                    className="w-20 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-center text-foreground outline-none"
                  />
                  <span className="text-xs font-bold text-muted-foreground">★</span>
                </div>
              </div>
            </div>

            {/* Description / Blurb */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                Description / Blurb
              </label>
              <textarea
                rows={3}
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                placeholder="Leave blank to auto-generate a descriptive summary, or write custom tasting description..."
                className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] p-4 text-xs font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary resize-none min-h-[90px]"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Visual Media & Status Switches */}
        <div className="space-y-8">
          {/* Card 3: Image Preview & URL */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              Product Image
            </h3>

            {/* Image Preview Box */}
            <div className="relative aspect-square w-full rounded-2xl border border-border bg-secondary/30 overflow-hidden flex flex-col items-center justify-center p-4">
              {imageUrl && !imgLoadError ? (
                <Image
                  src={imageUrl}
                  alt="Bean preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover transition-all"
                  onError={() => setImgLoadError(true)}
                  onLoad={() => setImgLoadError(false)}
                />
              ) : (
                <div className="flex flex-col items-center text-center gap-2 text-muted-foreground">
                  <Coffee className="size-10 stroke-1" />
                  <p className="text-xs font-semibold">
                    {imageUrl && imgLoadError ? "Failed to load image preview" : "No image preview"}
                  </p>
                  <p className="text-[10px]">Enter an image URL below</p>
                </div>
              )}

              {/* Status Badge */}
              {imageUrl && !imgLoadError && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                  Live Preview
                </span>
              )}
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setImgLoadError(false)
                  if (clientErrors.imageUrl) setClientErrors({ ...clientErrors, imageUrl: "" })
                }}
                placeholder="https://example.com/bean-bag.jpg"
                className={cn(
                  "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                  clientErrors.imageUrl ? "border-destructive bg-destructive/5" : "border-transparent"
                )}
              />
              {clientErrors.imageUrl && (
                <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.imageUrl}</p>
              )}
            </div>

            {/* Product Link URL */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                Roaster Product / Purchase URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={productUrl}
                  onChange={(e) => {
                    setProductUrl(e.target.value)
                    if (clientErrors.productUrl) setClientErrors({ ...clientErrors, productUrl: "" })
                  }}
                  placeholder="https://roaster.com/products/bean"
                  className={cn(
                    "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                    clientErrors.productUrl ? "border-destructive bg-destructive/5" : "border-transparent"
                  )}
                />
                {productUrl && (
                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    title="Open external link"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
              {clientErrors.productUrl && (
                <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.productUrl}</p>
              )}
            </div>
          </div>

          {/* Card 3.5: Affiliate & Referral Configuration */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Affiliate Tracking
            </h3>

            {/* Retailer Select */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5 flex justify-between items-center">
                <span>Associated Retailer / Store</span>
                <button
                  type="button"
                  onClick={() => setShowNewRetailerInput(!showNewRetailerInput)}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  {showNewRetailerInput ? "Cancel" : "+ Add New Retailer"}
                </button>
              </label>

              {showNewRetailerInput ? (
                <div className="flex gap-2 animate-in fade-in-50 duration-150">
                  <input
                    type="text"
                    value={newRetailerName}
                    onChange={(e) => setNewRetailerName(e.target.value)}
                    placeholder="New Retailer Name"
                    className="flex-1 rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-2 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCreateRetailer}
                    disabled={isCreatingRetailer || !newRetailerName.trim()}
                    className="rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isCreatingRetailer ? "Adding..." : "Add"}
                  </button>
                </div>
              ) : (
                <select
                  value={retailerId}
                  onChange={(e) => setRetailerId(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="">-- Select Retailer --</option>
                  {retailersList.map((ret) => (
                    <option key={ret.id} value={ret.id}>
                      {ret.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Affiliate URL */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                Affiliate Redirect URL
              </label>
              <input
                type="text"
                value={affiliateUrl}
                onChange={(e) => {
                  setAffiliateUrl(e.target.value)
                  if (clientErrors.affiliateUrl) setClientErrors({ ...clientErrors, affiliateUrl: "" })
                }}
                placeholder="https://network.awin.com/click?merchant=..."
                className={cn(
                  "w-full rounded-2xl border bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary",
                  clientErrors.affiliateUrl ? "border-destructive bg-destructive/5" : "border-transparent"
                )}
              />
              {clientErrors.affiliateUrl && (
                <p className="text-[11px] font-bold text-destructive mt-1">{clientErrors.affiliateUrl}</p>
              )}
            </div>

            {/* Affiliate Network & Merchant ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Affiliate Network
                </label>
                <select
                  value={affiliateNetwork}
                  onChange={(e) => setAffiliateNetwork(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary cursor-pointer"
                >
                  <option value="">-- Select Network --</option>
                  {networksList.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/80 tracking-wide mb-1.5">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="e.g. 12456"
                  className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] px-4 py-3 text-xs font-semibold text-foreground outline-none focus:bg-white focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Inventory & Visibility Status */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-lg font-bold text-foreground border-b border-border pb-3">
              Catalog Status
            </h3>

            {/* In Stock Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-foreground">Available / In Stock</p>
                <p className="text-[11px] text-muted-foreground">
                  Controls whether this item appears as purchasable.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-xs font-bold text-foreground">Featured Highlight</p>
                <p className="text-[11px] text-muted-foreground">
                  Highlight this bean prominently in explore listings.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 flex items-center justify-between rounded-3xl border border-border bg-[#FCF8F5]/95 p-4 shadow-xl backdrop-blur-md">
        <Link
          href="/admin/coffee-beans"
          className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Saving Bean...</span>
            </>
          ) : (
            <>
              <Check className="size-4" />
              <span>{mode === "edit" ? "Update Coffee Bean" : "Create Coffee Bean"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
