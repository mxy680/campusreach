"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <div className={cn("space-y-3", className)} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const props = child.props as Record<string, unknown> | null
          if (props && typeof props === 'object' && 'value' in props) {
            return React.cloneElement(child, {
              ...(props as Record<string, unknown>),
              checked: props.value === value,
              onCheckedChange: () => onValueChange?.(String(props.value || '')),
            } as React.ComponentPropsWithoutRef<typeof RadioGroupItem>)
          }
        }
        return child
      })}
    </div>
  )
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  label: string
  checked?: boolean
  onCheckedChange?: () => void
}

function RadioGroupItem({
  value,
  label,
  checked,
  onCheckedChange,
  className,
  ...props
}: RadioGroupItemProps) {
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer", className)}>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={() => onCheckedChange?.()}
        className="h-4 w-4 cursor-pointer accent-primary"
        {...props}
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem }

