import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getConversations, createConversation } from '@/lib/store';

export async function GET() {
  try {
    const userId = "default-user";
    const conversations = await getConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = "default-user";
    const body = await request.json();
    const { title, model } = body;

    const conversation = await createConversation(
      userId,
      title || 'New Conversation',
      model || 'gemini-2.5-flash'
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
