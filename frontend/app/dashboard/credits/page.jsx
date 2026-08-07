"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { creditService } from "@/services/creditService";
import { useToast } from "@/context/ToastContext";
import { Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";

const TX_LABELS = {
  PURCHASE: { label: "Achat de pack", color: "text-green-700 bg-green-50" },
  UNLOCK:   { label: "Déblocage candidat", color: "text-blue-700 bg-blue-50" },
  REFUND:   { label: "Remboursement", color: "text-yellow-700 bg-yellow-50" },
};

export default function CreditsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [packs, setPacks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [packsRes, meRes] = await Promise.all([
        creditService.getPacks(token),
        creditService.getMine(token),
      ]);
      setPacks(packsRes.data || []);
      setBalance(meRes.balance || 0);
      setTransactions(meRes.transactions || []);
    } catch {
      toast.error("Erreur lors du chargement des crédits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handlePurchase = async (packId) => {
    setPurchasingId(packId);
    try {
      const res = await creditService.purchase(packId, token);
      setBalance(res.balance);
      await load();
      toast.success(res.message);
    } catch {
      toast.error("Erreur lors de l'achat");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crédits Headhunter</h1>
        <p className="text-gray-500 mt-1">
          Utilisez vos crédits pour débloquer les coordonnées des candidats dans la CVthèque.
        </p>
      </div>

      <div className="bg-[#2D5016] rounded-2xl p-6 flex items-center gap-4 text-white shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
          <Coins size={28} />
        </div>
        <div>
          <p className="text-sm text-white/70 font-medium">Solde actuel</p>
          <p className="text-3xl font-bold">{loading ? "…" : balance} crédits</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acheter des crédits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-3 shadow-sm hover:border-[#A7D129] hover:shadow-md transition"
            >
              <p className="font-bold text-gray-900">{pack.name}</p>
              <p className="text-3xl font-extrabold text-[#2D5016]">{pack.credits}<span className="text-sm font-medium text-gray-400 ml-1">crédits</span></p>
              <p className="text-sm text-gray-500">{pack.price} MAD</p>
              <button
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasingId === pack.id}
                className="mt-2 w-full py-2.5 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
              >
                {purchasingId === pack.id ? "Achat en cours..." : "Acheter"}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          💳 Paiement simulé pour le moment — les crédits sont ajoutés instantanément.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune transaction pour le moment.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const cfg = TX_LABELS[tx.type] || { label: tx.type, color: "text-gray-700 bg-gray-50" };
                const positive = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                        {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                        <p className="text-xs text-gray-400">
                          {tx.packName || "—"} · {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${positive ? "text-green-600" : "text-red-500"}`}>
                      {positive ? "+" : ""}{tx.amount}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}