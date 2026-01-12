"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface EventsDataPoint {
  month: string
  count: number
}

interface EventsJoinedChartProps {
  data?: EventsDataPoint[]
}

export function EventsJoinedChart({ data = [] }: EventsJoinedChartProps) {
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

    const months = safeData.map((d) => d.month) || []
    const counts = safeData.map((d) => d.count) || []

    // Ensure arrays are never undefined
    if (!Array.isArray(months) || !Array.isArray(counts)) {
      myChart.dispose()
      return
    }

    const option: EChartsOption = {
      animation: false, // Disable animation to prevent interpolation errors
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          if (!params) return ""
          const paramsArray = Array.isArray(params) ? params : [params]
          if (paramsArray.length === 0) return ""
          const point = paramsArray[0] as { name?: string; value?: number } | null
          if (!point) return ""
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${point.name || ""}</div>
            <div>Events: <strong>${point.value || 0}</strong></div>
          `
        },
      },
      grid: {
        left: "8%",
        right: "4%",
        bottom: "15%",
        top: "5%",
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: months,
        axisLine: {
          lineStyle: {
            color: "var(--border)",
          },
        },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          lineStyle: {
            color: "var(--border)",
          },
        },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: "var(--border)",
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "Events",
          type: "bar",
          data: counts.length > 0 ? counts : [0],
          animation: false, // Disable animation to prevent interpolation errors
          itemStyle: {
            color: "oklch(0.646 0.222 41.116)",
            borderRadius: [4, 4, 0, 0],
          },
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

