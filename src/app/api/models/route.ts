import { NextResponse } from 'next/server';
import { AVAILABLE_MODELS } from '@/lib/gemini';

export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
