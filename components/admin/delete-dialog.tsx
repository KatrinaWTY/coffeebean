"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle, Trash2, X, Loader2, Coffee } from "lucide-react"
import { Bean } from "@/lib/types"

interface DeleteDialogProps {
  bean: Bean | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (bean: Bean) => Promise<void>
}

export function DeleteDialog({
  bean,
  isOpen,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!isOpen || !bean) return null

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onConfirm(bean)
      onClose()
    } catch (err) {
      console.error("Error confirming delete:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">
              Delete Coffee Bean?
            </h3>
            <p className="text-xs text-muted-foreground">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Bean Summary Card */}
        <div className="my-4 flex items-center gap-3.5 rounded-2xl border border-border bg-secondary/50 p-3.5">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted/60 border border-border flex items-center justify-center">
            {bean.image && !imgError ? (
              <Image
                src={bean.image}
                alt={bean.name}
                fill
                sizes="56px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Coffee className="size-6 text-muted-foreground/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading text-sm font-bold text-foreground truncate">
              {bean.name}
            </h4>
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {bean.roaster} • {bean.country}
            </p>
            <p className="text-xs font-bold text-primary mt-0.5">
              £{bean.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-destructive/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>Delete Bean</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
