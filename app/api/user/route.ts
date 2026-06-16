import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, monthlyIncome, savingsGoal } = body;

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
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}