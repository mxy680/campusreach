import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconBell } from "@tabler/icons-react"
import { StudentMajorsPie } from "@/components/student-majors-pie"
import { RatingsTrendChart } from "@/components/ratings-trend-chart"
import { CapacityUtilizationChart } from "@/components/capacity-utilization-chart"

export default function OrganizationDashboard() {
  // Mock data - replace with actual data fetching
  const studentMajors = [
    { major: "Computer Science", count: 45 },
    { major: "Business Administration", count: 32 },
    { major: "Biology", count: 28 },
    { major: "Psychology", count: 24 },
    { major: "Engineering", count: 19 },
  ]

  const ratingsTrend = [
    { period: "Jul", averageRating: 4.2, ratingCount: 12 },
    { period: "Aug", averageRating: 4.5, ratingCount: 18 },
    { period: "Sep", averageRating: 4.3, ratingCount: 15 },
    { period: "Oct", averageRating: 4.6, ratingCount: 22 },
    { period: "Nov", averageRating: 4.4, ratingCount: 20 },
    { period: "Dec", averageRating: 4.7, ratingCount: 25 },
  ]

  // const eventsHosted = {
  //   months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  //   data: [],
  //   period: "Jul - Dec 2025",
  // }

        const capacityUtilization = [
          { eventName: "Food Drive", signups: 22, volunteersNeeded: 25 },
          { eventName: "Park Cleanup", signups: 18, volunteersNeeded: 15 },
          { eventName: "Soup Kitchen", signups: 12, volunteersNeeded: 15 },
        ]

  const announcements = [
    {
      title: "New: Opportunities builder",
      description: "Create rich opportunities with images, required skills, and application questions. Drafts are auto-saved.",
      date: "9/28/2025",
    },
    {
      title: "Volunteer messaging launched",
      description: "Start 1:1 chats with interested volunteers from Opportunities and the Volunteers tab.",
      date: "10/1/2025",
    },
    {
      title: "Ratings dashboard",
      description: "View event ratings distribution and comments to improve your next events.",
      date: "10/2/2025",
    },
    {
      title: "CSV export",
      description: "Download monthly reports of sign-ups and logged hours from the dashboard.",
      date: "10/3/2025",
    },
    {
      title: "Maintenance window",
      description: "CampusReach will undergo scheduled maintenance on Oct 12, 1:00-1:30 AM ET. No downtime expected.",
      date: "10/5/2025",
    },
  ]

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
              <div className="flex items-center gap-2">
                <span className="font-medium">Dashboard</span>
              </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Top Row: 3 Equal Columns */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {/* Student Majors Pie Chart - 1/3 width */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Top Student Majors</CardTitle>
              <CardDescription>Majors of students who signed up for events</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-0 flex-1 flex flex-col">
              <div className="flex-1">
                <StudentMajorsPie data={studentMajors} />
              </div>
              <div className="px-6 pb-4 pt-2 mt-auto">
                <p className="text-xs text-muted-foreground italic">
                  Sample data - not enough data collected yet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ratings Trend Card - 1/3 width */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Event ratings</CardTitle>
              <CardDescription>Average rating over time</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-0 flex-1 flex flex-col">
              <div className="flex-1">
                <RatingsTrendChart data={ratingsTrend} />
              </div>
              <div className="px-6 pb-4 pt-2 mt-auto">
                <p className="text-xs text-muted-foreground italic">
                  Sample data - not enough data collected yet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Utilization Card - 1/3 width */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Event capacity</CardTitle>
              <CardDescription>Signups vs. volunteers needed</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-0 flex-1 flex flex-col">
              <div className="flex-1">
                <CapacityUtilizationChart data={capacityUtilization} />
              </div>
              <div className="px-6 pb-4 pt-2 mt-auto">
                <p className="text-xs text-muted-foreground italic">
                  Sample data - not enough data collected yet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                <CardTitle>Announcements</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">{announcements.length}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {announcements.map((announcement, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 border-b last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground">{announcement.description}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {announcement.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}
