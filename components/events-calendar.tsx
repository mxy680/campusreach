"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"
import type { EChartsOption } from "echarts"

interface Event {
  id: string
  startsAt: Date | string
  title: string
}

interface EventsCalendarProps {
  events: Event[]
}

const pastEventColor = "oklch(0.646 0.222 41.116)" // Orange for past events
const futureEventColor = "oklch(0.646 0.222 41.116)" // Orange for future events

export function EventsCalendar({ events }: EventsCalendarProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chartDom = chartRef.current
    // Force minimum width to ensure horizontal layout
    const minWidth = Math.max(chartDom.clientWidth || 800, 600)
    const myChart = echarts.init(chartDom, null, {
      width: minWidth,
      height: chartDom.clientHeight || 280
    })
    chartInstanceRef.current = myChart

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Group events by date and create graph data
    const safeEvents = (events && Array.isArray(events)) ? events : []
    
    // Create graph data: [date, value] where value indicates event type
    const graphData: Array<[string, number]> = []
    const eventsByDate: Record<string, { past: number; future: number }> = {}
    
    safeEvents.forEach((event) => {
      const eventDate = new Date(event.startsAt)
      const dateKey = echarts.format.formatTime("yyyy-MM-dd", eventDate)
      const isPast = eventDate < now
      
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = { past: 0, future: 0 }
      }
      
      if (isPast) {
        eventsByDate[dateKey].past++
      } else {
        eventsByDate[dateKey].future++
      }
    })

    // Convert to graph data format
    Object.entries(eventsByDate).forEach(([date, counts]) => {
      // Use value to indicate event type: 1 = past, 2 = future, 3 = both
      const value = (counts.past > 0 ? 1 : 0) + (counts.future > 0 ? 2 : 0)
      if (value > 0) {
        graphData.push([date, value])
      }
    })

    // Create links between consecutive events
    const links = graphData.map((_, idx) => {
      if (idx < graphData.length - 1) {
        return {
          source: idx,
          target: idx + 1
        }
      }
      return null
    }).filter((link): link is { source: number; target: number } => link !== null)

    const option: EChartsOption = {
      legend: {
        data: ["Past Events", "Upcoming Events"],
        bottom: 5,
        left: "center",
        textStyle: {
          color: "var(--foreground)",
          fontSize: 11
        },
        itemGap: 25,
        itemWidth: 10,
        itemHeight: 10
      },
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { dataType?: string; data?: unknown[]; value?: number }
          if (p.dataType === "node") {
            const date = Array.isArray(p.data) ? String(p.data[0]) : ""
            const eventInfo = eventsByDate[date]
            let content = `<div style="font-weight: bold; margin-bottom: 4px;">${date}</div>`
            if (eventInfo) {
              if (eventInfo.past > 0) {
                content += `<div>Past events: ${eventInfo.past}</div>`
              }
              if (eventInfo.future > 0) {
                content += `<div>Future events: ${eventInfo.future}</div>`
              }
            }
            return content
          }
          return ""
        }
      },
      calendar: [
        {
          left: "center",
          top: 40,
          cellSize: [40, 40],
          yearLabel: { show: false },
          orient: "horizontal",
          dayLabel: {
            firstDay: 1,
            nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            fontSize: 12,
            margin: 5
          },
          monthLabel: {
            show: true,
            position: "start",
            fontSize: 13,
            margin: 10
          },
          range: `${currentYear}-${String(currentMonth).padStart(2, "0")}`
        }
      ],
      series: [
        {
          type: "graph",
          edgeSymbol: ["none", "none"],
          coordinateSystem: "calendar",
          links: links,
          symbolSize: 12,
          calendarIndex: 0,
          itemStyle: {
            color: (params: unknown) => {
              const p = params as { data?: unknown[] }
              const value = Array.isArray(p.data) && p.data[1] !== undefined ? Number(p.data[1]) : undefined
              // 1 = past only, 2 = future only, 3 = both
              if (value === 1) {
                return pastEventColor
              } else if (value === 2) {
                return futureEventColor
              } else {
                return pastEventColor // Default to past color if both
              }
            },
            shadowBlur: 5,
            shadowOffsetX: 1,
            shadowOffsetY: 2,
            shadowColor: "rgba(0, 0, 0, 0.2)"
          },
          lineStyle: {
            color: pastEventColor,
            width: 2,
            opacity: 0.6
          },
          data: graphData,
          z: 20
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
  }, [events])

  return (
    <div className="w-full overflow-hidden" style={{ maxWidth: "100%", minWidth: "600px" }}>
      <div ref={chartRef} className="h-[280px] w-full" style={{ minHeight: 0, minWidth: "600px" }} />
    </div>
  )
}
