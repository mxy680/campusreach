"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface EventRatingsChartProps {
  data: Array<{ value: number; name: string }>
  average: number
}

export function EventRatingsChart({ data, average }: EventRatingsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize chart
    const chartDom = chartRef.current
    const myChart = echarts.init(chartDom)
    chartInstanceRef.current = myChart

    const option: EChartsOption = {
      tooltip: {
        trigger: "item",
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: "Event Ratings",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "center",
            formatter: () => {
              return `Avg: ${average.toFixed(1)}`
            },
            fontSize: 16,
            fontWeight: "bold",
            color: "var(--foreground)",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: data.length > 0 ? data : [{ value: 1, name: "No ratings", itemStyle: { color: "var(--muted)" } }],
        },
      ],
    }

    myChart.setOption(option)

    // Handle resize
    const handleResize = () => {
      myChart.resize()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      myChart.dispose()
    }
  }, [data, average])

  return <div ref={chartRef} className="h-64 w-full" />
}

