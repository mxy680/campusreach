"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface CapacityDataPoint {
  eventName: string
  signups: number
  volunteersNeeded: number
}

interface CapacityUtilizationChartProps {
  data: CapacityDataPoint[]
}

export function CapacityUtilizationChart({ data }: CapacityUtilizationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chartDom = chartRef.current
    const myChart = echarts.init(chartDom, null, {
      width: chartDom.clientWidth || 400,
      height: chartDom.clientHeight || 200
    })
    chartInstanceRef.current = myChart

    const safeData = (data && Array.isArray(data)) ? data : []

    // Get only the most recent 3 events (last 3 in the array)
    const recentData = safeData.slice(-3)
    // Sort by volunteers needed (descending) for better visualization
    const sortedData = [...recentData].sort((a, b) => b.volunteersNeeded - a.volunteersNeeded)
    const eventNames = sortedData.map((d) => d.eventName)
    const signups = sortedData.map((d) => d.signups)
    const volunteersNeeded = sortedData.map((d) => d.volunteersNeeded)

    const option: EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        formatter: (params: unknown) => {
          const paramsArray = Array.isArray(params) ? params : [params]
          const firstParam = paramsArray[0] as { axisValue?: string }
          let content = `<div style="font-weight: bold; margin-bottom: 4px;">${firstParam?.axisValue || ''}</div>`
          paramsArray.forEach((param: unknown) => {
            const p = param as { seriesName?: string; value?: number; dataIndex?: number }
            const percentage = p.seriesName === "Signups" && p.value !== undefined && p.dataIndex !== undefined
              ? ((p.value / volunteersNeeded[p.dataIndex]) * 100).toFixed(0)
              : "100"
            content += `<div>${p.seriesName || ''}: <strong>${p.value || 0}</strong> (${percentage}%)</div>`
          })
          return content
        }
      },
      grid: {
        left: "22%",
        right: "4%",
        bottom: "2%", // Minimal space for x-axis labels
        top: "2%", // Minimal space at top
        containLabel: false
      },
      xAxis: {
        type: "value",
        boundaryGap: [0, 0.01],
        axisLine: {
          lineStyle: {
            color: "var(--border)"
          }
        },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: "var(--border)",
            type: "dashed"
          }
        }
      },
      yAxis: {
        type: "category",
        data: eventNames,
        axisLine: {
          lineStyle: {
            color: "var(--border)"
          }
        },
        axisLabel: {
          color: "var(--foreground)",
          fontSize: 11,
          formatter: (value: string) => {
            // Split long event names into multiple lines (max 18 chars per line for better spacing)
            const maxCharsPerLine = 18
            if (value.length <= maxCharsPerLine) {
              return value
            }
            // Split into words and wrap intelligently
            const words = value.split(" ")
            const lines: string[] = []
            let currentLine = ""
            
            words.forEach((word) => {
              const testLine = currentLine ? `${currentLine} ${word}` : word
              if (testLine.length <= maxCharsPerLine) {
                currentLine = testLine
              } else {
                if (currentLine) {
                  lines.push(currentLine)
                }
                // If a single word is longer than maxCharsPerLine, break it
                if (word.length > maxCharsPerLine) {
                  // Break long words
                  for (let i = 0; i < word.length; i += maxCharsPerLine) {
                    lines.push(word.substring(i, i + maxCharsPerLine))
                  }
                  currentLine = ""
                } else {
                  currentLine = word
                }
              }
            })
            if (currentLine) {
              lines.push(currentLine)
            }
            
            return lines.join("\n")
          },
          lineHeight: 16, // Increased line height to prevent overlapping
          margin: 8 // Add margin between labels to prevent overlap
        }
      },
      series: [
        {
          name: "Signups",
          type: "bar",
          data: signups,
          itemStyle: {
            color: "oklch(0.646 0.222 41.116)"
          }
        },
        {
          name: "Volunteers Needed",
          type: "bar",
          data: volunteersNeeded,
          itemStyle: {
            color: "oklch(0.646 0.222 41.116)",
            opacity: 0.3
          }
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

  return <div ref={chartRef} className="h-[200px] w-full" />
}

