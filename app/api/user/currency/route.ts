import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('📝 Currency update request:', body);
    
    const { userId, currency } = body;

    if (!userId || !currency) {
      return NextResponse.json(
        { error: 'User ID and currency are required' },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['QAR', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'SAR', 'AED'];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency code. Must be one of: ' + validCurrencies.join(', ') },
        { status: 400 }
      );
    }

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's currency
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        currency: currency 
      },
    });

    console.log('✅ Currency updated for user:', user.id, 'to', user.currency);

    return NextResponse.json({ 
      success: true, 
      currency: user.currency 
    });
  } catch (error: any) {
    console.error('❌ Error updating currency:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update currency. Please try again.' },
      { status: 500 }
    );
  }
}