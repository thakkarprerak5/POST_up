import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Project from '@/models/Project'
import { projects as staticProjects, collectionCategories } from '@/lib/data/projects'

export async function GET(request: Request) {
  try {
    await connectDB()
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()

    if (!q) {
      return NextResponse.json({ users: [], projects: [] })
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    const users = await (User as any)
      .find({
        $or: [
          { fullName: { $regex: regex } },
          { email: { $regex: regex } },
          { 'profile.enrollmentNo': { $regex: regex } },
          { 'profile.course': { $regex: regex } },
          { 'profile.branch': { $regex: regex } },
          { 'profile.skills': { $in: [regex] } },
          { 'profile.expertise': { $in: [regex] } },
          { 'profile.researchAreas': { $in: [regex] } }
        ]
      })
      .select('-password')
      .limit(40)
      .exec()

    const projects = await (Project as any)
      .find({
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { tags: { $in: [regex] } },
          { 'author.name': { $regex: regex } },
          { githubUrl: { $regex: regex } },
          { liveUrl: { $regex: regex } }
        ]
      })
      .limit(40)
      .exec()

    // Merge DB projects + static projects (static first)
    const staticMatches = (staticProjects || []).filter((p: any) => {
      try {
        if (regex.test(String(p.title || ''))) return true
        if (regex.test(String(p.description || ''))) return true
        if ((p.tags || []).some((t: string) => regex.test(t))) return true
        if (p.author && (regex.test(String(p.author.name || '')) || regex.test(String(p.author.username || '')))) return true
        if (p.githubUrl && regex.test(String(p.githubUrl))) return true
        if (p.liveUrl && regex.test(String(p.liveUrl))) return true
      } catch (e) {
        return false
      }
      return false
    })

    // Also search collection categories (by name/slug)
    const collectionMatches = (collectionCategories || []).filter((c: any) => {
      try {
        if (regex.test(String(c.name || ''))) return true
        if (regex.test(String(c.slug || ''))) return true
      } catch (e) {
        return false
      }
      return false
    })

    // Combine DB projects and staticMatches, prefer DB project fields but include static ones
    const combinedProjects = [
      ...staticMatches.slice(0, 40),
      ...(projects || []).slice(0, 40),
    ].slice(0, 40)

    return NextResponse.json({ users, projects: combinedProjects, collections: collectionMatches })
  } catch (err) {
    console.error('Search API error', err)
    return NextResponse.json({ users: [], projects: [] }, { status: 500 })
  }
}
