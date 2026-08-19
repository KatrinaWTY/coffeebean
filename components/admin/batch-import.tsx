"use client"

import { useState, useTransition, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Check,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  FileText,
  Loader2,
} from "lucide-react"
import { Bean, Retailer } from "@/lib/types"
import {
  ValidatedRow,
  BatchValidationSummary,
  validateAllRows,
  NormalizedImportBean,
} from "@/lib/import/validator"
import {
  batchImportBeansAction,
  downloadTemplateAction,
} from "@/app/admin/actions"
import { BatchImportResult } from "@/lib/db/beans"
import { cn } from "@/lib/utils"

interface BatchImportProps {
  existingBeans: Bean[]
  retailers: Retailer[]
}

type TabFilter = "all" | "ready" | "warnings" | "errors" | "duplicates"

export function BatchImport({ existingBeans, retailers }: BatchImportProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()

  // Workflow steps: "upload" | "preview" | "results"
  const [step, setStep] = useState<"upload" | "preview" | "results">("upload")
  const [fileName, setFileName] = useState<string>("")
  const [fileSizeStr, setFileSizeStr] = useState<string>("")

  // Parsed & Validated Data
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [summary, setSummary] = useState<BatchValidationSummary | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Filtering & Search in Preview
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [previewSearch, setPreviewSearch] = useState<string>("")

  // Settings
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip")
  const [ignoreErrorsAndImportValid, setIgnoreErrorsAndImportValid] = useState<boolean>(false)

  // Execution & Results
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<string | null>(null)

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false)

  // Reset to Upload Step
  const handleReset = () => {
    setStep("upload")
    setFileName("")
    setFileSizeStr("")
    setValidatedRows([])
    setSummary(null)
    setParseError(null)
    setImportResult(null)
    setServerMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Handle template download directly in browser
  const handleDownloadTemplate = async (format: "xlsx" | "csv") => {
    setIsDownloadingTemplate(format)
    try {
      const res = await downloadTemplateAction(format)
      if (res.format === "csv" && res.content) {
        const blob = new Blob([res.content], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (res.format === "xlsx" && res.base64) {
        const byteCharacters = atob(res.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error("Failed to download template:", err)
      alert("Failed to download template: " + (err.message || "Unknown error"))
    } finally {
      setIsDownloadingTemplate(null)
    }
  }

  // File parsing handler
  const handleFileProcess = async (file: File) => {
    setParseError(null)
    setFileName(file.name)
    const sizeKb = (file.size / 1024).toFixed(1)
    setFileSizeStr(`${sizeKb} KB`)

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setParseError("File is too large. Maximum file size allowed is 5 MB.")
      return
    }

    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
    const isCsv = file.name.endsWith(".csv")

    if (!isXlsx && !isCsv) {
      setParseError("Unsupported file type. Please upload a valid .xlsx or .csv file.")
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const firstSheetName = workbook.SheetNames[0]

      if (!firstSheetName) {
        setParseError("The uploaded spreadsheet contains no sheets or data.")
        return
      }

      const worksheet = workbook.Sheets[firstSheetName]
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: "",
        raw: false,
      })

      if (!rawJson || rawJson.length === 0) {
        setParseError("No data rows found in the uploaded file. Please ensure the template contains data rows below the header.")
        return
      }

      if (rawJson.length > 1000) {
        setParseError(`Spreadsheet contains ${rawJson.length} rows. Maximum allowed per batch is 1,000 rows.`)
        return
      }

      // Filter out helper columns starting with `_` (e.g. `_price_per_100g_preview`)
      const cleanedRawRows = rawJson.map((row) => {
        const cleaned: Record<string, any> = {}
        for (const [k, v] of Object.entries(row)) {
          if (!k.startsWith("_")) {
            cleaned[k] = v
          }
        }
        return cleaned
      })

      // Run shared validation & normalization
      const { rows, summary: valSummary } = validateAllRows(cleanedRawRows, existingBeans)

      setValidatedRows(rows)
      setSummary(valSummary)
      setStep("preview")
    } catch (err: any) {
      console.error("Failed to parse file:", err)
      setParseError(`Failed to parse file: ${err.message || "Invalid spreadsheet structure"}`)
    }
  }

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0])
    }
  }

  // Export Errors CSV
  const handleDownloadErrorsCsv = () => {
    const errorRows: { row: number; field: string; value: string; error: string }[] = []
    validatedRows.forEach((r) => {
      r.errors.forEach((e) => {
        errorRows.push({
          row: e.rowNumber,
          field: e.field,
          value: e.value,
          error: e.message,
        })
      })
      r.warnings.forEach((w) => {
        errorRows.push({
          row: w.rowNumber,
          field: w.field,
          value: w.value,
          error: `[Warning] ${w.message}`,
        })
      })
    })

    if (errorRows.length === 0) return

    const headers = ["Row", "Field", "Value", "Issue"]
    const csvContent = [
      headers.join(","),
      ...errorRows.map((item) =>
        [
          item.row,
          `"${item.field}"`,
          `"${String(item.value).replace(/"/g, '""')}"`,
          `"${item.error.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `import_errors_${fileName || "file"}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export Results CSV
  const handleDownloadResultsCsv = () => {
    if (!importResult || !importResult.items) return
    const headers = ["Row", "Bean Name", "Roaster", "Status", "Bean ID", "Details"]
    const csvContent = [
      headers.join(","),
      ...importResult.items.map((item) =>
        [
          item.rowNumber,
          `"${(item.beanName || "").replace(/"/g, '""')}"`,
          `"${(item.roaster || "").replace(/"/g, '""')}"`,
          `"${item.action.toUpperCase()}"`,
          `"${item.beanId || ""}"`,
          `"${(item.reason || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `batch_import_results_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Execute Batch Import
  const handleExecuteImport = () => {
    const rowsToImport = validatedRows
      .filter((r) => (ignoreErrorsAndImportValid ? r.status !== "error" : true))
      .map((r) => ({
        rowNumber: r.rowNumber,
        data: r.data,
      }))

    if (rowsToImport.length === 0) {
      alert("No valid rows available to import.")
      return
    }

    startTransition(async () => {
      try {
        const response = await batchImportBeansAction({
          rows: rowsToImport,
          duplicateMode,
        })

        if (response.success && response.results) {
          setImportResult(response.results)
          setServerMessage(response.message)
          setStep("results")
        } else {
          setParseError(response.message || "Batch import failed")
        }
      } catch (err: any) {
        console.error("Batch import error:", err)
        setParseError(err.message || "An unexpected error occurred during import.")
      }
    })
  }

  // Filtered rows for preview table
  const filteredRows = validatedRows.filter((r) => {
    // Tab filter
    if (activeTab === "ready" && (r.status !== "ready" || r.matchStatus === "duplicate")) return false
    if (activeTab === "warnings" && r.status !== "warning") return false
    if (activeTab === "errors" && r.status !== "error") return false
    if (activeTab === "duplicates" && r.matchStatus !== "duplicate") return false

    // Search filter
    if (previewSearch.trim()) {
      const q = previewSearch.trim().toLowerCase()
      const matches =
        r.data.name.toLowerCase().includes(q) ||
        r.data.roaster.toLowerCase().includes(q) ||
        r.data.retailerName.toLowerCase().includes(q) ||
        r.data.country.toLowerCase().includes(q) ||
        r.data.flavors.some((f) => f.toLowerCase().includes(q))
      if (!matches) return false
    }

    return true
  })

  const hasBlockingErrors = summary ? summary.errors > 0 : false
  const rowsToImportCount = ignoreErrorsAndImportValid
    ? validatedRows.filter((r) => r.status !== "error").length
    : validatedRows.length

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin/coffee-beans"
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Coffee Beans
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              <Sparkles className="size-3" />
              Excel / CSV Batch Importer
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Batch Import Coffee Beans
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload multiple specialty coffee beans at once with automatic validation, duplicate detection, and live preview.
          </p>
        </div>

        {/* Action Buttons: Download Templates */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadTemplate("xlsx")}
            disabled={isDownloadingTemplate !== null}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#EADFD7] bg-white px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-[#FAF8F5] transition-all cursor-pointer disabled:opacity-50"
            title="Download formatted Excel batch upload template"
          >
            {isDownloadingTemplate === "xlsx" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <FileSpreadsheet className="size-4 text-emerald-600" />
            )}
            <span>Download Excel Template (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadTemplate("csv")}
            disabled={isDownloadingTemplate !== null}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#EADFD7] bg-white px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs hover:bg-[#FAF8F5] transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV batch upload template"
          >
            {isDownloadingTemplate === "csv" ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <FileText className="size-4 text-blue-600" />
            )}
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          WORKFLOW STEP 1: UPLOAD AREA
          ========================================== */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Parse error alert if any */}
          {parseError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3 text-xs text-destructive font-medium">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-destructive">Upload Error</p>
                <p className="mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all cursor-pointer select-none",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-[#EADFD7] bg-white hover:border-primary/50 hover:bg-[#FCF8F5]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="size-16 rounded-2xl bg-accent/60 flex items-center justify-center text-accent-foreground mb-4 shadow-sm">
              <Upload className="size-8 text-amber-800" />
            </div>

            <h3 className="font-heading text-xl font-bold text-foreground">
              Choose an Excel or CSV file to import
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              Drag and drop your spreadsheet here, or click to browse files. Supports <span className="font-bold text-foreground">.xlsx</span> and <span className="font-bold text-foreground">.csv</span> up to 5 MB (max 1,000 products).
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all pointer-events-none"
              >
                Select File
              </button>
            </div>
          </div>

          {/* Quick Guidance & Expected Columns Info */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              Spreadsheet Template Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed">
              <div className="rounded-2xl bg-[#FAF8F5] p-4 border border-[#EADFD7]">
                <h4 className="font-bold text-foreground mb-1">1. Required Columns</h4>
                <p>
                  <code className="font-bold text-primary">roaster_brand</code>, <code className="font-bold text-primary">retailer</code>, <code className="font-bold text-primary">name</code>, and <code className="font-bold text-primary">product_url</code> are strictly required for each row.
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF8F5] p-4 border border-[#EADFD7]">
                <h4 className="font-bold text-foreground mb-1">2. Multi-value Fields with Pipe (|)</h4>
                <p>
                  Separate flavor notes and brew methods with a pipe delimiter: e.g. <span className="font-semibold text-foreground">"Chocolate | Nutty | Caramel"</span>.
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF8F5] p-4 border border-[#EADFD7]">
                <h4 className="font-bold text-foreground mb-1">3. Safe Upsert & Duplicates</h4>
                <p>
                  Products matching existing URLs or SKUs are flagged during preview. You can choose to skip or update them before importing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WORKFLOW STEP 2 & 3: VALIDATION & PREVIEW
          ========================================== */}
      {step === "preview" && summary && (
        <div className="space-y-6">
          {/* File Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white border border-[#EADFD7] p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-foreground">{fileName}</span>
                <span className="text-[11px] text-muted-foreground block">
                  {fileSizeStr} • {summary.total} rows parsed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {summary.errors > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorsCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Download Errors CSV</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Upload Different File</span>
              </button>
            </div>
          </div>

          {/* Validation Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Total Rows
              </span>
              <span className="font-heading text-2xl font-black text-foreground">
                {summary.total}
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                ✓ Ready to Import
              </span>
              <span className="font-heading text-2xl font-black text-emerald-700">
                {summary.valid}
              </span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                ⚠ Warnings
              </span>
              <span className="font-heading text-2xl font-black text-amber-700">
                {summary.warnings}
              </span>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block mb-1">
                ✕ Blocking Errors
              </span>
              <span className="font-heading text-2xl font-black text-red-700">
                {summary.errors}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                ↻ Existing Matches
              </span>
              <span className="font-heading text-2xl font-black text-blue-700">
                {summary.duplicates}
              </span>
            </div>
          </div>

          {/* Import Controls Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Duplicate Resolution & Import Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duplicate Handling Radio Buttons */}
              <div className="rounded-2xl border border-[#EADFD7] bg-[#FAF8F5] p-4 space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  When a product already exists in the database:
                </span>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="duplicateMode"
                      value="skip"
                      checked={duplicateMode === "skip"}
                      onChange={() => setDuplicateMode("skip")}
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-bold text-foreground">Skip existing products (Recommended)</span>
                      <p className="text-[11px] text-muted-foreground">Keep existing records unchanged and only create new coffee beans.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="duplicateMode"
                      value="update"
                      checked={duplicateMode === "update"}
                      onChange={() => setDuplicateMode("update")}
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-bold text-foreground">Update existing products (Upsert)</span>
                      <p className="text-[11px] text-muted-foreground">Overwrite existing matching products with newly provided spreadsheet data.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Handling and Execution Button */}
              <div className="rounded-2xl border border-[#EADFD7] bg-[#FAF8F5] p-4 flex flex-col justify-between gap-3">
                {hasBlockingErrors && (
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-foreground font-semibold">
                    <input
                      type="checkbox"
                      checked={ignoreErrorsAndImportValid}
                      onChange={(e) => setIgnoreErrorsAndImportValid(e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <span>
                      Ignore {summary.errors} error row(s) and import the {summary.valid} valid row(s).
                    </span>
                  </label>
                )}

                <div className="flex items-center gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isPending || (hasBlockingErrors && !ignoreErrorsAndImportValid) || rowsToImportCount === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Importing Coffee Beans...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        <span>Import {rowsToImportCount} Coffee Bean{rowsToImportCount !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Preview Table */}
          <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-secondary/30">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                    activeTab === "all" ? "bg-[#3C322B] text-white" : "bg-white text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({summary.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ready")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                    activeTab === "ready" ? "bg-emerald-700 text-white" : "bg-white text-emerald-800 hover:bg-emerald-50"
                  )}
                >
                  Ready ({summary.valid - summary.duplicates})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("duplicates")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                    activeTab === "duplicates" ? "bg-blue-700 text-white" : "bg-white text-blue-800 hover:bg-blue-50"
                  )}
                >
                  Duplicates ({summary.duplicates})
                </button>
                {summary.warnings > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("warnings")}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                      activeTab === "warnings" ? "bg-amber-700 text-white" : "bg-white text-amber-800 hover:bg-amber-50"
                    )}
                  >
                    Warnings ({summary.warnings})
                  </button>
                )}
                {summary.errors > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("errors")}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                      activeTab === "errors" ? "bg-red-700 text-white" : "bg-white text-red-800 hover:bg-red-50"
                    )}
                  >
                    Errors ({summary.errors})
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter preview..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full rounded-xl border border-transparent bg-white px-3 py-1.5 pl-8 text-xs font-medium text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pl-5 pr-2">Row</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Bean Name</th>
                    <th className="py-3 px-3">Roaster & Store</th>
                    <th className="py-3 px-3">Price / Bag</th>
                    <th className="py-3 px-3">Price / 100g</th>
                    <th className="py-3 px-3">Origin</th>
                    <th className="py-3 px-3">Roast & Notes</th>
                    <th className="py-3 px-3">Affiliate</th>
                    <th className="py-3 pl-3 pr-5">Validation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground font-medium">
                        No rows found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => {
                      const isError = r.status === "error"
                      const isWarning = r.status === "warning"
                      const isDuplicate = r.matchStatus === "duplicate"

                      return (
                        <tr
                          key={r.rowNumber}
                          className={cn(
                            "hover:bg-secondary/20 transition-colors",
                            isError ? "bg-red-50/30" : isDuplicate ? "bg-blue-50/20" : ""
                          )}
                        >
                          <td className="py-3 pl-5 pr-2 font-mono text-[11px] font-bold text-muted-foreground">
                            #{r.rowNumber}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            {isError ? (
                              <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-800">
                                <XCircle className="size-3" />
                                Error
                              </span>
                            ) : isDuplicate ? (
                              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                                ↻ Duplicate
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                                ⚠ Warning
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                                ✓ Ready
                              </span>
                            )}
                          </td>

                          {/* Bean Name */}
                          <td className="py-3 px-3">
                            <span className="font-heading font-bold text-foreground block max-w-[180px] truncate">
                              {r.data.name || "—"}
                            </span>
                            {r.data.externalId && (
                              <span className="font-mono text-[10px] text-muted-foreground block">
                                SKU: {r.data.externalId}
                              </span>
                            )}
                          </td>

                          {/* Roaster & Retailer */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-foreground block">
                              {r.data.roaster || "—"}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[140px]">
                              {r.data.retailerName || "—"}
                            </span>
                          </td>

                          {/* Price & Bag Size */}
                          <td className="py-3 px-3 font-semibold text-foreground">
                            £{r.data.price.toFixed(2)}
                            <span className="text-[11px] text-muted-foreground font-normal block">
                              {r.data.weight}
                            </span>
                          </td>

                          {/* Price / 100g */}
                          <td className="py-3 px-3 font-bold text-amber-800 font-mono">
                            £{r.data.pricePer100g.toFixed(2)}
                          </td>

                          {/* Origin */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-foreground block">
                              {r.data.country}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[120px]">
                              {r.data.region || r.data.process}
                            </span>
                          </td>

                          {/* Roast & Flavor Notes */}
                          <td className="py-3 px-3">
                            <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-secondary text-secondary-foreground mb-1">
                              {r.data.roast}
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {r.data.flavors.slice(0, 2).map((f) => (
                                <span key={f} className="rounded bg-secondary/70 px-1.5 py-0.5 text-[10px] font-semibold">
                                  {f}
                                </span>
                              ))}
                              {r.data.flavors.length > 2 && (
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  +{r.data.flavors.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Affiliate */}
                          <td className="py-3 px-3">
                            {r.data.affiliateUrl ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                                {r.data.affiliateNetwork || "Custom"}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium">None</span>
                            )}
                          </td>

                          {/* Validation Issues / Notes */}
                          <td className="py-3 pl-3 pr-5">
                            {r.errors.length > 0 ? (
                              <ul className="space-y-0.5 text-[11px] text-destructive font-semibold">
                                {r.errors.map((err, i) => (
                                  <li key={i}>• {err.message}</li>
                                ))}
                              </ul>
                            ) : r.warnings.length > 0 ? (
                              <ul className="space-y-0.5 text-[11px] text-amber-800 font-medium">
                                {r.warnings.map((w, i) => (
                                  <li key={i}>• {w.message}</li>
                                ))}
                              </ul>
                            ) : isDuplicate ? (
                              <span className="text-[11px] text-blue-700 font-medium">
                                Matches: "{r.existingBeanName}"
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-medium">✓ Valid</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WORKFLOW STEP 5: RESULTS SCREEN
          ========================================== */}
      {step === "results" && importResult && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Success Banner */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-extrabold text-emerald-950">
                  Batch Import Completed!
                </h2>
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  {serverMessage || `Successfully processed ${importResult.totalRows} coffee bean records.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadResultsCsv}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-2xs hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <Download className="size-4" />
                <span>Download Results CSV</span>
              </button>

              <Link
                href="/admin/coffee-beans"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span>View All Coffee Beans</span>
              </Link>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                ✓ Created (New)
              </span>
              <span className="font-heading text-3xl font-black text-emerald-700">
                {importResult.createdCount}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                ↻ Updated (Existing)
              </span>
              <span className="font-heading text-3xl font-black text-blue-700">
                {importResult.updatedCount}
              </span>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                ○ Skipped (Duplicates)
              </span>
              <span className="font-heading text-3xl font-black text-stone-700">
                {importResult.skippedCount}
              </span>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-2xs">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block mb-1">
                ✕ Failed
              </span>
              <span className="font-heading text-3xl font-black text-red-700">
                {importResult.failedCount}
              </span>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Row-by-Row Import Outcome
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                + Import Another Spreadsheet
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pl-5 pr-2">Row</th>
                    <th className="py-3 px-3">Bean Title</th>
                    <th className="py-3 px-3">Roaster</th>
                    <th className="py-3 px-3">Action Result</th>
                    <th className="py-3 pl-3 pr-5">Details / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {importResult.items.map((item) => (
                    <tr key={item.rowNumber} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3 pl-5 pr-2 font-mono text-[11px] font-bold text-muted-foreground">
                        #{item.rowNumber}
                      </td>
                      <td className="py-3 px-3 font-heading font-bold text-foreground">
                        {item.beanName}
                      </td>
                      <td className="py-3 px-3 font-medium text-muted-foreground">
                        {item.roaster}
                      </td>
                      <td className="py-3 px-3">
                        {item.action === "created" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                            ✓ Created
                          </span>
                        ) : item.action === "updated" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                            ↻ Updated
                          </span>
                        ) : item.action === "skipped" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-700">
                            ○ Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-800">
                            ✕ Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-[11px] text-muted-foreground">
                        {item.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
