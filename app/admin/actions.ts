"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  isAdminAuthenticated,
  verifyAdminPassword,
  setAdminSessionCookie,
  clearAdminSessionCookie,
} from "@/lib/auth"
import {
  createBean,
  updateBean,
  deleteBean,
  toggleBeanStock,
  getBeans,
  batchUpsertBeans,
  BatchImportResult,
} from "@/lib/db/beans"
import { getRetailers, createRetailer } from "@/lib/db/retailers"
import { recordConversion, importConversionsFromCsv } from "@/lib/db/conversions"
import { validateRow, NormalizedImportBean } from "@/lib/import/validator"
import { generateTemplateXlsxBuffer, generateTemplateCsvText } from "@/lib/import/columns"
import {
  BeanFormData,
  FormState,
  Purpose,
  Roast,
  ProcessMethod,
} from "@/lib/types"

/**
 * Admin Login Server Action
 */
export async function loginAdminAction(
  _prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const password = formData.get("password")?.toString() || ""
  const next = formData.get("next")?.toString() || "/admin/coffee-beans"

  if (!password) {
    return {
      success: false,
      message: "Please enter the admin password.",
      errors: { password: ["Password is required"] },
    }
  }

  const isValid = verifyAdminPassword(password)
  if (!isValid) {
    return {
      success: false,
      message: "Incorrect admin password. Please try again.",
      errors: { password: ["Invalid password"] },
    }
  }

  await setAdminSessionCookie()
  redirect(next.startsWith("/admin") ? next : "/admin/coffee-beans")
}

/**
 * Admin Logout Server Action
 */
export async function logoutAdminAction(): Promise<void> {
  await clearAdminSessionCookie()
  redirect("/admin/login")
}

/**
 * Helper to validate URL strings
 */
function isValidUrl(urlString: string): boolean {
  if (!urlString) return true
  if (urlString.startsWith("/")) return true // local path
  try {
    const parsed = new URL(urlString)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Save Bean (Create or Edit) Server Action
 */
export async function saveBeanAction(
  _prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in to perform this action.",
    }
  }

  const id = formData.get("id")?.toString()?.trim()
  const name = formData.get("name")?.toString()?.trim() || ""
  const roaster = formData.get("roaster")?.toString()?.trim() || ""
  const country = formData.get("country")?.toString()?.trim() || ""
  const region = formData.get("region")?.toString()?.trim() || ""
  const image = formData.get("image")?.toString()?.trim() || ""
  const roast = (formData.get("roast")?.toString() || "Medium") as Roast
  const rawFlavors = formData.get("flavors")?.toString() || "[]"
  const rawPurposes = formData.get("purposes")?.toString() || "[]"
  const acidity = parseInt(formData.get("acidity")?.toString() || "3", 10)
  const body = parseInt(formData.get("body")?.toString() || "3", 10)
  const sweetness = parseInt(formData.get("sweetness")?.toString() || "3", 10)
  const priceRaw = formData.get("price")?.toString() || "0"
  const price = parseFloat(priceRaw)
  const currency = formData.get("currency")?.toString()?.trim() || "GBP"
  const weight = formData.get("weight")?.toString()?.trim() || "250g"
  const variety = formData.get("variety")?.toString()?.trim() || ""
  const process = formData.get("process")?.toString()?.trim() || "Washed"
  const altitude = formData.get("altitude")?.toString()?.trim() || ""
  const rawVariants = formData.get("variants")?.toString() || "[]"
  const rating = parseFloat(formData.get("rating")?.toString() || "4.5")
  const blurb = formData.get("blurb")?.toString()?.trim() || ""
  const url = formData.get("url")?.toString()?.trim() || ""
  const inStock = formData.get("inStock") === "true" || formData.get("inStock") === "on"
  const featured = formData.get("featured") === "true" || formData.get("featured") === "on"

  // New affiliate tracker inputs
  const retailerId = formData.get("retailerId")?.toString()?.trim() || ""
  const affiliateUrl = formData.get("affiliateUrl")?.toString()?.trim() || ""
  const affiliateNetwork = formData.get("affiliateNetwork")?.toString()?.trim() || ""
  const merchantId = formData.get("merchantId")?.toString()?.trim() || ""

  // Server-side validation
  const errors: Record<string, string[]> = {}

  if (!name || name.length < 2) {
    errors.name = ["Bean name is required (at least 2 characters)"]
  }

  if (!roaster || roaster.length < 2) {
    errors.roaster = ["Roaster / Brand name is required"]
  }

  if (!country) {
    errors.country = ["Country of origin is required"]
  }

  if (isNaN(price) || price < 0) {
    errors.price = ["Please enter a valid non-negative price"]
  }

  if (image && !isValidUrl(image)) {
    errors.image = ["Image URL must be a valid http(s) URL or local path"]
  }

  if (url && !isValidUrl(url)) {
    errors.url = ["Product URL must be a valid http(s) URL"]
  }

  if (affiliateUrl && !isValidUrl(affiliateUrl)) {
    errors.affiliateUrl = ["Affiliate URL must be a valid http(s) URL"]
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Please correct the highlighted errors before saving.",
      errors,
    }
  }

  // Parse arrays safely
  let flavors: string[] = []
  try {
    flavors = JSON.parse(rawFlavors)
    if (!Array.isArray(flavors)) flavors = []
  } catch {
    flavors = rawFlavors
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)
  }

  let purposes: Purpose[] = []
  try {
    purposes = JSON.parse(rawPurposes)
    if (!Array.isArray(purposes)) purposes = []
  } catch {
    purposes = rawPurposes
      .split(",")
      .map((p) => p.trim() as Purpose)
      .filter(Boolean)
  }

  let variants: { weight: string; price: number }[] = []
  try {
    variants = JSON.parse(rawVariants)
    if (!Array.isArray(variants)) variants = []
  } catch {
    variants = []
  }

  const beanData: BeanFormData = {
    name,
    roaster,
    country,
    region,
    image,
    roast,
    flavors,
    purposes,
    acidity: Math.min(5, Math.max(1, acidity)),
    body: Math.min(5, Math.max(1, body)),
    sweetness: Math.min(5, Math.max(1, sweetness)),
    price,
    currency,
    weight,
    variety,
    process,
    altitude,
    variants,
    rating: Math.min(5, Math.max(1, rating)),
    blurb:
      blurb ||
      `A delicious ${roast.toLowerCase()} roast ${process.toLowerCase()} coffee by ${roaster} from ${
        region || country
      }${flavors.length ? `, featuring tasting notes of ${flavors.join(", ").toLowerCase()}` : ""}.`,
    url,
    inStock,
    featured,
    retailerId,
    affiliateUrl,
    affiliateNetwork,
    merchantId,
  }

  try {
    let savedId = id
    if (id) {
      // Edit existing
      const updated = await updateBean(id, beanData)
      if (!updated) {
        return {
          success: false,
          message: `Coffee bean with ID "${id}" was not found.`,
        }
      }
      savedId = updated.id
    } else {
      // Create new
      const created = await createBean(beanData)
      savedId = created.id
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/coffee-beans")
    if (savedId) {
      revalidatePath(`/admin/coffee-beans/${savedId}/edit`)
    }

    return {
      success: true,
      message: id ? "Coffee bean updated successfully!" : "New coffee bean created successfully!",
      beanId: savedId,
    }
  } catch (err: any) {
    console.error("Database error saving bean:", err)
    return {
      success: false,
      message: err.message || "An unexpected error occurred while saving the coffee bean.",
    }
  }
}

/**
 * Delete Bean Server Action
 */
export async function deleteBeanAction(id: string): Promise<FormState> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return {
      success: false,
      message: "Unauthorized: You must be logged in to delete beans.",
    }
  }

  try {
    const success = await deleteBean(id)
    if (!success) {
      return {
        success: false,
        message: `Coffee bean "${id}" could not be found.`,
      }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/coffee-beans")

    return {
      success: true,
      message: "Coffee bean deleted successfully.",
    }
  } catch (err: any) {
    console.error("Error deleting bean:", err)
    return {
      success: false,
      message: err.message || "Failed to delete coffee bean.",
    }
  }
}

/**
 * Toggle Stock Status Server Action
 */
export async function toggleStockAction(id: string): Promise<FormState> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return {
      success: false,
      message: "Unauthorized",
    }
  }

  try {
    const updated = await toggleBeanStock(id)
    if (!updated) {
      return { success: false, message: "Bean not found" }
    }

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/coffee-beans")

    return {
      success: true,
      message: `Stock status updated: ${updated.name} is now ${
        updated.inStock ? "in stock" : "out of stock"
      }.`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to toggle stock status.",
    }
  }
}

/**
 * Fetch retailers for forms
 */
export async function getRetailersAction() {
  return await getRetailers()
}

/**
 * Create a new retailer
 */
export async function saveRetailerAction(name: string, url?: string) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) throw new Error("Unauthorized")
  return await createRetailer({ name, url })
}

/**
 * Fetch live beans (bypass server-side static/caching on root page)
 */
export async function getLiveBeansAction() {
  return await getBeans()
}

/**
 * Save manual conversion record
 */
export async function saveConversionAction(
  _prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) return { success: false, message: "Unauthorized" }

  const network = formData.get("affiliateNetwork")?.toString()?.trim() || ""
  const retailerId = formData.get("retailerId")?.toString()?.trim() || ""
  const externalTransactionId = formData.get("externalTransactionId")?.toString()?.trim() || ""
  const orderValue = parseFloat(formData.get("orderValue")?.toString() || "0")
  const commissionValue = parseFloat(formData.get("commissionValue")?.toString() || "0")
  const currency = formData.get("currency")?.toString()?.trim() || "GBP"
  const status = (formData.get("status")?.toString() || "Pending") as any
  const coffeeBeanId = formData.get("coffeeBeanId")?.toString()?.trim() || undefined
  const orderDate = formData.get("orderDate")?.toString() || new Date().toISOString()
  const conversionDate = formData.get("conversionDate")?.toString() || new Date().toISOString()

  if (!network || !retailerId || !externalTransactionId) {
    return {
      success: false,
      message: "Network, Retailer and External Transaction ID are required.",
    }
  }

  try {
    await recordConversion({
      affiliateNetwork: network,
      retailerId,
      externalTransactionId,
      orderDate,
      conversionDate,
      orderValue,
      commissionValue,
      currency,
      status,
      coffeeBeanId,
    })
    revalidatePath("/admin/affiliate")
    return { success: true, message: "Conversion recorded successfully!" }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to record conversion." }
  }
}

/**
 * Import Conversions CSV Action
 */
export async function importConversionsCsvAction(csvText: string): Promise<{ success: boolean; message: string; errors?: string[] }> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) throw new Error("Unauthorized")

  try {
    const result = await importConversionsFromCsv(csvText)
    revalidatePath("/admin/affiliate")
    return {
      success: true,
      message: `Successfully imported ${result.importedCount} conversion records.`,
      errors: result.errors,
    }
  } catch (err: any) {
    return { success: false, message: err.message || "CSV import failed." }
  }
}

/**
 * Batch import coffee beans action
 */
export async function batchImportBeansAction(payload: {
  rows: { rowNumber: number; data: NormalizedImportBean }[]
  duplicateMode: "skip" | "update"
}): Promise<{
  success: boolean
  message: string
  results?: BatchImportResult
  errors?: string[]
}> {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    return { success: false, message: "Unauthorized: Admin session required." }
  }

  const { rows, duplicateMode } = payload
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return { success: false, message: "No coffee beans to import." }
  }

  if (rows.length > 1000) {
    return { success: false, message: "Exceeded maximum limit of 1,000 rows per batch." }
  }

  // 1. Fetch current retailers to map/create retailer IDs
  const retailers = await getRetailers()
  const retailerMap = new Map<string, string>()
  retailers.forEach((r) => retailerMap.set(r.name.toLowerCase(), r.id))

  // 2. Resolve retailer IDs for each row (auto-create if new)
  const itemsToImport: {
    rowNumber: number
    data: NormalizedImportBean & { retailerId: string }
  }[] = []

  const validationErrors: string[] = []

  for (const item of rows) {
    const rawRowData = item.data
    // Server-side validation check
    const check = validateRow(rawRowData as any, item.rowNumber)
    if (check.status === "error") {
      validationErrors.push(
        `Row ${item.rowNumber} (${rawRowData.name || "Unnamed"}): ${check.errors.map((e) => e.message).join(", ")}`
      )
      continue
    }

    const retName = (rawRowData.retailerName || rawRowData.roaster || "Unknown").trim()
    const retKey = retName.toLowerCase()
    let retId = retailerMap.get(retKey)

    if (!retId && retName) {
      try {
        const created = await createRetailer({ name: retName })
        retId = created.id
        retailerMap.set(retKey, retId)
      } catch {
        retId = `retailer-${Date.now()}`
      }
    }

    itemsToImport.push({
      rowNumber: item.rowNumber,
      data: {
        ...check.data,
        retailerId: retId || "",
      },
    })
  }

  if (itemsToImport.length === 0 && validationErrors.length > 0) {
    return {
      success: false,
      message: "Validation failed for all rows. Please review errors and try again.",
      errors: validationErrors,
    }
  }

  try {
    const importResults = await batchUpsertBeans(itemsToImport, duplicateMode)
    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath("/admin/coffee-beans")
    revalidatePath("/admin/coffee-beans/import")

    return {
      success: true,
      message: `Batch import completed: ${importResults.createdCount} created, ${importResults.updatedCount} updated, ${importResults.skippedCount} skipped, ${importResults.failedCount} failed.`,
      results: importResults,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to execute batch import.",
      errors: [err.message],
    }
  }
}

/**
 * Download Batch Upload Template action (server generated)
 */
export async function downloadTemplateAction(format: "xlsx" | "csv") {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) throw new Error("Unauthorized")

  if (format === "csv") {
    return {
      format: "csv",
      content: generateTemplateCsvText(),
      filename: "coffee_beans_batch_import_template.csv",
    }
  }

  const buffer = generateTemplateXlsxBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  return {
    format: "xlsx",
    base64,
    filename: "coffee_beans_batch_import_template.xlsx",
  }
}


