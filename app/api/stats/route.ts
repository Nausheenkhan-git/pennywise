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

    // Get user for monthly income
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    // Calculate monthly stats
    const monthlyMap = new Map();
    
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { spent: 0, month: monthKey });
      }
      monthlyMap.get(monthKey).spent += exp.amount;
    });

    // Get achievements to check which months had goals reached
    const achievements = await prisma.achievement.findMany({
      where: {
        userId,
        type: 'goal_reached',
      },
    });

    const goalMonths = new Set(achievements.map(a => a.month));

    const monthlyStats = Array.from(monthlyMap.values())
      .map(({ month, spent }) => {
        const saved = user.monthlyIncome - spent;
        return {
          month,
          spent,
          saved,
          goalReached: goalMonths.has(month),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json(monthlyStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}