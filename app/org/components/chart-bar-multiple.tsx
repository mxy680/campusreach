"use client"

import { TrendingUp } from "lucide-react"
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

export type PlatformBarDatum = { month: string; students: number; orgs: number }

export function ChartBarMultiple({
  title = "Platform Signups",
  description,
  data,
  footerPrimary,
  footerSecondary,
}: {
  title?: string
  description?: string
  data: PlatformBarDatum[]
  footerPrimary?: React.ReactNode
  footerSecondary?: React.ReactNode
}) {
  const chartConfig = {
    students: {
      label: "Students",
      color: "var(--chart-1)",
    },
    orgs: {
      label: "Organizations",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-28">
          <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              interval={0}
              minTickGap={0}
              tickFormatter={(value: string) => value.slice(0, 3)}
              scale="band"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="students" fill="var(--color-students)" radius={4} />
            <Bar dataKey="orgs" fill="var(--color-orgs)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(footerPrimary || footerSecondary) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {footerPrimary ?? (
              <>
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground leading-none">
            {footerSecondary ?? "Showing total signups for the last 6 months"}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
