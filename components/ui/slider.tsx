"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 50,
  step = 1,
  unit = "miles",
  ...props
}: SliderProps) {
  const [internalValue, setInternalValue] = React.useState(value ?? min)

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary",
          className
        )}
        {...props}
      />
      <span className="text-sm font-medium min-w-[3rem] text-right">
        {internalValue} {unit}
      </span>
    </div>
  )
}

export { Slider }

