"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A single-series bar chart"

type ChartBarSingleProps = {
  title: string
  description?: string
  data: Array<Record<string, string | number>>
  dataKey: string
  label: string
  colorVar?: string // e.g. var(--chart-1)
  xKey?: string
  xTickFormatter?: (value: string | number) => string
  footerPrimary?: React.ReactNode
  footerSecondary?: React.ReactNode
  cardClassName?: string
  chartClassName?: string
}

export function ChartBarSingle({
  title,
  description,
  data,
  dataKey,
  label,
  colorVar = "var(--chart-2)",
  xKey = "month",
  xTickFormatter = (v: string | number) => (typeof v === "string" ? v.slice(0, 3) : String(v)),
  footerPrimary,
  footerSecondary,
  cardClassName,
  chartClassName,
}: ChartBarSingleProps) {
  const chartConfig = {
    [dataKey]: {
      label,
      color: colorVar,
    },
  } satisfies ChartConfig

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={`h-28 ${chartClassName ?? ""}`}>
          <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={xTickFormatter}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(footerPrimary || footerSecondary) && (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              {footerPrimary && (
                <div className="flex items-center gap-2 leading-none font-medium">
                  {footerPrimary}
                </div>
              )}
              <div className="text-muted-foreground flex items-center gap-2 leading-none">
                {footerSecondary}
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
