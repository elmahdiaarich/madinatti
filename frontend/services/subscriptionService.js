const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined"); })();

async function readJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `HTTP ${res.status}`);
  }
  return body;
}

export const subscriptionService = {
  getPlans: async () => {
    const res = await fetch(`${API_URL}/subscriptions/plans`);
    const json = await readJson(res);
    return json.data || [];
  },

  getMine: async (token) => {
    const res = await fetch(`${API_URL}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await readJson(res);
    return json.data || null;
  },

  checkout: async (payload, token) => {
    const res = await fetch(`${API_URL}/subscriptions/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return readJson(res);
  },
};
