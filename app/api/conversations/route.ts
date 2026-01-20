import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would be a database
const conversations = new Map<string, {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}>();

// GET /api/conversations - List all conversations
export async function GET() {
  try {
    const conversationList = Array.from(conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return NextResponse.json(conversationList);
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title = 'New conversation' } = body;

    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();

    const conversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
    };

    conversations.set(id, conversation);

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
