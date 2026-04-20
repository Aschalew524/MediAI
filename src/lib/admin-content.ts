export type AdminStatCard = {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
};

export type UserRole = "user" | "doctor";
export type UserStatus = "active" | "pending" | "blocked";
export type LicenseStatus = "verified" | "pending" | "rejected";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  licenseStatus?: LicenseStatus;
  specialty?: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  subscriberCount: number;
};

export type TransactionStatus = "completed" | "pending" | "failed";

export type AdminTransaction = {
  id: string;
  userName: string;
  plan: string;
  amount: string;
  date: string;
  status: TransactionStatus;
};

export type AdminActivity = {
  id: string;
  description: string;
  timestamp: string;
  type: "signup" | "verification" | "payment" | "subscription" | "block";
};

export type MonthlyGrowth = {
  month: string;
  users: number;
};

export type RevenueSummary = {
  totalRevenue: string;
  activeSubscriptions: number;
  churnRate: string;
};

export const adminStatCards: AdminStatCard[] = [
  {
    label: "Total Users",
    value: "12,458",
    trend: "up",
    trendValue: "+12.5%",
  },
  {
    label: "Active Doctors",
    value: "342",
    trend: "up",
    trendValue: "+8.2%",
  },
  {
    label: "Active Subscriptions",
    value: "3,847",
    trend: "up",
    trendValue: "+15.3%",
  },
  {
    label: "Monthly Revenue",
    value: "$24,580",
    trend: "down",
    trendValue: "-2.1%",
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "usr-001",
    name: "Joe Smith",
    email: "joe@gmail.com",
    role: "user",
    status: "active",
    joinedAt: "12 Jan, 2025",
  },
  {
    id: "usr-002",
    name: "Sara Johnson",
    email: "sara.j@gmail.com",
    role: "user",
    status: "active",
    joinedAt: "05 Feb, 2025",
  },
  {
    id: "doc-001",
    name: "Dr. Michael Chen",
    email: "m.chen@hospital.org",
    role: "doctor",
    status: "active",
    joinedAt: "20 Dec, 2024",
    licenseStatus: "verified",
    specialty: "Neurology",
  },
  {
    id: "doc-002",
    name: "Dr. Amina Tadesse",
    email: "amina.t@medclinic.et",
    role: "doctor",
    status: "pending",
    joinedAt: "01 Mar, 2025",
    licenseStatus: "pending",
    specialty: "Cardiology",
  },
  {
    id: "usr-003",
    name: "Christine Abebe",
    email: "christine.a@gmail.com",
    role: "user",
    status: "blocked",
    joinedAt: "18 Nov, 2024",
  },
  {
    id: "doc-003",
    name: "Dr. Abel Kebede",
    email: "abel.k@healthcenter.et",
    role: "doctor",
    status: "active",
    joinedAt: "14 Jan, 2025",
    licenseStatus: "verified",
    specialty: "Dermatology",
  },
  {
    id: "usr-004",
    name: "Daniel Mekonnen",
    email: "daniel.m@outlook.com",
    role: "user",
    status: "active",
    joinedAt: "22 Feb, 2025",
  },
  {
    id: "doc-004",
    name: "Dr. Helen Worku",
    email: "helen.w@hospital.et",
    role: "doctor",
    status: "pending",
    joinedAt: "10 Mar, 2025",
    licenseStatus: "pending",
    specialty: "Pediatrics",
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    subscriberCount: 8_234,
  },
  {
    id: "plan-lite",
    name: "Lite",
    monthlyPrice: "$3.99",
    yearlyPrice: "$47.88",
    subscriberCount: 2_891,
  },
  {
    id: "plan-pro",
    name: "Pro",
    monthlyPrice: "$7.99",
    yearlyPrice: "$95.88",
    subscriberCount: 956,
  },
];

export const adminTransactions: AdminTransaction[] = [
  {
    id: "txn-001",
    userName: "Joe Smith",
    plan: "Lite",
    amount: "$3.99",
    date: "15 Apr, 2025",
    status: "completed",
  },
  {
    id: "txn-002",
    userName: "Sara Johnson",
    plan: "Pro",
    amount: "$7.99",
    date: "14 Apr, 2025",
    status: "completed",
  },
  {
    id: "txn-003",
    userName: "Daniel Mekonnen",
    plan: "Lite",
    amount: "$3.99",
    date: "13 Apr, 2025",
    status: "pending",
  },
  {
    id: "txn-004",
    userName: "Christine Abebe",
    plan: "Pro",
    amount: "$7.99",
    date: "12 Apr, 2025",
    status: "failed",
  },
  {
    id: "txn-005",
    userName: "Abel Kebede",
    plan: "Lite",
    amount: "$47.88",
    date: "11 Apr, 2025",
    status: "completed",
  },
  {
    id: "txn-006",
    userName: "Helen Worku",
    plan: "Pro",
    amount: "$95.88",
    date: "10 Apr, 2025",
    status: "completed",
  },
];

export const recentActivity: AdminActivity[] = [
  {
    id: "act-001",
    description: "New user Joe Smith signed up",
    timestamp: "2 hours ago",
    type: "signup",
  },
  {
    id: "act-002",
    description: "Dr. Michael Chen license verified",
    timestamp: "5 hours ago",
    type: "verification",
  },
  {
    id: "act-003",
    description: "Payment of $7.99 received from Sara Johnson",
    timestamp: "8 hours ago",
    type: "payment",
  },
  {
    id: "act-004",
    description: "Daniel Mekonnen upgraded to Lite plan",
    timestamp: "1 day ago",
    type: "subscription",
  },
  {
    id: "act-005",
    description: "Dr. Amina Tadesse submitted license for verification",
    timestamp: "1 day ago",
    type: "verification",
  },
  {
    id: "act-006",
    description: "Christine Abebe account blocked by admin",
    timestamp: "2 days ago",
    type: "block",
  },
];

export const monthlyGrowth: MonthlyGrowth[] = [
  { month: "Oct", users: 8200 },
  { month: "Nov", users: 9100 },
  { month: "Dec", users: 9800 },
  { month: "Jan", users: 10400 },
  { month: "Feb", users: 11200 },
  { month: "Mar", users: 12458 },
];

export const revenueSummary: RevenueSummary = {
  totalRevenue: "$124,580",
  activeSubscriptions: 3847,
  churnRate: "4.2%",
};
