"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, CheckCircle2, Eye, PauseCircle, RotateCcw, Search, ShieldCheck, Store, XCircle } from "lucide-react";
import { shopService } from "@/services/shopService";

const STATUSES = ["all", "PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "CLOSED"];
const SUBSCRIPTION_STATUSES = ["PENDING", "TRIAL", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"];

function statusClass(status) {
  if (status === "ACTIVE") return "bg-green-50 text-green-700 border-green-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "REJECTED" || status === "SUSPENDED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const filters = useMemo(() => ({ status, search }), [status, search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await shopService.adminList(filters);
      setShops(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const update = async (shop, payload) => {
    setBusyId(shop.id);
    setMessage("");
    try {
      await shopService.adminUpdate(shop.id, payload);
      setMessage("Boutique mise a jour.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Action impossible.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boutiques professionnelles</h1>
          <p className="text-sm text-gray-500">Moderation, verification et abonnements simules.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher" className="h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm">
            {STATUSES.map((item) => <option key={item} value={item}>{item === "all" ? "Tous les statuts" : item}</option>)}
          </select>
        </div>
      </div>

      {message && <div className="mb-4 rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0] p-3 text-sm text-[#2D5016]">{message}</div>}

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="grid grid-cols-[1.8fr_1fr_1fr_1.1fr_1.4fr] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-bold uppercase text-gray-400">
          <span>Boutique</span>
          <span>Statut</span>
          <span>Annonces</span>
          <span>Abonnement</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Chargement...</div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Aucune boutique trouvee.</div>
        ) : shops.map((shop) => (
          <div key={shop.id} className="grid grid-cols-[1.8fr_1fr_1fr_1.1fr_1.4fr] gap-4 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-[#E8F5D0]">
                  {shop.logo ? <img src={shop.logo} alt="" className="h-full w-full object-cover" /> : <Store size={19} className="text-[#2D5016]" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">{shop.name}</p>
                  <p className="truncate text-xs text-gray-500">{shop.city} - {shop.owner?.email}</p>
                  {shop.isVerified && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><BadgeCheck size={12} /> Verifiee</span>}
                </div>
              </div>
            </div>
            <div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(shop.status)}`}>{shop.status}</span>
              {shop.rejectionReason && <p className="mt-1 text-xs text-red-600">{shop.rejectionReason}</p>}
            </div>
            <div className="font-semibold text-gray-700">{shop.activeListingsCount}</div>
            <div>
              <p className="font-semibold text-gray-800">{shop.subscription?.plan?.name || "-"}</p>
              <select value={shop.subscription?.status || "PENDING"} disabled={busyId === shop.id} onChange={(e) => update(shop, { subscriptionStatus: e.target.value })} className="mt-2 h-9 rounded-lg border border-gray-200 px-2 text-xs">
                {SUBSCRIPTION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/boutiques/${shop.slug}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"><Eye size={13} /> Voir</Link>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { status: "ACTIVE", rejectionReason: "" })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-green-200 px-3 text-xs font-semibold text-green-700"><CheckCircle2 size={13} /> Approuver</button>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { status: "REJECTED", rejectionReason: "Demande rejetee par moderation." })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"><XCircle size={13} /> Rejeter</button>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { status: "SUSPENDED" })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-amber-200 px-3 text-xs font-semibold text-amber-700"><PauseCircle size={13} /> Suspendre</button>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { status: "ACTIVE" })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"><RotateCcw size={13} /> Reactiver</button>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { isVerified: !shop.isVerified })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700"><ShieldCheck size={13} /> {shop.isVerified ? "Retirer" : "Verifier"}</button>
              <button disabled={busyId === shop.id} onClick={() => update(shop, { status: "CLOSED" })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-500"><Ban size={13} /> Fermer</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
