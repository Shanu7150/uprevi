// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = "SUPER_ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Restaurant ────────────────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  logoUrl?: string;
  coverUrl?: string;
  cuisineType?: string;
  onDoorDash: boolean;
  onUberEats: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  isActive: boolean;
  createdAt: string;
}

export interface RestaurantDashboardData {
  restaurant: Restaurant;
  stats: DashboardStats;
  revenueByChannel: RevenueByChannel[];
  recentOrders: Order[];
  aiInsights: AiInsight[];
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  avgOrderValue: number;
  deliveryRevenue: number;
  directRevenue: number;
  revenueGrowthPct: number;
  ordersGrowthPct: number;
  avgOrderGrowthPct: number;
}

export interface RevenueByChannel {
  date: string;
  doordash: number;
  ubereats: number;
  direct: number;
  total: number;
}

export interface AiInsight {
  id: string;
  type: "opportunity" | "warning" | "info";
  title: string;
  body: string;
  action?: string;
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isSignature: boolean;
  isPopular: boolean;
  popularityScore: number;
  calories?: number;
  modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

// ── Orders ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Order {
  id: string;
  restaurantId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  items: OrderItem[];
  notes?: string;
  estimatedReadyAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: OrderItemModifier[];
  subtotal: number;
}

export interface OrderItemModifier {
  modifierId: string;
  name: string;
  price: number;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedModifiers: {
    groupId: string;
    groupName: string;
    modifierId: string;
    modifierName: string;
    price: number;
  }[];
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export interface Review {
  id: string;
  restaurantId: string;
  platform: "GOOGLE" | "DOORDASH" | "UBEREATS" | "YELP" | "DIRECT";
  rating: number;
  reviewerName: string;
  body: string;
  sentiment?: Sentiment;
  sentimentScore?: number;
  aiResponseDraft?: string;
  respondedAt?: string;
  createdAt: string;
  platformCreatedAt: string;
}

export interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  ratingDistribution: { star: number; count: number }[];
  topThemes: string[];
}

// ── Customers ─────────────────────────────────────────────────────────────────
export type CustomerSegment = "VIP" | "LOYAL" | "AT_RISK" | "NEW" | "LAPSED";

export interface Customer {
  id: string;
  restaurantId: string;
  name: string;
  email?: string;
  phone?: string;
  segment: CustomerSegment;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalOrders: number;
  clv: number;
  avgOrderValue: number;
  lastOrderAt?: string;
  createdAt: string;
}

// ── Promotions ────────────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  type: "PERCENTAGE_DISCOUNT" | "FIXED_DISCOUNT" | "FREE_ITEM" | "BOGO" | "FREE_DELIVERY";
  value: number;
  code?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageCount: number;
  usageLimit?: number;
  revenueGenerated: number;
  conversionRate: number;
  aiGenerated: boolean;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsData {
  revenueTrend: { date: string; revenue: number; orders: number }[];
  platformBreakdown: { platform: string; revenue: number; orders: number; pct: number }[];
  hourlyHeatmap: { hour: number; day: number; orders: number }[];
  topItems: { name: string; orders: number; revenue: number }[];
  directVsThirdParty: { direct: number; thirdParty: number; feeSavings: number };
  conversionFunnel: { stage: string; count: number; dropoffPct: number }[];
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Onboarding ────────────────────────────────────────────────────────────────
export interface OnboardingData {
  // Step 1: Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 2: Restaurant
  restaurantName: string;
  cuisineType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  onDoorDash: boolean;
  onUberEats: boolean;
  // Step 3: Revenue
  monthlyDeliveryRevenue: string;
  primaryGoal: string;
  biggestChallenge: string;
  // Step 4: Confirmation
  plan: "upfront" | "installments";
}
