import {
  Bean,
  Roast,
  Purpose,
  ProcessMethod,
  ALL_ROASTS,
  ALL_PURPOSES,
  ALL_PROCESS_METHODS,
  ALL_FLAVORS,
} from "@/lib/types"
import { BATCH_IMPORT_COLUMNS } from "./columns"

export interface NormalizedImportBean {
  externalId?: string
  roaster: string
  retailerName: string
  name: string
  productUrl: string
  affiliateUrl?: string
  affiliateNetwork?: string
  merchantId?: string
  image?: string
  price: number
  currency: string
  bagSizeG: number
  weight: string
  pricePer100g: number
  country: string
  region: string
  process: ProcessMethod | string
  roast: Roast
  purposes: Purpose[]
  flavors: string[]
  isDecaf: boolean
  inStock: boolean
  featured: boolean
  active: boolean
  adminNotes?: string
}

export interface RowValidationIssue {
  rowNumber: number
  field: string
  value: string
  message: string
  severity: "error" | "warning"
}

export interface ValidatedRow {
  rowNumber: number
  status: "ready" | "warning" | "error"
  matchStatus: "new" | "duplicate"
  existingBeanId?: string
  existingBeanName?: string
  data: NormalizedImportBean
  errors: RowValidationIssue[]
  warnings: RowValidationIssue[]
}

export interface BatchValidationSummary {
  total: number
  valid: number
  warnings: number
  errors: number
  duplicates: number
  newCount: number
}

/**
 * Sanitize cell values against formula injection and trim whitespace
 */
export function sanitizeCellValue(val: any): string {
  if (val === null || val === undefined) return ""
  let str = String(val).trim()
  // Prevent spreadsheet formula injection (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    // If it looks like a formula rather than a number like "-5"
    if (str.startsWith("=") || str.startsWith("@") || str.startsWith("+")) {
      str = str.replace(/^[=+\-@\t\r]+/, "")
    }
  }
  return str
}

/**
 * Parse string or boolean into boolean
 */
export function parseBoolean(val: any, defaultVal = false): boolean {
  if (typeof val === "boolean") return val
  if (typeof val === "number") return val !== 0
  if (typeof val === "string") {
    const s = val.trim().toLowerCase()
    if (s === "true" || s === "1" || s === "yes" || s === "y" || s === "t") return true
    if (s === "false" || s === "0" || s === "no" || s === "n" || s === "f") return false
  }
  return defaultVal
}

/**
 * Parse pipe-delimited values (e.g. "Chocolate | Nutty | Caramel")
 */
export function parsePipeSeparated(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map((v) => sanitizeCellValue(v)).filter(Boolean)
  const str = String(val)
  return str
    .split("|")
    .map((item) => sanitizeCellValue(item))
    .filter(Boolean)
}

/**
 * URL validator accepting http://, https://, or relative paths
 */
export function isValidHttpUrl(urlString: string): boolean {
  if (!urlString) return true
  const trimmed = urlString.trim()
  if (trimmed.startsWith("/")) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Clean and canonicalize URLs for duplicate matching
 */
export function canonicalizeUrl(urlStr?: string): string {
  if (!urlStr) return ""
  try {
    const u = new URL(urlStr.trim().toLowerCase())
    return `${u.hostname}${u.pathname}`.replace(/\/+$/, "")
  } catch {
    return urlStr.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  }
}

/**
 * Normalize roast string to standard Roast enum
 */
export function normalizeRoast(val: any): Roast {
  const str = sanitizeCellValue(val).toLowerCase()
  if (str.includes("light")) return "Light"
  if (str.includes("medium-dark") || str.includes("medium dark") || str.includes("med-dark")) return "Medium-Dark"
  if (str.includes("dark")) return "Dark"
  if (str.includes("medium") || str.includes("med")) return "Medium"
  return "Medium"
}

/**
 * Normalize process string to ProcessMethod
 */
export function normalizeProcess(val: any): ProcessMethod | string {
  const str = sanitizeCellValue(val).toLowerCase()
  if (str.includes("wash")) return "Washed"
  if (str.includes("nat")) return "Natural"
  if (str.includes("hon")) return "Honey"
  if (str.includes("anaerob")) return "Anaerobic"
  if (str.length > 0) return sanitizeCellValue(val)
  return "Washed"
}

/**
 * Normalize brew purposes array
 */
export function normalizePurposes(val: any): Purpose[] {
  const items = parsePipeSeparated(val)
  if (items.length === 0) return ["Espresso", "Pour Over", "Drip", "French Press"]

  const result: Purpose[] = []
  for (const item of items) {
    const s = item.toLowerCase()
    if (s.includes("espresso")) result.push("Espresso")
    else if (s.includes("pour") || s.includes("v60") || s.includes("kalita") || s.includes("chemex")) result.push("Pour Over")
    else if (s.includes("drip") || s.includes("batch") || s.includes("filter")) result.push("Drip")
    else if (s.includes("french") || s.includes("press") || s.includes("cafetiere")) result.push("French Press")
    else if (s.includes("cold")) result.push("Cold Brew")
    else if (s.includes("aero") || s.includes("aeropress")) result.push("Aeropress")
    else if (s.includes("moka") || s.includes("stovetop")) result.push("Moka Pot")
  }

  const unique = Array.from(new Set(result))
  return unique.length > 0 ? unique : ["Pour Over", "Espresso"]
}

/**
 * Normalize flavor notes array
 */
export function normalizeFlavors(val: any): string[] {
  const items = parsePipeSeparated(val)
  if (items.length === 0) return ["Chocolate", "Nutty"]
  // Capitalize neatly
  return items.map((f) => {
    return f.charAt(0).toUpperCase() + f.slice(1)
  })
}

/**
 * Extract field by matching key or aliases from raw spreadsheet row
 */
export function extractRowField(row: Record<string, any>, columnDef: typeof BATCH_IMPORT_COLUMNS[0]): any {
  // 1. Exact match
  if (row[columnDef.key] !== undefined) return row[columnDef.key]
  if (row[columnDef.header] !== undefined) return row[columnDef.header]

  // 2. Normalized lowercase header match
  const lowerKeys = Object.keys(row).map((k) => ({
    original: k,
    normalized: k.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/^_+|_+$/g, ""),
  }))

  const targetKey = columnDef.key.toLowerCase().replace(/[^a-z0-9]/g, "_")
  const directMatch = lowerKeys.find((k) => k.normalized === targetKey)
  if (directMatch) return row[directMatch.original]

  // 3. Aliases match
  if (columnDef.aliases) {
    for (const alias of columnDef.aliases) {
      const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9]/g, "_")
      const match = lowerKeys.find((k) => k.normalized === aliasNorm)
      if (match) return row[match.original]
    }
  }

  return undefined
}

/**
 * Validate a single row from the spreadsheet
 */
export function validateRow(
  rawRow: Record<string, any>,
  rowNumber: number,
  existingBeans: Bean[] = []
): ValidatedRow {
  const errors: RowValidationIssue[] = []
  const warnings: RowValidationIssue[] = []

  // Extract raw fields using column definitions
  const rawExternalId = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "external_id")!))
  const rawRoaster = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "roaster_brand")!))
  const rawRetailer = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "retailer")!))
  const rawName = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "name")!))
  const rawProductUrl = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "product_url")!))
  const rawAffiliateUrl = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "affiliate_url")!))
  const rawAffiliateNetwork = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "affiliate_network")!))
  const rawMerchantId = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "merchant_id")!))
  const rawImageUrl = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "image_url")!))
  const rawPrice = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "price")!)
  const rawCurrency = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "currency")!)) || "GBP"
  const rawBagSizeG = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "bag_size_g")!)
  const rawCountry = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "country")!))
  const rawRegion = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "region")!))
  const rawProcess = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "process")!)
  const rawRoast = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "roast_level")!)
  const rawBestFor = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "best_for")!)
  const rawFlavors = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "flavour_notes")!)
  const rawIsDecaf = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "is_decaf")!)
  const rawInStock = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "in_stock")!)
  const rawFeatured = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "featured")!)
  const rawActive = extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "active")!)
  const rawAdminNotes = sanitizeCellValue(extractRowField(rawRow, BATCH_IMPORT_COLUMNS.find((c) => c.key === "admin_notes")!))

  // 1. Required Validations
  if (!rawName) {
    errors.push({
      rowNumber,
      field: "name",
      value: "",
      message: "Bean name is required",
      severity: "error",
    })
  }

  if (!rawRoaster) {
    errors.push({
      rowNumber,
      field: "roaster_brand",
      value: "",
      message: "Roaster brand is required",
      severity: "error",
    })
  }

  if (!rawRetailer) {
    errors.push({
      rowNumber,
      field: "retailer",
      value: "",
      message: "Retailer name is required",
      severity: "error",
    })
  }

  if (!rawProductUrl) {
    errors.push({
      rowNumber,
      field: "product_url",
      value: "",
      message: "Product URL is required",
      severity: "error",
    })
  } else if (!isValidHttpUrl(rawProductUrl)) {
    errors.push({
      rowNumber,
      field: "product_url",
      value: rawProductUrl,
      message: "Product URL must be a valid HTTP or HTTPS URL",
      severity: "error",
    })
  }

  // 2. Optional URL validations
  if (rawAffiliateUrl && !isValidHttpUrl(rawAffiliateUrl)) {
    errors.push({
      rowNumber,
      field: "affiliate_url",
      value: rawAffiliateUrl,
      message: "Affiliate URL must be a valid HTTP or HTTPS URL",
      severity: "error",
    })
  }

  if (rawImageUrl && !isValidHttpUrl(rawImageUrl)) {
    errors.push({
      rowNumber,
      field: "image_url",
      value: rawImageUrl,
      message: "Image URL must be a valid HTTP or HTTPS URL",
      severity: "error",
    })
  }

  // 3. Numeric validations
  let parsedPrice = 0
  if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
    errors.push({
      rowNumber,
      field: "price",
      value: "",
      message: "Price is required",
      severity: "error",
    })
  } else {
    parsedPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ""))
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push({
        rowNumber,
        field: "price",
        value: String(rawPrice),
        message: "Price must be a valid non-negative number",
        severity: "error",
      })
    }
  }

  let parsedBagSizeG = 250
  if (rawBagSizeG === undefined || rawBagSizeG === null || rawBagSizeG === "") {
    errors.push({
      rowNumber,
      field: "bag_size_g",
      value: "",
      message: "Bag size in grams is required",
      severity: "error",
    })
  } else {
    parsedBagSizeG = typeof rawBagSizeG === "number" ? rawBagSizeG : parseFloat(String(rawBagSizeG).replace(/[^0-9.]/g, ""))
    if (isNaN(parsedBagSizeG) || parsedBagSizeG <= 0) {
      errors.push({
        rowNumber,
        field: "bag_size_g",
        value: String(rawBagSizeG),
        message: "Bag size must be greater than 0g",
        severity: "error",
      })
    }
  }

  // 4. Warnings for missing recommended fields
  if (!rawCountry) {
    warnings.push({
      rowNumber,
      field: "country",
      value: "",
      message: "Origin country is missing (recommended for filtering)",
      severity: "warning",
    })
  }

  if (!rawAffiliateUrl && (rawAffiliateNetwork || rawMerchantId)) {
    warnings.push({
      rowNumber,
      field: "affiliate_url",
      value: "",
      message: "Affiliate network provided without an affiliate redirect URL",
      severity: "warning",
    })
  }

  // 5. Normalization & Price Calculation
  const pricePer100g = parsedBagSizeG > 0 ? Number(((parsedPrice / parsedBagSizeG) * 100).toFixed(2)) : 0
  const normalizedRoast = normalizeRoast(rawRoast)
  const normalizedProcess = normalizeProcess(rawProcess)
  const normalizedPurposes = normalizePurposes(rawBestFor)
  const normalizedFlavors = normalizeFlavors(rawFlavors)
  const isDecaf = parseBoolean(rawIsDecaf, false)
  const inStock = parseBoolean(rawInStock, true)
  const featured = parseBoolean(rawFeatured, false)
  const active = parseBoolean(rawActive, true)

  const normalizedBean: NormalizedImportBean = {
    externalId: rawExternalId || undefined,
    roaster: rawRoaster,
    retailerName: rawRetailer,
    name: rawName,
    productUrl: rawProductUrl,
    affiliateUrl: rawAffiliateUrl || undefined,
    affiliateNetwork: rawAffiliateNetwork || undefined,
    merchantId: rawMerchantId || undefined,
    image: rawImageUrl || "",
    price: parsedPrice,
    currency: rawCurrency.toUpperCase(),
    bagSizeG: parsedBagSizeG,
    weight: `${parsedBagSizeG}g`,
    pricePer100g,
    country: rawCountry || "Single Origin",
    region: rawRegion || "",
    process: normalizedProcess,
    roast: normalizedRoast,
    purposes: normalizedPurposes,
    flavors: normalizedFlavors,
    isDecaf,
    inStock,
    featured,
    active,
    adminNotes: rawAdminNotes || undefined,
  }

  // 6. Duplicate Detection against existing beans
  let matchStatus: "new" | "duplicate" = "new"
  let existingBeanId: string | undefined
  let existingBeanName: string | undefined

  if (rawExternalId) {
    const match = existingBeans.find(
      (b) => b.id === rawExternalId || b.merchantId === rawExternalId
    )
    if (match) {
      matchStatus = "duplicate"
      existingBeanId = match.id
      existingBeanName = match.name
    }
  }

  if (matchStatus === "new" && rawProductUrl) {
    const canonTarget = canonicalizeUrl(rawProductUrl)
    const match = existingBeans.find((b) => b.url && canonicalizeUrl(b.url) === canonTarget)
    if (match) {
      matchStatus = "duplicate"
      existingBeanId = match.id
      existingBeanName = match.name
    }
  }

  if (matchStatus === "new" && rawRoaster && rawName) {
    const roasterLower = rawRoaster.toLowerCase()
    const nameLower = rawName.toLowerCase()
    const match = existingBeans.find(
      (b) =>
        b.roaster.toLowerCase() === roasterLower &&
        (b.name.toLowerCase() === nameLower ||
          b.name.toLowerCase().includes(nameLower) ||
          nameLower.includes(b.name.toLowerCase()))
    )
    if (match) {
      matchStatus = "duplicate"
      existingBeanId = match.id
      existingBeanName = match.name
    }
  }

  const status: "ready" | "warning" | "error" =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ready"

  return {
    rowNumber,
    status,
    matchStatus,
    existingBeanId,
    existingBeanName,
    data: normalizedBean,
    errors,
    warnings,
  }
}

/**
 * Validate an array of parsed spreadsheet rows
 */
export function validateAllRows(
  rawRows: Record<string, any>[],
  existingBeans: Bean[] = []
): {
  rows: ValidatedRow[]
  summary: BatchValidationSummary
} {
  const rows: ValidatedRow[] = []
  let validCount = 0
  let warningsCount = 0
  let errorsCount = 0
  let duplicateCount = 0
  let newCount = 0

  rawRows.forEach((rawRow, idx) => {
    // Check if entire row is empty
    const values = Object.values(rawRow).filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    if (values.length === 0) return

    const validated = validateRow(rawRow, idx + 2, existingBeans) // idx + 2 accounts for 1-based index and header row
    rows.push(validated)

    if (validated.status === "error") {
      errorsCount++
    } else if (validated.status === "warning") {
      warningsCount++
      validCount++
    } else {
      validCount++
    }

    if (validated.matchStatus === "duplicate") {
      duplicateCount++
    } else {
      newCount++
    }
  })

  return {
    rows,
    summary: {
      total: rows.length,
      valid: validCount,
      warnings: warningsCount,
      errors: errorsCount,
      duplicates: duplicateCount,
      newCount,
    },
  }
}
