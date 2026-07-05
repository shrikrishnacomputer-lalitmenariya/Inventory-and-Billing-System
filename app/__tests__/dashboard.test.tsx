import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../(dashboard)/dashboard/page";
import "@testing-library/jest-dom";

// Mock global fetch
const mockStats = {
  totalProducts: 42,
  totalStockUnits: 500,
  totalCategories: 5,
  todaySales: 15000.5,
  monthlySales: 120000.75,
  lowStockCount: 3,
  outOfStockCount: 1,
  categoryStock: [{ name: "Smartphones", stock: 150 }],
  trends: {
    daily: [{ name: "18 Jun", sales: 15000.5 }],
    weekly: [{ name: "Week 1", sales: 80000 }],
    monthly: [{ name: "Jun 26", sales: 120000.75 }]
  },
  movement: {
    fastMoving: [{ id: 1, name: "iPhone 15 Pro", quantity: 10 }],
    slowMoving: [{ id: 2, name: "Samsung A14", quantity: 1 }]
  }
};

const mockNotifications = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    brand: "Apple",
    quantity: 0,
    threshold: 5,
    category: "Smartphones",
    severity: "critical",
    message: "🔴 Out of Stock: \"iPhone 15 Pro\" is out of stock.",
    createdAt: new Date().toISOString()
  }
];

beforeEach(() => {
  global.fetch = jest.fn((url: string) => {
    if (url.includes("/api/v1/dashboard/stats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });
    }
    if (url.includes("/api/v1/dashboard/notifications")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotifications),
      });
    }
    if (url.includes("/api/v1/due-payments")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes("/api/v1/whatsapp/settings")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "disconnected", enabled: false }),
      });
    }
    return Promise.reject(new Error("Unknown API route: " + url));
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Dashboard Page", () => {
  it("renders Shree Krishna Computer heading and metrics correctly", async () => {
    render(<DashboardPage />);

    // Verify loading state is shown initially
    expect(screen.getByText(/Loading Shree Krishna Computer stats.../i)).toBeInTheDocument();

    // Wait for the dashboard data to load
    await waitFor(() => {
      expect(screen.getByText("Shree Krishna Computer")).toBeInTheDocument();
    });

    // Check KPI counts
    expect(screen.getByText("42")).toBeInTheDocument(); // Total Products count
    expect(screen.getByText("500")).toBeInTheDocument(); // Total Stock units count
    expect(screen.getByText("5")).toBeInTheDocument(); // Total Categories count
    expect(screen.getByText("₹15000.50")).toBeInTheDocument(); // Today's Sales
    expect(screen.getByText("₹120000.75")).toBeInTheDocument(); // Monthly Sales

    // Check inventory notification alerts
    expect(screen.getByText(/Inventory Alerts/i)).toBeInTheDocument();
    expect(screen.getAllByText("iPhone 15 Pro").length).toBeGreaterThan(0);
    expect(screen.getByText("OUT OF STOCK")).toBeInTheDocument();

    // Check quick actions link presence
    expect(screen.getByText("Record Sale")).toBeInTheDocument();
    expect(screen.getByText("Add Product")).toBeInTheDocument();
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });
});
