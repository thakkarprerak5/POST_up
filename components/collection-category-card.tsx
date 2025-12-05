"use client"

import type React from "react"
import { Globe, Brain, BarChart3, Smartphone, Shield, LinkIcon } from "lucide-react"

interface CollectionCategoryCardProps {
  category: {
    name: string
    slug: string
    icon: string
    color: string
    projectCount: number
  }
  onClick: () => void
}

const iconMap: Record<string, React.ElementType> = {
  web: Globe,
  ai: Brain,
  data: BarChart3,
  mobile: Smartphone,
  cyber: Shield,
  blockchain: LinkIcon,
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  indigo: "#6366f1",
}

export function CollectionCategoryCard({ category, onClick }: CollectionCategoryCardProps) {
  const Icon = iconMap[category.icon]
  const accentColor = colorMap[category.color] || colorMap.blue

  return (
    <button onClick={onClick} className="w-full text-left">
      <div
        className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50"
        style={{
          boxShadow: `0 0 0 0 ${accentColor}20`,
        }}
      >
        {/* Animated background on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{ backgroundColor: accentColor }}
        />

        {/* Icon container with animation */}
        <div className="relative flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Icon className="w-10 h-10 transition-colors duration-300" style={{ color: accentColor }} />
          </div>

          {/* Category name */}
          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-300 text-center">
            {category.name}
          </h3>

          {/* Project count badge */}
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {category.projectCount} {category.projectCount === 1 ? "Project" : "Projects"}
          </div>
        </div>
      </div>
    </button>
  )
}
