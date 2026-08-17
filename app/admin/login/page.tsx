"use client"

import { useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Coffee,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"
import { loginAdminAction } from "@/app/admin/actions"
import { FormState } from "@/lib/types"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/admin/coffee-beans"

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState<FormState | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)

    if (!password) {
      setFeedback({
        success: false,
        message: "Please enter the admin password.",
      })
      return
    }

    const formData = new FormData()
    formData.set("password", password)
    formData.set("next", nextPath)

    startTransition(async () => {
      try {
        const res = await loginAdminAction(null, formData)
        if (res && !res.success) {
          setFeedback(res)
        }
      } catch (err: any) {
        // Next.js redirect throws a NEXT_REDIRECT error in Server Actions which is expected on success
        if (err?.message?.includes("NEXT_REDIRECT")) {
          return
        }
        setFeedback({
          success: false,
          message: "An error occurred during authentication. Please try again.",
        })
      }
    })
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Brand Badge */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="size-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-4">
          <Coffee className="size-8" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
          Admin Portal
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Enter your administrative passphrase to manage specialty beans & inventory.
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        {feedback && !feedback.success && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs font-bold text-destructive animate-in fade-in duration-200">
            <AlertCircle className="size-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-[#801854] tracking-wide mb-2"
            >
              Admin Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] py-3.5 pl-11 pr-11 text-sm font-semibold text-foreground outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-white focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-2">
              Default development password: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">coffee-admin-2025</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border/60 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  )
}
