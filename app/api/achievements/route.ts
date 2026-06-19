import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, name, description, icon, month } = body;

    if (!userId || !type || !name || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const achievement = await prisma.achievement.create({
      data: {
        userId,
        type,
        name,
        description,
        icon,
        month,
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}