import type { Metadata } from "next"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata: Metadata = {
  title: "Admin Panel — Bean Buddy",
  description: "Manage specialty coffee beans, roasters, inventory, and details.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FCF8F5] text-foreground flex flex-col antialiased">
      <AdminHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs font-semibold text-muted-foreground">
        <p>Bean Buddy Admin Control Panel • Fast & Resilient Coffee Bean Management</p>
      </footer>
    </div>
  )
}
