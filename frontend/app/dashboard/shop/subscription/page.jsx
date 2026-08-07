"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { shopService } from "@/services/shopService";

export default function ShopSubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [shop, setShop] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([shopService.plans(), shopService.dashboard()]).then(([plansRes, dashRes]) => {
      setPlans(plansRes.data || []);
      setShop(dashRes.data?.currentShop || null);
    });
  }, []);

  const paymentMessage = async (action, planId) => {
    if (shop?.id && planId) await shopService.changePlan(shop.id, planId).catch(() => null);
    const res = await shopService.paymentAction(action).catch(() => ({ data: { message: "Le paiement en ligne sera bientot disponible." } }));
    setMessage(res.data?.message || "Le paiement en ligne sera bientot disponible.");
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonnement boutique</h1>
          <p className="text-sm text-gray-500">Interface de demonstration sans paiement reel.</p>
        </div>
        <Link href="/dashboard/shop" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Retour dashboard</Link>
      </div>
      {message && <div className="mb-5 rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0] p-3 text-sm text-[#2D5016]">{message}</div>}

      {shop && (
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Abonnement actuel</h2>
          <div className="mt-3 grid gap-3 text-sm text-gray-600 md:grid-cols-4">
            <p>Formule : <strong>{shop.subscription?.plan?.name || "Aucune"}</strong></p>
            <p>Prix : <strong>{shop.subscription?.plan?.displayedPrice || "-"}</strong></p>
            <p>Statut : <strong>{shop.subscription?.status || "-"}</strong></p>
            <p>Limite : <strong>{shop.subscription?.plan?.listingLimit || 0}</strong></p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => paymentMessage("renew")} className="rounded-xl bg-[#2D5016] px-4 py-2 text-sm font-semibold text-white">Renouveler</button>
            <button onClick={() => paymentMessage("cancel")} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Annuler l abonnement</button>
            <button onClick={() => paymentMessage("payment-method")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"><CreditCard size={15} /> Ajouter un moyen de paiement</button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="mt-1 text-sm font-semibold text-[#2D5016]">{plan.displayedPrice}</p>
            <p className="text-xs text-gray-500">{plan.listingLimit} annonces actives</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {(plan.features || []).map((feature) => <li key={feature} className="flex gap-2"><Check size={14} className="mt-0.5 text-[#2D5016]" /> {feature}</li>)}
            </ul>
            <button onClick={() => paymentMessage("subscribe", plan.id)} className="mt-5 w-full rounded-xl bg-[#2D5016] px-4 py-2 text-sm font-semibold text-white">
              {shop?.subscription?.planId === plan.id ? "Formule actuelle" : "Changer de formule"}
            </button>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">Historique des abonnements</h2>
        <p className="mt-2 text-sm text-gray-500">Historique de demonstration. Aucune transaction bancaire n est creee.</p>
      </section>
    </main>
  );
}
