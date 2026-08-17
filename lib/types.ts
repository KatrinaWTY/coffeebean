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
  rating: number
  blurb: string
  url?: string
  inStock: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

export type BeanFormData = Omit<Bean, "id" | "createdAt" | "updatedAt"> & {
  id?: string
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
