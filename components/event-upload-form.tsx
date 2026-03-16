"use client"

import type React from "react"
import { useState } from "react"
import { Upload, X, MapPin, Calendar, Clock, ImageIcon, Plus, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

// Available tags organized by category
const availableTags = {
    types: ["Workshop", "Seminar", "Hackathon", "Webinar", "Meetup", "Networking"],
    topics: ["Technology", "Design", "Business", "Career", "Science", "Health"],
}

interface EventFormData {
    title: string
    description: string
    date: string
    time: string
    location: string
    coverImage: File | null
    video: File | null
    tags: string[]
}

export function EventUploadForm() {
    const router = useRouter()
    const [formData, setFormData] = useState<EventFormData>({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        coverImage: null,
        video: null,
        tags: [],
    })

    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customTag, setCustomTag] = useState("")

    // --------------------------
    // IMAGE UPLOAD
    // --------------------------
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFormData((prev) => ({ ...prev, coverImage: file }))

        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const removeImage = () => {
        setFormData((prev) => ({ ...prev, coverImage: null }))
        setImagePreview(null)
    }

    // --------------------------
    // VIDEO UPLOAD
    // --------------------------
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFormData((prev) => ({ ...prev, video: file }))
        setVideoPreview(URL.createObjectURL(file))
    }

    const removeVideo = () => {
        setFormData((prev) => ({ ...prev, video: null }))
        if (videoPreview) URL.revokeObjectURL(videoPreview)
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
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('date', formData.date);
            data.append('time', formData.time);
            data.append('location', formData.location || 'Online');
            data.append('tags', formData.tags.join(',')); // API expects string

            if (formData.coverImage) {
                data.append('coverImage', formData.coverImage);
            }

            if (formData.video) {
                data.append('video', formData.video);
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                body: data, // No Content-Type header needed for FormData
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || "Failed to create event")
            }

            alert("Event created successfully!")
            router.push('/events') // Redirect to event feed

        } catch (err) {
            alert((err as Error).message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">

            {/* LEFT COLUMN */}
            <div className="flex-1 space-y-6">

                {/* TITLE */}
                <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                        placeholder="Enter event title"
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
                        placeholder="Describe the event..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-muted border-border min-h-[150px] resize-none"
                        required
                    />
                    <p className="text-xs text-muted-foreground">URLs will be automatically linked.</p>
                </div>

                {/* DATE & TIME & LOCATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="pl-9 bg-muted border-border"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Time</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="pl-9 bg-muted border-border"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Online or Physical Address"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="pl-9 bg-muted border-border"
                        />
                    </div>
                </div>

                {/* IMAGE */}
                <div className="space-y-2">
                    <Label>Cover Image</Label>

                    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50">
                        {imagePreview ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-background">
                                <img src={imagePreview} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                                <div className="p-4 bg-muted rounded-full mb-4">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Click to upload cover image</span>
                                <span className="text-sm text-muted-foreground">PNG, JPG</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* VIDEO */}
                <div className="space-y-2">
                    <Label>Event Video (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50">
                        {videoPreview ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-background">
                                <video
                                    src={videoPreview}
                                    controls
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeVideo}
                                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full z-10"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center cursor-pointer py-8">
                                <div className="p-4 bg-muted rounded-full mb-4">
                                    <Video className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <span className="font-medium">Click to upload video</span>
                                <span className="text-sm text-muted-foreground">MP4, WebM</span>
                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                            </label>
                        )}
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
                                            className={`cursor-pointer ${formData.tags.includes(tag)
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
                    {isSubmitting ? "Publishing..." : "Publish Event"}
                </Button>
            </div>
        </form>
    )
}
