import { getClicks } from "@/lib/db/clicks"
import { getConversions } from "@/lib/db/conversions"
import { getRetailers } from "@/lib/db/retailers"
import { getBeans } from "@/lib/db/beans"
import { getAffiliateNetworks } from "@/lib/db/networks"
import { AffiliateDashboardClient } from "@/components/admin/affiliate-dashboard-client"

export const dynamic = "force-dynamic"

interface AffiliatePageProps {
  searchParams: Promise<{
    range?: string
    start?: string
    end?: string
  }>
}

export default async function AdminAffiliatePage({ searchParams }: AffiliatePageProps) {
  const params = await searchParams
  const range = params.range || "last7"
  const start = params.start || ""
  const end = params.end || ""

  // Fetch data on the server with active date range filters applied
  const clicks = await getClicks({ dateRange: range, customStart: start, customEnd: end })
  const conversions = await getConversions({ dateRange: range, customStart: start, customEnd: end })
  const retailers = await getRetailers()
  const beans = await getBeans()
  const networks = await getAffiliateNetworks()

  return (
    <AffiliateDashboardClient
      initialClicks={clicks}
      initialConversions={conversions}
      retailers={retailers}
      beans={beans}
      networks={networks}
      activeRange={range}
      activeStart={start}
      activeEnd={end}
    />
  )
}
