"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface HoursDataPoint {
  month: string
  hours: number
}

interface HoursLoggedChartProps {
  data?: HoursDataPoint[]
}

export function HoursLoggedChart({ data = [] }: HoursLoggedChartProps) {
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
    const hours = safeData.map((d) => d.hours) || []

    // Ensure arrays are never undefined
    if (!Array.isArray(months) || !Array.isArray(hours)) {
      myChart.dispose()
      return
    }

    const option: EChartsOption = {
      animation: safeData.length > 0 && safeData.length > 1,
      animationDuration: 750,
      animationEasing: 'cubicOut',
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
            <div>Hours: <strong>${point.value || 0}</strong></div>
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
          name: "Hours",
          type: "line",
          data: hours.length > 0 ? hours : [0],
          smooth: true,
          animation: false, // Disable animation to prevent interpolation errors
          itemStyle: {
            color: "rgba(255, 152, 0, 1)", // Convert oklch to rgba for consistency
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(255, 152, 0, 1)", // Convert oklch to rgba
                },
                {
                  offset: 1,
                  color: "rgba(255, 152, 0, 0.1)", // Use rgba instead of oklch with opacity
                },
              ],
            },
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

