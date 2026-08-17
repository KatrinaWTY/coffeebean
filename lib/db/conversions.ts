import fs from "fs/promises"
import path from "path"
import { AffiliateConversion } from "@/lib/types"
import { isWithinDateRange } from "./clicks"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "conversions.json")

let cachedConversions: AffiliateConversion[] | null = null

async function readConversionsFromFile(): Promise<AffiliateConversion[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as AffiliateConversion[]
    cachedConversions = parsed
    return parsed
  } catch (error) {
    if (cachedConversions) return cachedConversions
    return []
  }
}

async function writeConversionsToFile(conversions: AffiliateConversion[]): Promise<void> {
  cachedConversions = conversions
  const dir = path.dirname(DATA_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  
  const tempPath = `${DATA_FILE_PATH}.tmp.${Date.now()}`
  await fs.writeFile(tempPath, JSON.stringify(conversions, null, 2), "utf-8")
  await fs.rename(tempPath, DATA_FILE_PATH)
}

export async function recordConversion(
  convData: Omit<AffiliateConversion, "id" | "createdAt">
): Promise<AffiliateConversion> {
  const all = await readConversionsFromFile()
  
  // Prevent duplicate conversions by externalTransactionId + network
  const existingIndex = all.findIndex(
    (c) => c.externalTransactionId === convData.externalTransactionId && c.affiliateNetwork === convData.affiliateNetwork
  )

  const now = new Date().toISOString()
  if (existingIndex !== -1) {
    // Update existing conversion status / commission if updated
    const updated: AffiliateConversion = {
      ...all[existingIndex],
      ...convData,
      updatedAt: now, // Add dynamic update property if we want, or just update the object fields
    } as any
    all[existingIndex] = updated
    await writeConversionsToFile(all)
    return updated
  }

  const newConversion: AffiliateConversion = {
    ...convData,
    id: `cnv-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    createdAt: now,
  }

  all.push(newConversion)
  await writeConversionsToFile(all)
  return newConversion
}

export async function getConversions(options?: {
  coffeeBeanId?: string
  retailerId?: string
  affiliateNetwork?: string
  status?: string
  dateRange?: string
  customStart?: string
  customEnd?: string
}): Promise<AffiliateConversion[]> {
  const all = await readConversionsFromFile()
  if (!options) return all

  const { coffeeBeanId, retailerId, affiliateNetwork, status, dateRange, customStart, customEnd } = options

  return all.filter((conv) => {
    if (coffeeBeanId && conv.coffeeBeanId !== coffeeBeanId) return false
    if (retailerId && conv.retailerId !== retailerId) return false
    if (affiliateNetwork && conv.affiliateNetwork !== affiliateNetwork) return false
    if (status && conv.status !== status) return false
    // Filter based on orderDate or conversionDate (orderDate is standard for click performance)
    if (dateRange && !isWithinDateRange(conv.orderDate, dateRange, customStart, customEnd)) return false
    return true
  })
}

export async function importConversionsFromCsv(
  csvText: string
): Promise<{ importedCount: number; errors: string[] }> {
  const lines = csvText.split(/\r?\n/)
  if (lines.length < 2) return { importedCount: 0, errors: ["Empty CSV file"] }

  // Simple CSV parser supporting quotes
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = []
    let curVal = ""
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(curVal.trim())
        curVal = ""
      } else {
        curVal += char
      }
    }
    result.push(curVal.trim())
    return result
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/["']/g, ""))
  const imported: Omit<AffiliateConversion, "id" | "createdAt">[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const row = parseCsvLine(line)
    if (row.length !== headers.length) {
      errors.push(`Line ${i + 1}: Column count mismatch (Expected ${headers.length}, got ${row.length})`)
      continue
    }

    const data: Record<string, string> = {}
    headers.forEach((header, idx) => {
      data[header] = row[idx].replace(/^"|"$/g, "") // strip residual wrapping quotes
    })

    const network = data.network || data.affiliatenetwork || ""
    const retailerId = data.retailerid || data.retailer || ""
    const externalTransactionId = data.externaltransactionid || data.transactionid || ""
    const orderDate = data.orderdate || new Date().toISOString()
    const conversionDate = data.conversiondate || new Date().toISOString()
    const orderValue = parseFloat(data.ordervalue) || 0
    const commissionValue = parseFloat(data.commissionvalue || data.commission || "0") || 0
    const currency = data.currency || "GBP"
    const status = (data.status || "Pending") as any
    const coffeeBeanId = data.coffeebeanid || data.beanid || undefined
    const clickId = data.clickid || undefined
    const rawExternalReferenceId = data.rawexternalreferenceid || undefined

    if (!network) {
      errors.push(`Line ${i + 1}: Missing network/affiliateNetwork field`)
      continue
    }
    if (!retailerId) {
      errors.push(`Line ${i + 1}: Missing retailerId/retailer field`)
      continue
    }
    if (!externalTransactionId) {
      errors.push(`Line ${i + 1}: Missing externalTransactionId/transactionId field`)
      continue
    }

    imported.push({
      affiliateNetwork: network,
      retailerId,
      externalTransactionId,
      orderDate,
      conversionDate,
      orderValue,
      commissionValue,
      currency,
      status: ["Pending", "Approved", "Rejected", "Paid"].includes(status) ? status : "Pending",
      coffeeBeanId,
      clickId,
      rawExternalReferenceId,
    })
  }

  let count = 0
  for (const conv of imported) {
    try {
      await recordConversion(conv)
      count++
    } catch (e: any) {
      errors.push(`Error importing transaction "${conv.externalTransactionId}": ${e.message}`)
    }
  }

  return { importedCount: count, errors }
}
