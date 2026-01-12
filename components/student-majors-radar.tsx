"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface MajorData {
  major: string
  count: number
}

interface StudentMajorsRadarProps {
  data: MajorData[]
}

export function StudentMajorsRadar({ data }: StudentMajorsRadarProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chartDom = chartRef.current
    const myChart = echarts.init(chartDom, null, {
      width: chartDom.clientWidth || 400,
      height: chartDom.clientHeight || 280
    })
    chartInstanceRef.current = myChart

    const safeData = (data && Array.isArray(data)) ? data : []

    // Get top 5 majors
    const topMajors = [...safeData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Find max count for scaling
    const maxCount = Math.max(...topMajors.map((d) => d.count), 1)

    const option: EChartsOption = {
      title: {
        text: "Top Student Majors",
        left: "center",
        top: 5,
        textStyle: {
          color: "var(--foreground)",
          fontSize: 14,
          fontWeight: 600
        }
      },
      radar: {
        indicator: topMajors.map((major) => ({
          name: major.major,
          max: Math.ceil(maxCount * 1.2) // Add 20% padding
        })),
        center: ["50%", "55%"],
        radius: "65%",
        splitNumber: 4,
        shape: "polygon",
        splitArea: {
          show: true,
          areaStyle: {
            color: ["rgba(0, 0, 0, 0.02)", "rgba(0, 0, 0, 0.05)"]
          }
        },
        axisName: {
          color: "#000",
          fontSize: 11,
          fontWeight: 500
        },
        splitLine: {
          lineStyle: {
            color: "var(--border)"
          }
        },
        axisLine: {
          lineStyle: {
            color: "var(--border)"
          }
        }
      },
      series: [
        {
          name: "Event Signups",
          type: "radar",
          data: [
            {
              value: topMajors.map((major) => major.count),
              name: "Event Signups",
              itemStyle: {
                color: "oklch(0.646 0.222 41.116)"
              },
              areaStyle: {
                color: "oklch(0.646 0.222 41.116)",
                opacity: 0.3
              },
              lineStyle: {
                color: "oklch(0.646 0.222 41.116)",
                width: 2
              }
            }
          ]
        }
      ]
    }

    myChart.setOption(option)

    // Handle resize
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (myChart && !myChart.isDisposed() && chartRef.current) {
          myChart.resize({
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight
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
          height: chartRef.current.clientHeight
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

  return <div ref={chartRef} className="h-[280px] w-full" />
}

