"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface RatingDataPoint {
  period: string
  averageRating: number
  ratingCount: number
}

interface RatingsTrendChartProps {
  data: RatingDataPoint[]
}

export function RatingsTrendChart({ data }: RatingsTrendChartProps) {
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

    const periods = safeData.map((d) => d.period)
    const ratings = safeData.map((d) => d.averageRating)
    const counts = safeData.map((d) => d.ratingCount)

    const option: EChartsOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params
          const dataIndex = param.dataIndex
          const rating = ratings[dataIndex]
          const count = counts[dataIndex]
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${param.axisValue}</div>
            <div>Average Rating: <strong>${rating.toFixed(1)}</strong> / 5.0</div>
            <div>Number of Ratings: ${count}</div>
          `
        }
      },
      grid: {
        left: "8%",
        right: "4%",
        bottom: "2%", // Minimal space for x-axis label
        top: "2%", // Minimal space at top
        containLabel: false
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: periods,
        name: "Month",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: "var(--foreground)",
          fontSize: 12,
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: "var(--border)"
          }
        },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11
        }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 5,
        interval: 1,
        name: "Average Rating",
        nameLocation: "middle",
        nameGap: 30, // Reduced gap between label and ticks
        nameRotate: 90,
        nameTextStyle: {
          color: "var(--foreground)",
          fontSize: 12,
          fontWeight: 500
        },
        axisLine: {
          lineStyle: {
            color: "var(--border)"
          }
        },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11,
          formatter: (value: number) => value.toFixed(0)
        },
        splitLine: {
          lineStyle: {
            color: "var(--border)",
            type: "dashed"
          }
        }
      },
      series: [
        {
          name: "Average Rating",
          type: "line",
          data: ratings,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            color: "rgba(255, 152, 0, 1)", // Convert oklch to rgba
            width: 2
          },
          itemStyle: {
            color: "rgba(255, 152, 0, 1)" // Convert oklch to rgba
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
                  color: "rgba(255, 152, 0, 1)" // Convert oklch to rgba
                },
                {
                  offset: 1,
                  color: "rgba(255, 152, 0, 0.1)" // Use rgba instead of oklch with opacity
                }
              ]
            }
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              borderWidth: 2,
              borderColor: "#fff"
            }
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

