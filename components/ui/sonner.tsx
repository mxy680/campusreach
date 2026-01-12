"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      closeButton
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <XCircleIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:backdrop-blur-sm relative overflow-hidden",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          error:
            "group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border toast-error-progress",
          success:
            "group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border",
          warning:
            "group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border",
          info: "group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border",
        },
        style: {
          borderRadius: "var(--radius)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
