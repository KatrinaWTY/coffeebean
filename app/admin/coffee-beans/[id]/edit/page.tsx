import Link from "next/link"
import { notFound } from "next/navigation"
import { Coffee, ArrowLeft } from "lucide-react"
import { getBeanById } from "@/lib/db/beans"
import { BeanForm } from "@/components/admin/bean-form"

export const dynamic = "force-dynamic"

interface EditBeanPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBeanPage({ params }: EditBeanPageProps) {
  const { id } = await params
  const bean = await getBeanById(id)

  if (!bean) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">
          <Coffee className="size-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          Coffee Bean Not Found
        </h2>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          The coffee bean with ID <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">{id}</code> could not be found. It may have been deleted or moved.
        </p>
        <Link
          href="/admin/coffee-beans"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to All Coffee Beans</span>
        </Link>
      </div>
    )
  }

  return <BeanForm mode="edit" initialBean={bean} />
}
