"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

// Filter tags organized by category
const filterTags = {
  field: [
    { id: "web-dev", label: "Web Development" },
    { id: "ai-ml", label: "AI/ML" },
    { id: "data-analysis", label: "Data Analysis" },
    { id: "mobile-app", label: "Mobile App" },
    { id: "cyber-security", label: "Cyber Security" },
    { id: "blockchain", label: "Blockchain" },
  ],
  frontend: [
    { id: "react", label: "React" },
    { id: "nextjs", label: "Next.js" },
    { id: "vue", label: "Vue.js" },
    { id: "angular", label: "Angular" },
    { id: "tailwind", label: "Tailwind CSS" },
    { id: "typescript", label: "TypeScript" },
  ],
  backend: [
    { id: "nodejs", label: "Node.js" },
    { id: "python", label: "Python" },
    { id: "java", label: "Java" },
    { id: "golang", label: "Go" },
    { id: "rust", label: "Rust" },
    { id: "django", label: "Django" },
  ],
  database: [
    { id: "mongodb", label: "MongoDB" },
    { id: "postgresql", label: "PostgreSQL" },
    { id: "mysql", label: "MySQL" },
    { id: "firebase", label: "Firebase" },
    { id: "redis", label: "Redis" },
  ],
  tools: [
    { id: "docker", label: "Docker" },
    { id: "kubernetes", label: "Kubernetes" },
    { id: "aws", label: "AWS" },
    { id: "git", label: "Git" },
    { id: "figma", label: "Figma" },
  ],
}

type FilterCategory = keyof typeof filterTags

interface FilterDropdownProps {
  onClose: () => void
  onApplyFilters: (filters: string[]) => void
  activeFilters: string[]
}

export function FilterDropdown({ onClose, onApplyFilters, activeFilters }: FilterDropdownProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(activeFilters)
  const [expandedCategory, setExpandedCategory] = useState<FilterCategory | null>("field")

  const categoryLabels: Record<FilterCategory, string> = {
    field: "Field / Category",
    frontend: "Frontend",
    backend: "Backend",
    database: "Database",
    tools: "Tools & DevOps",
  }

  const handleToggleFilter = (tagId: string) => {
    setSelectedFilters((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleClearAll = () => {
    setSelectedFilters([])
  }

  const handleApply = () => {
    onApplyFilters(selectedFilters)
    onClose()
  }

  const getTagLabel = (tagId: string): string => {
    for (const category of Object.values(filterTags)) {
      const tag = category.find((t) => t.id === tagId)
      if (tag) return tag.label
    }
    return tagId
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Filter by Tags</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected filters */}
      {selectedFilters.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Selected ({selectedFilters.length})</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleClearAll}>
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFilters.map((filterId) => (
              <Badge
                key={filterId}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => handleToggleFilter(filterId)}
              >
                {getTagLabel(filterId)}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter categories */}
      <div className="max-h-72 overflow-y-auto">
        {(Object.keys(filterTags) as FilterCategory[]).map((category) => (
          <div key={category} className="border-b border-border last:border-b-0">
            <button
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <span className="text-sm font-medium text-foreground">{categoryLabels[category]}</span>
              <span className="text-xs text-muted-foreground">
                {filterTags[category].filter((t) => selectedFilters.includes(t.id)).length > 0 && (
                  <Badge variant="default" className="text-xs h-5 px-1.5">
                    {filterTags[category].filter((t) => selectedFilters.includes(t.id)).length}
                  </Badge>
                )}
              </span>
            </button>

            {expandedCategory === category && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {filterTags[category].map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedFilters.includes(tag.id)}
                      onCheckedChange={() => handleToggleFilter(tag.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-foreground">{tag.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 p-3 border-t border-border bg-muted/30">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleApply}>
          <Check className="h-4 w-4 mr-1" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
