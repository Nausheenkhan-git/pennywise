// app/api/user/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, monthlyIncome, savingsGoal } = body;

    // Validate input
    if (!email || monthlyIncome === undefined || savingsGoal === undefined) {
      return NextResponse.json(
        { error: 'Please fill in all fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please use a different email.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        monthlyIncome: parseFloat(monthlyIncome),
        savingsGoal: parseFloat(savingsGoal),
      },
    });

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}