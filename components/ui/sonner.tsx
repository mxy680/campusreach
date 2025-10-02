"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      closeButton
      expand
      duration={2500}
      gap={8}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-[var(--normal-border)] bg-[var(--normal-bg)] text-[var(--normal-text)] shadow-sm",
          title: "font-medium",
          description: "text-sm opacity-90",
          actionButton:
            "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "rounded-md border border-input bg-background text-foreground hover:bg-accent",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
