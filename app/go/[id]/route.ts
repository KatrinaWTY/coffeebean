import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getBeanById } from "@/lib/db/beans"
import { recordClick, isBotUserAgent } from "@/lib/db/clicks"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const bean = await getBeanById(id)
  if (!bean) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const userAgent = request.headers.get("user-agent") || ""

  // 1. Bot spam prevention: check if this is a web crawler / bot
  if (isBotUserAgent(userAgent)) {
    // Redirect crawler to normal destination but DO NOT record click analytics
    const redirectUrl = bean.affiliateUrl || bean.url || "/"
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const rawFilters = searchParams.get("filters") || ""
  const ctaLocation = searchParams.get("cta") || "card"
  const referer = request.headers.get("referer") || ""
  const pagePath = searchParams.get("path") || "/"

  // Parse filters used if available
  let parsedFilters: any = {}
  try {
    if (rawFilters) {
      parsedFilters = JSON.parse(rawFilters)
    }
  } catch {}

  // 2. Cookie session management (anonymous session ID for grouping clicks)
  const cookieStore = await cookies()
  let sessionId = cookieStore.get("bean_buddy_session_id")?.value
  const setSessionCookie = !sessionId

  if (!sessionId) {
    sessionId = `sess_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
  }

  // 3. Retrieve UTM metrics: check URL query first, fall back to cookies
  const utmSource = searchParams.get("utm_source") || cookieStore.get("bean_buddy_utm_source")?.value || ""
  const utmMedium = searchParams.get("utm_medium") || cookieStore.get("bean_buddy_utm_medium")?.value || ""
  const utmCampaign = searchParams.get("utm_campaign") || cookieStore.get("bean_buddy_utm_campaign")?.value || ""

  // 4. Device classification
  let deviceCategory: "desktop" | "mobile" | "tablet" | "unknown" = "desktop"
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceCategory = "tablet"
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(userAgent)) {
    deviceCategory = "mobile"
  }

  // 5. Save the analytics record
  try {
    await recordClick({
      coffeeBeanId: bean.id,
      retailerId: bean.retailerId || "",
      affiliateNetwork: bean.affiliateNetwork || "direct",
      referrer: referer,
      path: pagePath,
      searchQuery: query,
      filters: parsedFilters,
      ctaLocation,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
      deviceCategory,
    })
  } catch (error) {
    console.error("Failed to log affiliate click:", error)
  }

  // 6. Safe redirection to stored affiliateUrl (fallback to url)
  const targetUrl = bean.affiliateUrl || bean.url || "/"
  
  // Protect against open redirects: Ensure it's a valid parsed URL structure or relative path
  let safeRedirectUrl: URL
  try {
    safeRedirectUrl = new URL(targetUrl)
  } catch {
    // If it's not a absolute URL, make it relative to our store domain
    safeRedirectUrl = new URL(targetUrl, request.url)
  }

  const response = NextResponse.redirect(safeRedirectUrl)

  // Save session cookie if it is new
  if (setSessionCookie) {
    response.cookies.set("bean_buddy_session_id", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}
