"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { creditService } from "@/services/creditService";
import { useToast } from "@/context/ToastContext";
import { Coins, ArrowUpRight, ArrowDownRight, ShieldCheck, Mail } from "lucide-react";

const TX_LABELS = {
  PURCHASE: { label: "Achat de pack", color: "text-green-700 bg-green-50" },
  UNLOCK:   { label: "Déblocage candidat", color: "text-blue-700 bg-blue-50" },
  REFUND:   { label: "Remboursement", color: "text-yellow-700 bg-yellow-50" },
};

// Prix par pack — même valeurs que le backend, utilisées ici uniquement pour
// calculer le total dépensé affiché (les transactions n'ont pas de prix
// historisé pour l'instant, voir CreditTransaction.packId).
const PACK_PRICES = { pack_20: 3000, pack_30: 5000, pack_50: 7000 };

function monthLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function ConfirmPurchaseModal({ pack, onConfirm, onCancel, confirming }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <p className="text-base font-bold text-gray-900 mb-1">Confirmer l'achat</p>
        <p className="text-sm text-gray-500 mb-5">
          Vous êtes sur le point d'ajouter <span className="font-bold text-gray-800">{pack.credits} crédits</span> pour <span className="font-bold text-gray-800">{pack.price.toLocaleString("fr-MA")} MAD</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#3a6b1e] transition disabled:opacity-60"
          >
            {confirming ? "Achat en cours..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [packs, setPacks] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [confirmingPack, setConfirmingPack] = useState(null);

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

  const handleConfirmPurchase = async () => {
    if (!confirmingPack) return;
    const pack = confirmingPack;
    setPurchasingId(pack.id);
    try {
      const res = await creditService.purchase(pack.id, token);
      setConfirmingPack(null);
      await load();
      toast.success(`${pack.credits} crédits ajoutés · Nouveau solde : ${res.balance} crédits`);
    } catch {
      toast.error("Erreur lors de l'achat");
    } finally {
      setPurchasingId(null);
    }
  };

  // Meilleure valeur = coût par crédit le plus bas parmi les packs
  const bestValueId = packs.length > 0
    ? packs.reduce((best, p) => (p.price / p.credits < best.price / best.credits ? p : best), packs[0]).id
    : null;

  const totalSpent = transactions
    .filter((t) => t.type === "PURCHASE")
    .reduce((sum, t) => sum + (PACK_PRICES[t.packId] || 0), 0);

  // Regroupement par mois pour l'historique
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const key = monthLabel(tx.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crédits Headhunter</h1>
        <p className="text-gray-500 mt-1">
          Utilisez vos crédits pour débloquer les coordonnées des candidats dans la CVthèque.
        </p>
      </div>

      {/* Balance + total dépensé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#2D5016] rounded-2xl p-6 flex items-center gap-4 text-white shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <Coins size={28} />
          </div>
          <div>
            <p className="text-sm text-white/70 font-medium">Solde actuel</p>
            <p className="text-3xl font-bold">{loading ? "…" : balance} crédits</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 flex items-center gap-4 border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-[#E8F5D0] flex items-center justify-center">
            <ArrowUpRight size={28} className="text-[#2D5016]" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Dépensé depuis le début</p>
            <p className="text-3xl font-bold text-gray-900">{loading ? "…" : totalSpent.toLocaleString("fr-MA")} MAD</p>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acheter des crédits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map((pack) => {
            const isBestValue = pack.id === bestValueId;
            const perCredit = Math.round(pack.price / pack.credits);
            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl p-6 flex flex-col gap-3 shadow-sm transition ${
                  isBestValue
                    ? "bg-white border-2 border-[#A7D129]"
                    : "bg-white border border-gray-100 hover:border-[#A7D129] hover:shadow-md"
                }`}
              >
                {isBestValue && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full bg-[#A7D129] text-[#173404]">
                    Meilleure valeur
                  </span>
                )}
                <p className="font-bold text-gray-900 mt-1">{pack.name}</p>
                <p className="text-3xl font-extrabold text-[#2D5016]">
                  {pack.credits}<span className="text-sm font-medium text-gray-400 ml-1">crédits</span>
                </p>
                <p className="text-sm text-gray-500">{pack.price.toLocaleString("fr-MA")} MAD</p>
                <p className="text-xs text-gray-400">soit {perCredit} MAD / CV</p>
                <button
                  onClick={() => setConfirmingPack(pack)}
                  disabled={purchasingId === pack.id}
                  className="mt-2 w-full py-2.5 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
                >
                  {purchasingId === pack.id ? "Achat en cours..." : "Acheter"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} /> Vos crédits n'expirent jamais.
          </span>
          <span className="hidden sm:inline">·</span>
          <span>💳 Paiement simulé pour le moment — les crédits sont ajoutés instantanément.</span>
        </div>

        <a
          href="mailto:contact@madinatti.ma?subject=Besoin%20d'un%20pack%20de%20cr%C3%A9dits%20personnalis%C3%A9"
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#2D5016] hover:underline w-fit"
        >
          <Mail size={15} /> Besoin de plus de 50 CV/mois ? Contactez-nous pour une offre sur-mesure
        </a>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historique</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Chargement...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune transaction pour le moment.</div>
          ) : (
            Object.entries(groupedTransactions).map(([month, txs]) => (
              <div key={month}>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide capitalize">{month}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {txs.map((tx) => {
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
              </div>
            ))
          )}
        </div>
      </div>

      {confirmingPack && (
        <ConfirmPurchaseModal
          pack={confirmingPack}
          confirming={purchasingId === confirmingPack.id}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setConfirmingPack(null)}
        />
      )}
    </div>
  );
}