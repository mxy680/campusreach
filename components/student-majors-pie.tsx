"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface MajorData {
  major: string
  count: number
}

interface StudentMajorsPieProps {
  data: MajorData[]
}

export function StudentMajorsPie({ data }: StudentMajorsPieProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chartDom = chartRef.current
    // Reduce height by 20% to account for bottom crop
    const containerHeight = chartDom.clientHeight || 280
    const actualHeight = containerHeight * 0.8 // 80% of original (crop bottom 20%)
    const myChart = echarts.init(chartDom, null, {
      width: chartDom.clientWidth || 400,
      height: actualHeight
    })
    chartInstanceRef.current = myChart

    const safeData = (data && Array.isArray(data)) ? data : []

    // Get top 5 majors
    const topMajors = [...safeData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Make all sections equal size (same value for each)
    const equalValue = 1
    // Different shades of orange for each major
    const orangeShades = [
      "oklch(0.646 0.222 41.116)",      // Base orange
      "oklch(0.600 0.222 41.116)",      // Slightly darker
      "oklch(0.700 0.222 41.116)",      // Slightly lighter
      "oklch(0.550 0.222 41.116)",      // Darker
      "oklch(0.750 0.222 41.116)",      // Lighter
    ]
    const pieData = topMajors.map((major, index) => ({
      value: equalValue,
      name: major.major,
      itemStyle: {
        color: orangeShades[index % orangeShades.length]
      }
    }))

    const option: EChartsOption = {
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as { name?: string; value?: number }
          const major = topMajors.find((m) => m.major === p.name)
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${p.name || ''}</div>
            <div>Signups: <strong>${major?.count || 0}</strong></div>
          `
        }
      },
      series: [
        {
          name: "Student Majors",
          type: "pie",
          radius: ["30%", "55%"],
          center: ["50%", "40%"], // Moved up to remove space above
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: (params: unknown) => {
              // Split long names into multiple lines (max 15 chars per line)
              const p = params as { name?: string }
              const name = p.name || ""
              const maxCharsPerLine = 15
              if (name.length <= maxCharsPerLine) {
                return name
              }
              // Split into words and wrap intelligently
              const words = name.split(" ")
              const lines: string[] = []
              let currentLine = ""
              
              words.forEach((word: string) => {
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
            color: "#000",
            fontSize: 11,
            lineHeight: 13
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold"
            }
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 5
          },
          data: pieData
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

  return <div ref={chartRef} className="h-[224px] w-full" />
}

