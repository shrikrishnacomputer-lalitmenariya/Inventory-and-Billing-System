export async function searchCustomer(phone: string) {
  const res = await fetch(`/api/v1/customers?phone=${phone}`);
  if (!res.ok) throw new Error("Failed to search customer");
  return res.json();
}

export async function createBill(data: {
  customerName?: string;
  customerPhone?: string;
  paymentMode: string;
  discount: number;
  items: Array<{
    productId: number;
    quantity: number;
    productUnitId?: number;
  }>;
  financeProviderId?: string | number;
  emiAmount?: string | number;
  financeMonths?: string | number;
}) {
  const res = await fetch("/api/v1/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create bill");
  }
  return res.json();
}

export async function getBills(search?: string, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const url = `/api/v1/bills${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch bills");
  return res.json();
}

export async function getBill(id: number) {
  const res = await fetch(`/api/v1/bills/${id}`);
  if (!res.ok) throw new Error("Failed to fetch bill details");
  return res.json();
}

export async function voidBill(id: number) {
  const res = await fetch(`/api/v1/bills/${id}/void`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to void bill");
  }
  return res.json();
}
