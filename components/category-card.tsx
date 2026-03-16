"use client"

import type React from "react"

import Link from "next/link"
import { Globe, Brain, BarChart3, Smartphone, Shield, LinkIcon } from "lucide-react"

interface CategoryCardProps {
  title: string
  count: number
  href: string
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

export function CategoryCard({ title, count, href }: CategoryCardProps) {
  // Simple icon and color mapping based on title
  const getIconAndColor = (title: string) => {
    if (title.includes('Web')) return { Icon: Globe, color: '#3b82f6' };
    if (title.includes('AI')) return { Icon: Brain, color: '#a855f7' };
    if (title.includes('Data')) return { Icon: BarChart3, color: '#22c55e' };
    if (title.includes('Mobile')) return { Icon: Smartphone, color: '#f97316' };
    if (title.includes('Cyber')) return { Icon: Shield, color: '#ef4444' };
    if (title.includes('Blockchain')) return { Icon: LinkIcon, color: '#6366f1' };
    return { Icon: Globe, color: '#3b82f6' }; // fallback
  };

  const { Icon, color } = getIconAndColor(title);

  return (
    <Link href={href}>
      <div
        className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50"
        style={{
          boxShadow: `0 0 0 0 ${color}20`,
        }}
      >
        {/* Animated background on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{ backgroundColor: color }}
        />

        {/* Icon container with animation */}
        <div className="relative flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-10 h-10 transition-colors duration-300" style={{ color }} />
          </div>

          {/* Category name */}
          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-300 text-center">
            {title}
          </h3>

          {/* Project count */}
          <p className="text-sm text-muted-foreground text-center">
            {count} {count === 1 ? 'project' : 'projects'}
          </p>
        </div>

        {/* Animated border effect */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-opacity-30 transition-colors duration-300"
          style={{ borderColor: `${color}00` }}
        />
      </div>
    </Link>
  )
}
