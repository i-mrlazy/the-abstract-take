import { NextRequest, NextResponse } from 'next/server';
import { subscriberRepository } from '@/lib/db/repositories/subscriberRepository';

export async function POST(req: NextRequest) {
  try {
    const { email, preference } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'InvalidEmail', message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const { subscriber, isNew } = await subscriberRepository.addSubscriber(email, preference);
    return NextResponse.json({
      success: true,
      subscriber,
      message: isNew
        ? 'Welcome to The Abstract Dispatch!'
        : 'You are already subscribed to The Abstract Dispatch!',
    });
  } catch (err: any) {
    console.error('Subscribe error:', err);
    return NextResponse.json({ error: 'ServerError', message: err.message }, { status: 500 });
  }
}
