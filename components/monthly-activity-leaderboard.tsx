// components/monthly-activity-leaderboard.tsx
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export type Trend = "up" | "down" | "same"

export interface LeaderboardUser {
  id: string | number
  name: string
  username: string
  avatar?: string
  projectsThisMonth: number
  rank: number
  trend?: Trend
}

interface MonthlyActivityLeaderboardProps {
  users: LeaderboardUser[]
}

function TrendIcon({ trend }: { trend?: Trend }) {
  if (trend === "up") {
    return <ArrowUpRight className="h-3 w-3 text-emerald-500" />
  }
  if (trend === "down") {
    return <ArrowDownRight className="h-3 w-3 text-red-500" />
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export function MonthlyActivityLeaderboard({ users }: MonthlyActivityLeaderboardProps) {
  const sortedUsers = [...users].sort((a, b) => a.rank - b.rank)

  return (
    <Card className="sticky top-24 hidden xl:block">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-wide">
          Monthly High Activity
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ranked by number of projects posted this month
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="max-h-[420px]">
          <div className="divide-y">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 py-3"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  #{user.rank}
                </div>

                {/* Avatar & info */}
                <div className="flex flex-1 items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback>
                      {(user.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium leading-tight">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.username}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <span>{user.projectsThisMonth}</span>
                      <span className="text-muted-foreground">projects</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <TrendIcon trend={user.trend} />
                      <span>
                        {user.trend === "up"
                          ? "Rising"
                          : user.trend === "down"
                          ? "Dropping"
                          : "Stable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {sortedUsers.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No activity yet this month. Start posting projects to appear here.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
