export type Purpose =
  | "Espresso"
  | "Pour Over"
  | "Drip"
  | "French Press"
  | "Cold Brew"
  | "Aeropress"
  | "Moka Pot"

export type Roast = "Light" | "Medium" | "Medium-Dark" | "Dark"

export type ProcessMethod =
  | "Washed"
  | "Natural"
  | "Honey"
  | "Anaerobic"
  | "Other"

export interface Bean {
  id: string
  name: string
  roaster: string
  country: string
  region: string
  image: string
  roast: Roast
  flavors: string[]
  purposes: Purpose[]
  acidity: number // 1-5
  body: number // 1-5
  sweetness: number // 1-5
  price: number
  currency: string
  weight?: string
  variety?: string
  process?: ProcessMethod | string
  altitude?: string
  variants?: { weight: string; price: number }[]
  rating: number
  blurb: string
  url?: string
  inStock: boolean
  featured: boolean
  createdAt: string
  updatedAt: string

  // Affiliate & Retailer extensions
  retailerId: string
  affiliateUrl?: string
  affiliateNetwork?: string
  merchantId?: string
}

export type BeanFormData = Omit<Bean, "id" | "createdAt" | "updatedAt"> & {
  id?: string
}

export interface Retailer {
  id: string
  name: string
  url?: string
  createdAt: string
  updatedAt: string
}

export interface AffiliateNetwork {
  id: string
  name: string
}

export interface AffiliateClick {
  id: string
  coffeeBeanId: string
  retailerId: string
  affiliateNetwork: string
  timestamp: string
  referrer?: string
  path?: string
  searchQuery?: string
  filters?: {
    regions?: string[]
    flavors?: string[]
    purposes?: string[]
  }
  ctaLocation?: string
  sessionId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  deviceCategory?: "desktop" | "mobile" | "tablet" | "unknown"
}

export interface AffiliateConversion {
  id: string
  affiliateNetwork: string
  retailerId: string
  externalTransactionId: string
  orderDate: string
  conversionDate: string
  orderValue: number
  commissionValue: number
  currency: string
  status: "Pending" | "Approved" | "Rejected" | "Paid"
  coffeeBeanId?: string
  clickId?: string
  rawExternalReferenceId?: string
  createdAt: string
}

export interface FormState {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  beanId?: string
}


export interface AdminStats {
  totalBeans: number
  totalRoasters: number
  totalCountries: number
  outOfStockCount: number
  featuredCount: number
  averagePrice: number
}

export const ALL_FLAVORS = [
  "Floral",
  "Berry",
  "Citrus",
  "Stone Fruit",
  "Chocolate",
  "Caramel",
  "Nutty",
  "Honey",
  "Spice",
  "Earthy",
  "Tropical Fruit",
  "Vanilla",
  "Jasmine",
  "Blueberry",
  "Apple",
  "Peach",
] as const

export const ALL_PURPOSES: Purpose[] = [
  "Espresso",
  "Pour Over",
  "Drip",
  "French Press",
  "Cold Brew",
  "Aeropress",
  "Moka Pot",
]

export const ALL_ROASTS: Roast[] = [
  "Light",
  "Medium",
  "Medium-Dark",
  "Dark",
]

export const ALL_PROCESS_METHODS: ProcessMethod[] = [
  "Washed",
  "Natural",
  "Honey",
  "Anaerobic",
  "Other",
]
