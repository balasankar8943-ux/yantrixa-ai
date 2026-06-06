import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
  ],
};

const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'txt',
  'md',
  'csv',
]);

function getAllowedTypes(): string[] {
  return Object.values(ALLOWED_TYPES).flat();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = getAllowedTypes();
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.size > 0 ? Array.from(ALLOWED_EXTENSIONS).join(', ') : 'none'}`,
        },
        { status: 400 }
      );
    }

    // Check file extension
    const originalName = file.name;
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'File extension not allowed' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = uuidv4();
    const safeFilename = `${uniqueId}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return file info
    return NextResponse.json(
      {
        url: `/uploads/${safeFilename}`,
        name: originalName,
        type: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
