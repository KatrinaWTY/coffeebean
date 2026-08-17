import fs from "fs/promises"
import path from "path"
import { Retailer } from "@/lib/types"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "retailers.json")

let cachedRetailers: Retailer[] | null = null

export function generateRetailerId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `retailer-${Date.now()}`
}

async function readRetailersFromFile(): Promise<Retailer[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as Retailer[]
    cachedRetailers = parsed
    return parsed
  } catch (error) {
    if (cachedRetailers) return cachedRetailers
    return []
  }
}

async function writeRetailersToFile(retailers: Retailer[]): Promise<void> {
  cachedRetailers = retailers
  const dir = path.dirname(DATA_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  
  const tempPath = `${DATA_FILE_PATH}.tmp.${Date.now()}`
  await fs.writeFile(tempPath, JSON.stringify(retailers, null, 2), "utf-8")
  await fs.rename(tempPath, DATA_FILE_PATH)
}

export async function getRetailers(): Promise<Retailer[]> {
  return readRetailersFromFile()
}

export async function getRetailerById(id: string): Promise<Retailer | null> {
  const all = await readRetailersFromFile()
  return all.find((r) => r.id === id) || null
}

export async function createRetailer(data: { name: string; url?: string }): Promise<Retailer> {
  const all = await readRetailersFromFile()
  
  const candidateId = generateRetailerId(data.name)
  let finalId = candidateId
  let counter = 1
  while (all.some((r) => r.id === finalId)) {
    finalId = `${candidateId}-${counter}`
    counter++
  }

  const now = new Date().toISOString()
  const newRetailer: Retailer = {
    id: finalId,
    name: data.name.trim(),
    url: data.url?.trim() || "",
    createdAt: now,
    updatedAt: now,
  }

  const updatedList = [...all, newRetailer].sort((a, b) => a.name.localeCompare(b.name))
  await writeRetailersToFile(updatedList)
  return newRetailer
}

export async function updateRetailer(id: string, data: { name?: string; url?: string }): Promise<Retailer | null> {
  const all = await readRetailersFromFile()
  const index = all.findIndex((r) => r.id === id)
  if (index === -1) return null

  const existing = all[index]
  const now = new Date().toISOString()

  const updatedRetailer: Retailer = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    url: data.url !== undefined ? data.url.trim() : existing.url,
    updatedAt: now,
  }

  all[index] = updatedRetailer
  await writeRetailersToFile(all)
  return updatedRetailer
}

export async function deleteRetailer(id: string): Promise<boolean> {
  const all = await readRetailersFromFile()
  const filtered = all.filter((r) => r.id !== id)
  if (filtered.length === all.length) return false
  await writeRetailersToFile(filtered)
  return true
}
