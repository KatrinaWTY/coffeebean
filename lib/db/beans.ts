import fs from "fs/promises"
import path from "path"
import { Bean, BeanFormData, AdminStats } from "@/lib/types"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "beans.json")

// Helper to generate a slugified ID
export function generateBeanId(roaster: string, name: string): string {
  const base = `${roaster}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || `bean-${Date.now()}`
}

// In-memory cache for fast reads, synchronized on writes
let cachedBeans: Bean[] | null = null

async function readBeansFromFile(): Promise<Bean[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as Bean[]
    cachedBeans = parsed
    return parsed
  } catch (error) {
    // If file doesn't exist yet, try to create from fallback or empty
    if (cachedBeans) return cachedBeans
    console.error("Error reading beans from file:", error)
    return []
  }
}

async function writeBeansToFile(beans: Bean[]): Promise<void> {
  cachedBeans = beans
  const dir = path.dirname(DATA_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  
  // Write atomically via temporary file
  const tempPath = `${DATA_FILE_PATH}.tmp.${Date.now()}`
  await fs.writeFile(tempPath, JSON.stringify(beans, null, 2), "utf-8")
  await fs.rename(tempPath, DATA_FILE_PATH)
}

/**
 * Fetch all beans with optional filtering and sorting
 */
export async function getBeans(options?: {
  search?: string
  roast?: string
  roaster?: string
  country?: string
  inStock?: boolean
  featured?: boolean
}): Promise<Bean[]> {
  const all = await readBeansFromFile()
  if (!options) return all

  const { search, roast, roaster, country, inStock, featured } = options
  const q = search?.trim().toLowerCase()

  return all.filter((bean) => {
    if (roast && bean.roast !== roast) return false
    if (roaster && bean.roaster !== roaster) return false
    if (country && bean.country !== country) return false
    if (typeof inStock === "boolean" && bean.inStock !== inStock) return false
    if (typeof featured === "boolean" && bean.featured !== featured) return false

    if (q) {
      const searchContent = [
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

      if (!searchContent.includes(q)) return false
    }

    return true
  })
}

/**
 * Get a single bean by ID
 */
export async function getBeanById(id: string): Promise<Bean | null> {
  const all = await readBeansFromFile()
  return all.find((b) => b.id === id) || null
}

/**
 * Create a new coffee bean
 */
export async function createBean(data: BeanFormData): Promise<Bean> {
  const all = await readBeansFromFile()
  
  let candidateId = data.id || generateBeanId(data.roaster, data.name)
  let finalId = candidateId
  let counter = 1
  while (all.some((b) => b.id === finalId)) {
    finalId = `${candidateId}-${counter}`
    counter++
  }

  const now = new Date().toISOString()
  const newBean: Bean = {
    id: finalId,
    name: data.name.trim(),
    roaster: data.roaster.trim(),
    country: data.country.trim(),
    region: data.region?.trim() || "",
    image: data.image?.trim() || "",
    roast: data.roast,
    flavors: Array.isArray(data.flavors) ? data.flavors : [],
    purposes: Array.isArray(data.purposes) ? data.purposes : [],
    acidity: Number(data.acidity) || 3,
    body: Number(data.body) || 3,
    sweetness: Number(data.sweetness) || 3,
    price: Number(data.price) || 0,
    currency: data.currency || "GBP",
    weight: data.weight?.trim() || "250g",
    variety: data.variety?.trim() || "",
    process: data.process?.trim() || "Washed",
    rating: Number(data.rating) || 4.5,
    blurb: data.blurb?.trim() || "",
    url: data.url?.trim() || "",
    inStock: typeof data.inStock === "boolean" ? data.inStock : true,
    featured: typeof data.featured === "boolean" ? data.featured : false,
    createdAt: now,
    updatedAt: now,
  }

  // Prepend new bean to the top
  const updatedList = [newBean, ...all]
  await writeBeansToFile(updatedList)
  return newBean
}

/**
 * Update an existing coffee bean
 */
export async function updateBean(id: string, data: Partial<BeanFormData>): Promise<Bean | null> {
  const all = await readBeansFromFile()
  const index = all.findIndex((b) => b.id === id)
  if (index === -1) return null

  const existing = all[index]
  const now = new Date().toISOString()

  const updatedBean: Bean = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    roaster: data.roaster !== undefined ? data.roaster.trim() : existing.roaster,
    country: data.country !== undefined ? data.country.trim() : existing.country,
    region: data.region !== undefined ? data.region.trim() : existing.region,
    image: data.image !== undefined ? data.image.trim() : existing.image,
    roast: data.roast !== undefined ? data.roast : existing.roast,
    flavors: data.flavors !== undefined ? data.flavors : existing.flavors,
    purposes: data.purposes !== undefined ? data.purposes : existing.purposes,
    acidity: data.acidity !== undefined ? Number(data.acidity) : existing.acidity,
    body: data.body !== undefined ? Number(data.body) : existing.body,
    sweetness: data.sweetness !== undefined ? Number(data.sweetness) : existing.sweetness,
    price: data.price !== undefined ? Number(data.price) : existing.price,
    currency: data.currency !== undefined ? data.currency : existing.currency,
    weight: data.weight !== undefined ? data.weight.trim() : existing.weight,
    variety: data.variety !== undefined ? data.variety.trim() : existing.variety,
    process: data.process !== undefined ? data.process.trim() : existing.process,
    rating: data.rating !== undefined ? Number(data.rating) : existing.rating,
    blurb: data.blurb !== undefined ? data.blurb.trim() : existing.blurb,
    url: data.url !== undefined ? data.url.trim() : existing.url,
    inStock: data.inStock !== undefined ? data.inStock : existing.inStock,
    featured: data.featured !== undefined ? data.featured : existing.featured,
    updatedAt: now,
  }

  all[index] = updatedBean
  await writeBeansToFile(all)
  return updatedBean
}

/**
 * Delete a coffee bean
 */
export async function deleteBean(id: string): Promise<boolean> {
  const all = await readBeansFromFile()
  const initialLength = all.length
  const filtered = all.filter((b) => b.id !== id)
  
  if (filtered.length === initialLength) {
    return false
  }

  await writeBeansToFile(filtered)
  return true
}

/**
 * Quick toggle for in-stock status
 */
export async function toggleBeanStock(id: string, inStock?: boolean): Promise<Bean | null> {
  const all = await readBeansFromFile()
  const index = all.findIndex((b) => b.id === id)
  if (index === -1) return null

  const newStock = typeof inStock === "boolean" ? inStock : !all[index].inStock
  return updateBean(id, { inStock: newStock })
}

/**
 * Get aggregated statistics for the admin dashboard
 */
export async function getAdminStats(): Promise<AdminStats> {
  const all = await readBeansFromFile()
  const roasters = new Set(all.map((b) => b.roaster).filter(Boolean))
  const countries = new Set(all.map((b) => b.country).filter(Boolean))
  const outOfStock = all.filter((b) => !b.inStock).length
  const featured = all.filter((b) => b.featured).length
  const totalPrice = all.reduce((sum, b) => sum + (b.price || 0), 0)
  const averagePrice = all.length > 0 ? Number((totalPrice / all.length).toFixed(2)) : 0

  return {
    totalBeans: all.length,
    totalRoasters: roasters.size,
    totalCountries: countries.size,
    outOfStockCount: outOfStock,
    featuredCount: featured,
    averagePrice,
  }
}
