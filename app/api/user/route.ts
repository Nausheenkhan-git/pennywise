import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    console.log('🔍 API GET: Fetching user with ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('👤 API GET: User found:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ API Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📝 API POST: Creating user:', body);
    
    const { email, monthlyIncome, savingsGoal } = body;

    if (!email || monthlyIncome === undefined || savingsGoal === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('✅ API POST: User already exists:', existingUser.id);
      return NextResponse.json({ 
        userId: existingUser.id,
        message: 'Welcome back!'
      });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        monthlyIncome: parseFloat(monthlyIncome),
        savingsGoal: parseFloat(savingsGoal),
      },
    });

    console.log('✅ API POST: New user created:', user.id);
    return NextResponse.json({ userId: user.id });
  } catch (error) {
    console.error('❌ API Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}