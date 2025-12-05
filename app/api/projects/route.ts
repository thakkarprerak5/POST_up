import { NextResponse } from 'next/server';
import { createProject, listProjects } from '@/models/Project';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const authorId = searchParams.get('author');

  const query: any = {};
  if (tag) query.tags = tag;
  if (authorId) query['author.id'] = authorId;

  const projects = await listProjects(query, { limit, sort: { createdAt: -1 } });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get('title')?.toString() || '';
  const description = formData.get('description')?.toString() || '';
  const githubUrl = formData.get('githubUrl')?.toString() || '';
  const liveUrl = formData.get('liveUrl')?.toString() || '';
  const tags = (formData.get('tags')?.toString() || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const images: string[] = [];
  const files = formData.getAll('images') as File[];
  if (files && files.length) {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${uuidv4()}.${ext}`;
      const filePath = join(uploadsDir, filename);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      images.push(`/uploads/${filename}`);
    }
  }

  const project = await createProject({
    title,
    description,
    tags,
    images,
    githubUrl,
    liveUrl,
    author: {
      id: session.user.id,
      name: session.user.name || 'Unknown',
      image: session.user.image || undefined,
    },
    createdAt: new Date(),
  } as any);

  return NextResponse.json(project, { status: 201 });
}
