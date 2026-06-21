import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET budget alerts for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { userId };
    if (month) {
      whereClause.month = month;
    }

    const alerts = await prisma.budgetAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget alerts' },
      { status: 500 }
    );
  }
}

// POST create a new budget alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, category, month, threshold } = body;

    console.log('📝 Creating budget alert:', { userId, category, month, threshold });

    if (!userId || !month || threshold === undefined) {
      return NextResponse.json(
        { error: 'User ID, month, and threshold are required' },
        { status: 400 }
      );
    }

    if (threshold < 0 || threshold > 100) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Check if an alert already exists for this month
    const existingAlert = await prisma.budgetAlert.findFirst({
      where: {
        userId,
        month,
        category: category || null,
      },
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: 'An alert already exists for this month. Please update the existing alert.' },
        { status: 409 }
      );
    }

    const alert = await prisma.budgetAlert.create({
      data: {
        userId,
        category: category || null,
        month,
        threshold,
        isActive: true,
      },
    });

    console.log('✅ Budget alert created:', alert.id);
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating budget alert:', error);
    return NextResponse.json(
      { error: 'Failed to create budget alert' },
      { status: 500 }
    );
  }
}

// PUT update a budget alert
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, threshold, isActive } = body;

    console.log('📝 Updating budget alert:', { id, threshold, isActive });

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists
    const existingAlert = await prisma.budgetAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (threshold !== undefined) {
      if (threshold < 0 || threshold > 100) {
        return NextResponse.json(
          { error: 'Threshold must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.threshold = threshold;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const alert = await prisma.budgetAlert.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Budget alert updated:', alert.id);
    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error updating budget alert:', error);
    return NextResponse.json(
      { error: 'Failed to update budget alert' },
      { status: 500 }
    );
  }
}

// DELETE a budget alert
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('📝 Deleting budget alert:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Check if alert exists
    const existingAlert = await prisma.budgetAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    await prisma.budgetAlert.delete({
      where: { id },
    });

    console.log('✅ Budget alert deleted:', id);
    return NextResponse.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget alert' },
      { status: 500 }
    );
  }
}