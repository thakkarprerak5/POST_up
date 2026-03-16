import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Event from '@/models/Event';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// GET: Fetch events (with optional filtering)
export async function GET(request: Request) {
    try {
        await connectDB();
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const organizerId = url.searchParams.get('organizer');
        const visibility = url.searchParams.get('visibility');

        const query: any = {
            status: { $in: ['upcoming', 'ongoing'] } // Default to active events
        };

        if (organizerId) {
            query.organizerId = organizerId;
        }

        if (visibility) {
            query.visibility = visibility;
        } else {
            // Default to public events if not specified
            query.visibility = 'public';
        }

        const events = await Event.find(query)
            .populate('organizerId', 'fullName email photo type')
            .sort({ date: 1 }) // Closest dates first
            .limit(limit)
            .lean();

        // Format events for the frontend
        const formattedEvents = events.map((event: any) => ({
            _id: event._id,
            title: event.title,
            description: event.description,
            coverImage: event.coverImage,
            videoUrl: event.videoUrl, // Include video URL
            date: event.date,
            time: event.time,
            duration: event.duration,
            location: event.location,
            organizer: {
                id: event.organizerId?._id,
                name: event.organizerId?.fullName || 'Unknown Organizer',
                photo: event.organizerId?.photo,
                type: event.organizerId?.type || 'admin'
            },
            attendeeCount: event.attendees?.length || 0,
            maxAttendees: event.maxAttendees,
            tags: event.tags,
            status: event.status
        }));

        return NextResponse.json({ success: true, events: formattedEvents });

    } catch (error: any) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

// POST: Create a new event (Admin/Super Admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userRole = (session.user as any).role || (session.user as any).type;

        if (userRole !== 'admin' && userRole !== 'super-admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Only Admins can create events' },
                { status: 403 }
            );
        }

        await connectDB();

        // Handle FormData for file upgrades
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const date = formData.get('date') as string;
        const time = formData.get('time') as string;
        const location = formData.get('location') as string;
        const tags = formData.get('tags') as string; // Comma separated
        const coverImageFile = formData.get('coverImage') as File | null;
        const videoFile = formData.get('video') as File | null;

        // Validation
        if (!title || !description || !date || !time) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Handle File Uploads
        let coverImageUrl = '';
        if (coverImageFile && coverImageFile.size > 0) {
            const bytes = await coverImageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadsDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadsDir, { recursive: true });
            const filename = `${uuidv4()}-${coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filepath = join(uploadsDir, filename);
            await writeFile(filepath, buffer);
            coverImageUrl = `/uploads/${filename}`;
        }

        let videoUrl = '';
        if (videoFile && videoFile.size > 0) {
            const bytes = await videoFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadsDir = join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadsDir, { recursive: true });
            const filename = `${uuidv4()}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filepath = join(uploadsDir, filename);
            await writeFile(filepath, buffer);
            videoUrl = `/uploads/${filename}`;
        }

        // Process Tags
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

        const newEvent = await Event.create({
            title,
            description,
            date: new Date(date),
            time,
            location: location || 'Online',
            coverImage: coverImageUrl,
            videoUrl: videoUrl,
            tags: tagsArray,
            organizerId: session.user.id,
            attendees: []
        });

        return NextResponse.json({ success: true, event: newEvent }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
