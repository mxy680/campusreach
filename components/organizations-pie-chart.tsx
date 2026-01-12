"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface OrganizationData {
  name: string
  count: number
  percentage: number
}

interface OrganizationsPieChartProps {
  data?: OrganizationData[]
}

export function OrganizationsPieChart({ data = [] }: OrganizationsPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chartDom = chartRef.current
    const myChart = echarts.init(chartDom, null, {
      width: chartDom.clientWidth || 400,
      height: chartDom.clientHeight || 200,
    })
    chartInstanceRef.current = myChart

    const safeData = (data && Array.isArray(data)) ? data : []

    // If no data, show "None" with 0%
    const pieData = safeData.length > 0
      ? safeData.map((org) => ({
          value: org.count || 0,
          name: org.name || "",
        }))
      : [{ value: 1, name: "None" }]

    // Ensure pieData is always an array
    if (!Array.isArray(pieData) || pieData.length === 0) {
      myChart.dispose()
      return
    }

    const option: EChartsOption = {
      animation: false, // Disable animation to prevent interpolation errors
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          if (!params) return ""
          const p = params as { name?: string; value?: number }
          if (p.name === "None") {
            return `
              <div style="font-weight: bold; margin-bottom: 4px;">${p.name}</div>
              <div>0%</div>
            `
          }
          // Ensure safeData is available in closure
          const dataArray = Array.isArray(safeData) ? safeData : []
          const org = dataArray.find((o) => o.name === p.name)
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${p.name || ''}</div>
            <div>Shifts: <strong>${org?.count || 0}</strong></div>
            <div>Percentage: <strong>${org?.percentage || 0}%</strong></div>
          `
        },
      },
      series: [
        {
          name: "Organizations",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          animation: false, // Disable animation to prevent interpolation errors
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
            color: (params: unknown) => {
              if (!params) return "oklch(0.646 0.222 41.116)"
              const p = params as { name?: string }
              if (p.name === "None") {
                return "oklch(0.646 0.222 41.116)"
              }
              // Use different shades of orange for different organizations
              const dataArray = Array.isArray(safeData) ? safeData : []
              const index = dataArray.findIndex((o) => o.name === p.name)
              const shades = [
                "oklch(0.646 0.222 41.116)",
                "oklch(0.600 0.222 41.116)",
                "oklch(0.700 0.222 41.116)",
                "oklch(0.550 0.222 41.116)",
                "oklch(0.750 0.222 41.116)",
              ]
              return shades[index >= 0 ? index % shades.length : 0]
            },
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: false,
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    }

    // Clear any existing animation before setting new option
    myChart.clear()
    myChart.setOption(option, { notMerge: true, lazyUpdate: false })

    // Handle resize
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (myChart && !myChart.isDisposed() && chartRef.current) {
          myChart.resize({
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
          })
        }
      }, 100)
    }
    window.addEventListener("resize", handleResize)

    // Force initial resize
    setTimeout(() => {
      if (myChart && !myChart.isDisposed() && chartRef.current) {
        myChart.resize({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        })
      }
    }, 100)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", handleResize)
      if (myChart && !myChart.isDisposed()) {
        myChart.dispose()
      }
    }
  }, [data])

  return <div ref={chartRef} className="h-[200px] w-full" />
}

