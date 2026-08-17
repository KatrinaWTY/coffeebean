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
} from "@/lib/db/beans"
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
  const rating = parseFloat(formData.get("rating")?.toString() || "4.5")
  const blurb = formData.get("blurb")?.toString()?.trim() || ""
  const url = formData.get("url")?.toString()?.trim() || ""
  const inStock = formData.get("inStock") === "true" || formData.get("inStock") === "on"
  const featured = formData.get("featured") === "true" || formData.get("featured") === "on"

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
    rating: Math.min(5, Math.max(1, rating)),
    blurb:
      blurb ||
      `A delicious ${roast.toLowerCase()} roast ${process.toLowerCase()} coffee by ${roaster} from ${
        region || country
      }${flavors.length ? `, featuring tasting notes of ${flavors.join(", ").toLowerCase()}` : ""}.`,
    url,
    inStock,
    featured,
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
