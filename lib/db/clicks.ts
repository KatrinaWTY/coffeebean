import fs from "fs/promises"
import path from "path"
import { AffiliateClick } from "@/lib/types"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "clicks.json")

let cachedClicks: AffiliateClick[] | null = null

// Simple bot detection patterns
const BOT_PATTERNS = [
  /bot/i, /spider/i, /crawl/i, /lighthouse/i, /semrush/i, /slurp/i, 
  /googlebot/i, /bingbot/i, /yandex/i, /baidu/i, /duckduck/i,
  /twitterbot/i, /facebookexternalhit/i, /linkedinbot/i, /embedly/i,
  /quora/i, /pinterest/i, /slackbot/i, /telegrambot/i, /wa-bot/i
]

export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent))
}

export function isWithinDateRange(
  timestamp: string,
  range: string,
  customStart?: string,
  customEnd?: string
): boolean {
  const date = new Date(timestamp)
  const now = new Date()

  switch (range) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return date >= start
    }
    case "last7": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      return date >= start
    }
    case "last30": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      return date >= start
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return date >= start
    }
    case "prev_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      return date >= start && date < end
    }
    case "custom": {
      if (customStart) {
        const start = new Date(customStart)
        if (date < start) return false
      }
      if (customEnd) {
        const end = new Date(customEnd)
        end.setHours(23, 59, 59, 999)
        if (date > end) return false
      }
      return true
    }
    default:
      return true
  }
}

async function readClicksFromFile(): Promise<AffiliateClick[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as AffiliateClick[]
    cachedClicks = parsed
    return parsed
  } catch (error) {
    if (cachedClicks) return cachedClicks
    return []
  }
}

async function writeClicksToFile(clicks: AffiliateClick[]): Promise<void> {
  cachedClicks = clicks
  const dir = path.dirname(DATA_FILE_PATH)
  await fs.mkdir(dir, { recursive: true })
  
  const tempPath = `${DATA_FILE_PATH}.tmp.${Date.now()}`
  await fs.writeFile(tempPath, JSON.stringify(clicks, null, 2), "utf-8")
  await fs.rename(tempPath, DATA_FILE_PATH)
}

export async function recordClick(clickData: Omit<AffiliateClick, "id" | "timestamp">): Promise<AffiliateClick> {
  const all = await readClicksFromFile()
  
  const newClick: AffiliateClick = {
    ...clickData,
    id: `clk-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }

  all.push(newClick)
  await writeClicksToFile(all)
  return newClick
}

export async function getClicks(options?: {
  coffeeBeanId?: string
  retailerId?: string
  affiliateNetwork?: string
  dateRange?: string
  customStart?: string
  customEnd?: string
}): Promise<AffiliateClick[]> {
  const all = await readClicksFromFile()
  if (!options) return all

  const { coffeeBeanId, retailerId, affiliateNetwork, dateRange, customStart, customEnd } = options

  return all.filter((click) => {
    if (coffeeBeanId && click.coffeeBeanId !== coffeeBeanId) return false
    if (retailerId && click.retailerId !== retailerId) return false
    if (affiliateNetwork && click.affiliateNetwork !== affiliateNetwork) return false
    if (dateRange && !isWithinDateRange(click.timestamp, dateRange, customStart, customEnd)) return false
    return true
  })
}
