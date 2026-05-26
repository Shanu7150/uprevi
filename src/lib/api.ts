import type {
  ApiResponse,
  AuthTokens,
  User,
  Restaurant,
  RestaurantDashboardData,
  Order,
  MenuCategory,
  Review,
  ReviewSummary,
  Customer,
  Promotion,
  AnalyticsData,
  OnboardingData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

let accessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("uprevi_access_token") : null;
let refreshToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("uprevi_refresh_token") : null;

export function setTokens(tokens: AuthTokens) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (typeof window !== "undefined") {
    localStorage.setItem("uprevi_access_token", tokens.accessToken);
    localStorage.setItem("uprevi_refresh_token", tokens.refreshToken);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("uprevi_access_token");
    localStorage.removeItem("uprevi_refresh_token");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry && refreshToken) {
    const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshed.ok) {
      const data = await refreshed.json();
      setTokens(data.data);
      return request<T>(path, options, false);
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
  return json as ApiResponse<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ user: User; tokens: AuthTokens }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; role?: string }) =>
    request<{ user: User; tokens: AuthTokens }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => request<User>("/auth/me"),
};

// ── Restaurants ───────────────────────────────────────────────────────────────
export const restaurants = {
  dashboard: (restaurantId: string) =>
    request<RestaurantDashboardData>(`/restaurants/${restaurantId}/dashboard`),

  update: (restaurantId: string, data: Partial<Restaurant>) =>
    request<Restaurant>(`/restaurants/${restaurantId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  onboard: (data: OnboardingData) =>
    request<{ restaurant: Restaurant; user: User; tokens: AuthTokens }>("/restaurants/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMenu: (restaurantId: string) =>
    request<MenuCategory[]>(`/restaurants/${restaurantId}/menu`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orders = {
  list: (restaurantId: string, params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ orders: Order[]; total: number; page: number; totalPages: number }>(
      `/orders?restaurantId=${restaurantId}${qs ? `&${qs}` : ""}`
    );
  },

  get: (orderId: string) => request<Order>(`/orders/${orderId}`),

  create: (data: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number; selectedModifierIds: string[] }[];
    orderType: string;
    deliveryAddress?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    tip?: number;
    promotionCode?: string;
  }) =>
    request<{ order: Order; checkoutUrl: string }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (orderId: string, status: string) =>
    request<Order>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = {
  list: (restaurantId: string) =>
    request<{ reviews: Review[]; summary: ReviewSummary }>(
      `/reviews?restaurantId=${restaurantId}`
    ),

  aiAnalyze: (reviewId: string) =>
    request<Review>(`/reviews/${reviewId}/ai-analyze`, { method: "POST" }),

  aiRespond: (reviewId: string) =>
    request<{ draft: string }>(`/reviews/${reviewId}/ai-respond`, { method: "POST" }),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customers = {
  list: (restaurantId: string) =>
    request<{ customers: Customer[]; segments: Record<string, number> }>(
      `/customers?restaurantId=${restaurantId}`
    ),
};

// ── Promotions ────────────────────────────────────────────────────────────────
export const promotions = {
  list: (restaurantId: string) =>
    request<Promotion[]>(`/promotions?restaurantId=${restaurantId}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analytics = {
  get: (restaurantId: string, days = 30) =>
    request<AnalyticsData>(`/analytics?restaurantId=${restaurantId}&days=${days}`),
};
