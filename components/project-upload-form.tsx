"use client"

import type React from "react"
import { useState } from "react"
import { Upload, X, Github, ExternalLink, Plus, ImageIcon, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Available tags organized by category
const availableTags = {
  category: ["Web Development", "AI/ML", "Data Analysis", "Mobile App", "Cyber Security", "Blockchain"],
  frontend: ["React", "Next.js", "Vue", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "TypeScript"],
  backend: ["Node.js", "Python", "Java", "Go", "Rust", "PHP", "Ruby", "C#"],
  database: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Firebase", "Supabase"],
  tools: ["Docker", "Kubernetes", "AWS", "Vercel", "Git", "GraphQL"],
}

interface ProjectFormData {
  title: string
  description: string
  githubLink: string
  liveLink: string
  images: File[]
  video: File | null
  tags: string[]
}

interface ProjectUploadFormProps {
  isEdit?: boolean
  initialData?: any
  onSuccess?: () => void
}

export function ProjectUploadForm({ isEdit = false, initialData, onSuccess }: ProjectUploadFormProps = {}) {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    githubLink: initialData?.githubUrl || "",
    liveLink: initialData?.liveUrl || "",
    images: [],
    video: null,
    tags: initialData?.tags || [],
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.images || [])
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customTag, setCustomTag] = useState("")

  // --------------------------
  // IMAGE UPLOAD
  // --------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 5) {
      alert("Maximum 5 images allowed")
      return
    }

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }))

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // --------------------------
  // VIDEO UPLOAD
  // --------------------------
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ["video/mp4", "video/webm", "video/quicktime"]
    if (!allowed.includes(file.type)) {
      alert("Only MP4, WEBM, or MOV videos allowed")
      return
    }

    setFormData((prev) => ({ ...prev, video: file }))

    const reader = new FileReader()
    reader.onloadend = () => setVideoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeVideo = () => {
    setFormData((prev) => ({ ...prev, video: null }))
    setVideoPreview(null)
  }

  // --------------------------
  // TAGS
  // --------------------------
  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const addCustomTag = () => {
    const newTag = customTag.trim()
    if (!newTag) return
    if (formData.tags.includes(newTag)) return alert("Tag already selected")

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }))
    setCustomTag("")
  }

  // --------------------------
  // SUBMIT
  // --------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description)
      fd.append('githubUrl', formData.githubLink)
      fd.append('liveUrl', formData.liveLink)
      fd.append('tags', formData.tags.join(','))
      formData.images.forEach((img) => fd.append('images', img))

      const url = isEdit ? `/api/projects/${initialData._id || initialData.id}` : '/api/projects'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to ${isEdit ? 'update' : 'upload'} project`)
      }

      const successMessage = isEdit ? 'Project updated successfully!' : 'Project uploaded successfully!'
      alert(successMessage)
      
      if (isEdit && onSuccess) {
        onSuccess()
      } else if (!isEdit) {
        // Reset form for new uploads
        setFormData({
          title: "",
          description: "",
          githubLink: "",
          liveLink: "",
          images: [],
          video: null,
          tags: [],
        })
        setImagePreviews([])
        setVideoPreview(null)
      }
    } catch (err) {
      alert((err as Error).message)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT COLUMN */}
      <div className="flex-1 space-y-6">

        {/* TITLE */}
        <div className="space-y-2">
          <Label>Project Title</Label>
          <Input
            placeholder="Enter your project title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-muted border-border h-12"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe your project..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-muted border-border min-h-[150px] resize-none"
            required
          />
        </div>

        {/* IMAGES */}
        <div className="space-y-2">
          <Label>Upload Images</Label>

          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50">
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-background">
                    <img src={preview} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 5 && (
                  <label className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Add more</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="font-medium">Click to upload images</span>
                <span className="text-sm text-muted-foreground">PNG, JPG — max 5 images</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* ⭐ NEW — VIDEO UPLOAD */}
        <div className="space-y-2">
          <Label>Upload Video (optional)</Label>

          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50">
            {videoPreview ? (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video src={videoPreview} controls className="w-full h-full" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-background/80 p-2 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="font-medium">Click to upload video</span>
                <span className="text-sm text-muted-foreground">MP4, WEBM, MOV (1 video)</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* LINKS */}
        <div className="space-y-4">
          <Label>Project Links</Label>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 py-2.5">
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </div>
            <Input
              placeholder="https://github.com/username/repo"
              value={formData.githubLink}
              onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
              className="bg-muted border-border h-11 flex-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 py-2.5">
              <ExternalLink className="h-5 w-5" />
              <span>Live</span>
            </div>
            <Input
              placeholder="https://project.com"
              value={formData.liveLink}
              onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
              className="bg-muted border-border h-11 flex-1"
            />
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN — TAGS */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-sidebar border border-border rounded-lg p-5">

          <h3 className="text-lg font-semibold mb-4">Select Tags</h3>

          {formData.tags.length > 0 && (
            <div className="mb-4 border-b border-border pb-4">
              <p className="text-sm font-medium mb-2">Selected ({formData.tags.length})</p>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="cursor-pointer bg-primary/20 text-primary hover:bg-unmuted"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Tag Input */}
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Add custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="h-10"
            />
            <Button type="button" onClick={addCustomTag} className="h-10 px-3">
              Add
            </Button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {Object.entries(availableTags).map(([category, tags]) => (
              <div key={category}>
                <p className="text-sm font-medium mb-2 capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className={`cursor-pointer ${
                        formData.tags.includes(tag)
                          ? "bg-primary/20 text-primary border-primary/50"
                          : "hover:bg-muted text-white"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Upload className="h-5 w-5 mr-2 animate-spin" /> : <Upload className="h-5 w-5 mr-2" />}
          {isSubmitting ? (isEdit ? "Updating..." : "Uploading...") : (isEdit ? "Update Project" : "Upload Project")}
        </Button>
      </div>
    </form>
  )
}
