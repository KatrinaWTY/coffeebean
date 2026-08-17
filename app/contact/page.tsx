"use client"

import { useState } from "react"
import { SiteHeader, SiteFooter } from "../page"

export default function ContactPage() {
  const [query, setQuery] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return
    
    // Simulate submission
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#FCF8F5] text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader searchQuery={query} setSearchQuery={setQuery} placeholder="Search beans..." />
        
        <section className="mx-auto w-full max-w-2xl px-5 py-16 flex flex-col items-center">
          {/* Header text */}
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#FF803E] mb-3">
              聯絡我們
            </h1>
            <p className="text-sm text-[#6B5A50] font-medium leading-relaxed">
              有任何問題或想進行合作？歡迎聯絡我們。
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full rounded-[2rem] border border-[#EADFD7] bg-white p-8 md:p-10 shadow-[0_15px_40px_-20px_rgba(120,80,40,0.15)] transition-all hover:shadow-[0_18px_50px_-20px_rgba(120,80,40,0.22)]">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="size-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                  <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#3C322B] mb-2">
                  訊息已成功送出！
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  感謝您的聯絡，我們將會盡快與您取得聯繫。
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setName("")
                    setEmail("")
                    setMessage("")
                  }}
                  className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  再次傳送訊息
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-bold text-[#801854] tracking-wide">
                    姓名
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="您的姓名"
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] hover:bg-[#EFECE9] focus:bg-white focus:border-primary px-5 py-4 text-sm font-semibold text-[#3C322B] outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-bold text-[#801854] tracking-wide">
                    電子郵件地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] hover:bg-[#EFECE9] focus:bg-white focus:border-primary px-5 py-4 text-sm font-semibold text-[#3C322B] outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-bold text-[#801854] tracking-wide">
                    訊息內容
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="我們能為您提供什麼幫助？（例如：說明活動內容、長度、語言等）"
                    className="w-full rounded-2xl border border-transparent bg-[#F5F2F0] hover:bg-[#EFECE9] focus:bg-white focus:border-primary px-5 py-4 text-sm font-semibold text-[#3C322B] outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/60 resize-none min-h-[140px]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full mt-2 rounded-full bg-gradient-to-r from-[#8A84FC] to-[#7B74FC] hover:from-[#7B74FC] hover:to-[#6C64FC] py-4 text-sm font-bold text-white shadow-[0_8px_25px_-8px_rgba(123,116,252,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(123,116,252,0.8)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  傳送訊息
                </button>
              </form>
            )}
          </div>
          
          {/* Privacy footer note */}
          <p className="text-xs text-muted-foreground/80 mt-6 text-center leading-relaxed">
            我們非常重視您的隱私，絕不向第三方洩露您的資訊。
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
