import { getBeans } from "@/lib/db/beans"
import { getRetailers } from "@/lib/db/retailers"
import { BatchImport } from "@/components/admin/batch-import"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Batch Import Coffee Beans | Bean Buddy Admin",
}

export default async function AdminBatchImportPage() {
  const [beans, retailers] = await Promise.all([
    getBeans(),
    getRetailers(),
  ])

  return <BatchImport existingBeans={beans} retailers={retailers} />
}
