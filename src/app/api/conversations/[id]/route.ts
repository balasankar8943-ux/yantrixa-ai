import { NextRequest, NextResponse } from 'next/server';
import {
  getConversation,
  updateConversation,
  deleteConversation,
} from '@/lib/store';

const userId = "default-user";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Ensure conversation belongs to our default user
    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUpdate(
  request: NextRequest,
  id: string
) {
  const existingConversation = await getConversation(id);

  if (!existingConversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  if (existingConversation.userId !== userId) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { title } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json(
      { error: 'Title is required' },
      { status: 400 }
    );
  }

  const updated = await updateConversation(id, {
    title: title.trim(),
  });

  return NextResponse.json({ conversation: updated });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await handleUpdate(request, id);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await handleUpdate(request, id);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingConversation = await getConversation(id);

    if (!existingConversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (existingConversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteConversation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
