
# 💰 PenneyWise - Smart Budgeting for Students

**PenneyWise** is a full-stack budgeting application designed specifically for students to track expenses, set savings goals, and visualize spending habits. Built with Next.js, PostgreSQL, and Tailwind CSS.

## 🚀 Live Demo

Check out the live application: [**https://penneywise-sooty.vercel.app**](https://pennywise-sooty.vercel.app/)

## ✨ Features

### 🎯 Core Features
- **User Onboarding** - Set up monthly income and savings goals
- **Expense Management** - Add, edit, and delete expenses with categories
- **Spending Charts** - Weekly, monthly, and yearly spending visualizations
- **Category Breakdown** - See where your money goes with pie charts
- **Savings Goal Tracker** - Progress circle showing how close you are to your goal
- **Month-by-Month Navigation** - View past spending by month

### 💡 Advanced Features
- **Multi-Currency Support** - Switch between QAR, USD, EUR, GBP, INR, PKR, SAR, AED
- **Dark Mode** - Toggle between light and dark themes
- **Budget Alerts** - Get notified when you're approaching your spending limits
- **Achievement System** - Earn badges when you reach your savings goals
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### 📊 Dashboard
- **Income Overview** - See your monthly income at a glance
- **Spending Summary** - Track total spent and savings
- **Weekly Spending Trend** - Bar chart of your weekly spending
- **Monthly Comparison** - Compare spending vs savings by month
- **Yearly Trends** - View your spending patterns over the years

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API

### Backend
- **API Routes:** Next.js API Routes
- **Database:** PostgreSQL (Neon Tech)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** Local Storage (Demo)

### Deployment
- **Hosting:** [Vercel](https://vercel.com/)
- **Database Hosting:** [Neon](https://neon.tech/)
- **Version Control:** Git & GitHub

## 📁 Project Structure

```
pennywise/
├── app/
│   ├── api/                    # API Routes
│   │   ├── achievements/       # Achievement endpoints
│   │   ├── budget-alerts/      # Budget alert endpoints
│   │   ├── expenses/           # Expense CRUD endpoints
│   │   ├── stats/              # Statistics endpoints
│   │   └── user/               # User management endpoints
│   ├── components/             # Reusable Components
│   │   ├── BudgetAlert.tsx     # Budget alert notification
│   │   ├── DashboardLayout.tsx # Main layout wrapper
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── context/                # React Context Providers
│   │   └── ThemeContext.tsx    # Dark/Light theme management
│   ├── lib/                    # Utility functions
│   │   └── currency.ts         # Currency formatting & conversion
│   ├── dashboard/              # Dashboard Page
│   │   └── page.tsx
│   ├── expenses/               # Expense Pages
│   │   ├── add/                # Add expense form
│   │   └── edit/               # Edit expense form
│   ├── onboarding/             # Onboarding Page
│   │   └── page.tsx
│   ├── profile/                # Profile Page
│   │   └── page.tsx
│   └── settings/               # Settings Page
│       └── page.tsx
├── prisma/
│   └── schema.prisma           # Database Schema
├── public/                     # Static Assets
│   └── favicon.ico
├── .env                        # Environment Variables
├── .gitignore                  # Git ignore file
├── package.json                # Dependencies & scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| **`app/api/`** | All backend API routes (Next.js serverless functions) |
| **`app/components/`** | Reusable UI components shared across pages |
| **`app/context/`** | React context providers for global state (theme, user) |
| **`app/lib/`** | Utility functions (currency formatting, date helpers) |
| **`prisma/`** | Database schema and Prisma Client configuration |
| **`public/`** | Static assets (images, favicon, robots.txt) |


## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or Neon)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Nausheenkhan-git/pennywise.git
cd pennywise
```

### Install dependencies
```bash
npm install
```

### Set up environment variables

create .env file
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/pennywise_dev"
```

### Set up database
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### Run the development server

```bash
npm run dev
```

### Open the application
```bash
http://localhost:3000
```

### Deployment Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🗄️ Database Schema
### User Model
- id - Unique identifier
- email - User email (unique)
- monthlyIncome - Monthly income amount
- savingsGoal - Savings goal amount
- currency - Preferred currency (default: QAR)
- createdAt - Account creation date

### Expense Model
- id - Unique identifier
- description - Expense description
- amount - Expense amount
- category - Expense category (Food, Transport, etc.)
- date - Expense date
- userId - Reference to User

### Achievement Model
- id - Unique identifier
- userId - Reference to User
- type - Achievement type
- name - Achievement name
- description - Achievement description
- icon - Achievement icon
- month - Achievement month

### BudgetAlert Model
- id - Unique identifier
- userId - Reference to User
- category - Category (null for general)
- month - Alert month
- threshold - Alert threshold percentage
- isActive - Alert status

## 🎨 Features in Detail
- Multi-Currency Support
- Switch between 8 different currencies:
- QAR (Qatari Riyal) - Default


## Achievement System
- Earn badges when you:
- 🎯 Reach your savings goal
- 📊 Save consistently for multiple months
- 💪 Achieve savings milestones

## Budget Alerts
- Set custom alert thresholds (e.g., 80% of budget)
- Visual indicators on dashboard
- Color-coded alerts (green, yellow, red)

## 📱 Responsive Design
The application is fully responsive and works on:
- Desktop - Full sidebar with all features
- Tablet - Collapsible sidebar
- Mobile - Hamburger menu navigation

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch ```bash(git checkout -b feature/AmazingFeature)```
3. Commit your changes ```bash(git commit -m 'Add some AmazingFeature')```
4. Push to the branch ```bash(git push origin feature/AmazingFeature)```
5. Open a Pull Request

## 🙏 Acknowledgments
- Next.js - The React Framework
- Vercel - Deployment Platform
- Neon - Serverless PostgreSQL
- Tailwind CSS - CSS Framework
- Recharts - Chart Library
- Lucide - Icon Library

## 📞 Contact
- GitHub: @Nausheenkhan-git
- Project Link: https://github.com/Nausheenkhan-git/pennywise
- Live Demo: [https://pennywise-sooty.vercel.app](https://pennywise-sooty.vercel.app/)

## 🌟 Show Your Support
If you found this project helpful, please give it a ⭐ on GitHub!

Built with ❤️ for students everywhere
