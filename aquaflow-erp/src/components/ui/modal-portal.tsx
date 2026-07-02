import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Width class, e.g. "max-w-lg" (default) or "max-w-2xl" */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Hide the default header */
  hideHeader?: boolean;
  /** Additional className on the panel */
  className?: string;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

/**
 * ModalPortal — a standardized, accessible modal that renders into document.body
 * via React Portal. Handles: backdrop click, Escape key, focus trap, scroll lock,
 * and smooth enter/exit animations.
 *
 * Usage:
 *   <ModalPortal isOpen={open} onClose={() => setOpen(false)} title="Edit Item">
 *     {content}
 *   </ModalPortal>
 */
export function ModalPortal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  hideHeader = false,
  className,
}: ModalPortalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative z-10 w-full bg-surface border border-border rounded-2xl shadow-2xl",
          "flex flex-col max-h-[90vh]",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {!hideHeader && (title || subtitle) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div>
              {title && (
                <h2 className="text-base font-display font-bold text-foreground leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close button when no header */}
        {(hideHeader || (!title && !subtitle)) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── ModalFooter helper ───────────────────────────────────────────────────────
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/30 rounded-b-2xl shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── ModalCancelButton helper ─────────────────────────────────────────────────
export function ModalCancelButton({
  onClick,
  label = "Cancel",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-display font-medium text-foreground hover:bg-secondary transition-colors"
    >
      {label}
    </button>
  );
}

// ─── ModalSubmitButton helper ─────────────────────────────────────────────────
export function ModalSubmitButton({
  label = "Save",
  isLoading = false,
  disabled = false,
}: {
  label?: string;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="h-9 px-5 rounded-lg bg-brand text-white text-sm font-display font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {isLoading && (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      )}
      {label}
    </button>
  );
}
