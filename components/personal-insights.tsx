// components/personal-insights.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export interface PersonalInsightsProps {
  stats: {
    totalProjects: number
    projectsThisMonth: number
    activeMinutesThisMonth: number
    dailyAverageMinutes?: number
    memberSince: string // e.g. "Jan 2024"
    currentStreakDays?: number
  }
}

export function PersonalInsights({ stats }: PersonalInsightsProps) {
  const daysInMonth = 30 // you can make this dynamic later
  const targetProjectsThisMonth = 10 // arbitrary target to show progress
  const projectProgress = Math.min(
    (stats.projectsThisMonth / targetProjectsThisMonth) * 100,
    100
  )

  return (
    <Card className="sticky top-24 hidden lg:block">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide">
          Your Activity Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Overview of your activity on POST_up
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              Total Projects
            </p>
            <p className="mt-1 text-lg font-semibold">
              {stats.totalProjects}
            </p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              This Month
            </p>
            <p className="mt-1 text-lg font-semibold">
              {stats.projectsThisMonth}
            </p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              Active Time (min)
            </p>
            <p className="mt-1 text-lg font-semibold">
              {stats.activeMinutesThisMonth}
            </p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              Avg / day
            </p>
            <p className="mt-1 text-lg font-semibold">
              {stats.dailyAverageMinutes ?? Math.round(stats.activeMinutesThisMonth / daysInMonth)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Project upload progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Monthly upload progress</span>
            <span className="text-muted-foreground">
              {stats.projectsThisMonth}/{targetProjectsThisMonth}
            </span>
          </div>
          <Progress value={projectProgress} />
          <p className="text-[11px] text-muted-foreground">
            Set a goal for how many projects you want to post each month.
          </p>
        </div>

        {/* Meta info */}
        <Separator />

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{stats.memberSince}</span>
          </div>

          {typeof stats.currentStreakDays === "number" && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current streak</span>
              <span className="font-medium">
                {stats.currentStreakDays} day{stats.currentStreakDays === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
