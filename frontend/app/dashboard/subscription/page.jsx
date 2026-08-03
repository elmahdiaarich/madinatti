"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Building2, Check, CreditCard, Loader2, ShieldCheck, Star, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { paymentMethods, planComparisonRows, unifiedPlans } from "@/constants/pricingPlans";
import { subscriptionService } from "@/services/subscriptionService";

const METHOD_ICONS = {
  card: CreditCard,
  bank_transfer: Building2,
  cash: Banknote,
};

const emptyPayment = {
  paymentMethod: "card",
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  reference: "",
  phone: "",
};

export default function SubscriptionPage() {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeSubscription, setActiveSubscription] = useState(user?.subscription || null);
  const [selectedPlanId, setSelectedPlanId] = useState(user?.subscription?.planId || "pro");
  const [selectedDurationDays, setSelectedDurationDays] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedPlan = useMemo(
    () => unifiedPlans.find((plan) => plan.id === selectedPlanId) || unifiedPlans[0],
    [selectedPlanId],
  );
  const selectedBillingOption = useMemo(
    () => selectedPlan.billingOptions?.find((option) => option.days === selectedDurationDays) || selectedPlan.billingOptions?.[0],
    [selectedPlan, selectedDurationDays],
  );
  const currentPlanId = activeSubscription?.planId || user?.subscription?.planId || "gratuit";

  useEffect(() => {
    setSelectedDurationDays((current) => {
      const options = selectedPlan.billingOptions || [];
      if (options.some((option) => option.days === current)) return current;
      return options[0]?.days || selectedPlan.durationDays;
    });
  }, [selectedPlan]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;
    subscriptionService
      .getMine(token)
      .then((subscription) => {
        if (!mounted) return;
        setActiveSubscription(subscription);
        if (subscription?.planId) setSelectedPlanId(subscription.planId);
      })
      .catch(() => {
        if (mounted) setActiveSubscription(user?.subscription || null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, user?.subscription]);

  const updatePayment = (field, value) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!selectedPlan || submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        planId: selectedPlan.id,
        durationDays: selectedBillingOption?.days || selectedPlan.durationDays,
        ...payment,
      };
      const json = await subscriptionService.checkout(payload, token);
      setActiveSubscription(json.data);
      setSelectedPlanId(json.data.planId);
      updateUser?.({ ...user, subscription: json.data });
      toast.success("Abonnement activé avec succès.", { title: "Paiement confirmé" });
    } catch (error) {
      toast.error(error.message || "Paiement impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#2D5016]">Abonnement et paiement</h1>
            <p className="text-sm text-gray-500 mt-1">
              Choisissez une offre, renseignez le paiement et activez le plan du compte Business.
            </p>
          </div>
          <CurrentPlanBanner planId={currentPlanId} loading={loading} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <PlanComparison
          currentPlanId={currentPlanId}
          selectedPlanId={selectedPlanId}
          onSelect={setSelectedPlanId}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
          <MobilePlanCards
            currentPlanId={currentPlanId}
            selectedPlanId={selectedPlanId}
            onSelect={setSelectedPlanId}
          />
          <div className="xl:col-start-2">
            <PaymentPanelV2
              plan={selectedPlan}
              billingOption={selectedBillingOption}
              selectedDurationDays={selectedDurationDays}
              onDurationChange={setSelectedDurationDays}
              payment={payment}
              onChange={updatePayment}
              onSubmit={handleCheckout}
              submitting={submitting}
              isCurrent={selectedPlan.id === currentPlanId}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoBlock
            title="Activation"
            text="Le plan gratuit s'active directement. Les plans payants créent un abonnement actif après validation du paiement."
          />
          <InfoBlock
            title="Quotas"
            text="Les annonces actives sont comptées sur l'ensemble des modules Business: emploi, immobilier, voitures, santé et événements."
          />
          <InfoBlock
            title="Admin"
            text="Le plan actif apparaît dans la liste des entreprises côté administration."
          />
        </div>
      </div>
    </div>
  );
}

function CurrentPlanBanner({ planId, loading }) {
  const plan = unifiedPlans.find((item) => item.id === planId) || unifiedPlans[0];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#A7D129]/40 bg-[#E8F5D0] min-w-[240px]">
      <div className="w-9 h-9 rounded-lg bg-[#A7D129] text-[#1a3a00] flex items-center justify-center shrink-0">
        <ShieldCheck size={18} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a7a20]">Plan actuel</p>
        <p className="text-sm font-extrabold text-[#2D5016]">
          {loading ? "Chargement..." : plan.label}
          {!loading && plan.price > 0 && (
            <span className="text-xs font-medium text-[#4a7a20] ml-1">
              des {Math.min(...(plan.billingOptions || [{ dailyPrice: 0 }]).map((option) => option.dailyPrice)).toFixed(1)} DH/j
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function PlanComparison({ currentPlanId, selectedPlanId, onSelect }) {
  return (
    <div className="hidden xl:block bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold text-gray-900">Choisissez votre plan</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-[190px] px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                Offre
              </th>
              {unifiedPlans.map((plan) => (
                <th
                  key={plan.id}
                  className={`px-4 py-3 text-center font-extrabold text-gray-800 ${plan.recommended ? "bg-[#E8F5D0]/60" : ""}`}
                >
                  <div className="min-h-[42px] flex flex-col items-center justify-center">
                    <span>{plan.label}</span>
                    {plan.recommended && (
                      <span className="text-[11px] font-bold text-[#2D5016]">Populaire</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planComparisonRows.map((row) => (
              <tr key={row.key} className="border-b border-gray-100 last:border-b-0">
                <td className="px-5 py-3 font-semibold text-gray-700">{row.label}</td>
                {unifiedPlans.map((plan) => (
                  <td
                    key={`${row.key}-${plan.id}`}
                    className={`px-4 py-3 text-center text-gray-700 ${plan.recommended ? "bg-[#E8F5D0]/30" : ""}`}
                  >
                    {row.key === "cta" ? (
                      <button
                        onClick={() => onSelect(plan.id)}
                        className={`min-w-[130px] px-3 py-2 rounded-md text-xs font-bold transition
                          ${selectedPlanId === plan.id
                            ? "bg-[#2D5016] text-white"
                            : "border border-gray-200 text-gray-700 hover:border-[#2D5016] hover:text-[#2D5016]"
                          }`}
                      >
                        {plan.id === currentPlanId ? "Plan actuel" : plan.cta}
                      </button>
                    ) : (
                      <span className={row.key === "price" ? "font-extrabold text-gray-900" : ""}>
                        {row.format ? row.format(plan) : plan[row.key]}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobilePlanCards({ currentPlanId, selectedPlanId, onSelect }) {
  return (
    <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
      {unifiedPlans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          className={`text-left bg-white border rounded-lg p-5 transition
            ${selectedPlanId === plan.id
              ? "border-[#2D5016] ring-2 ring-[#A7D129]/30"
              : "border-gray-100 hover:border-[#A7D129]"
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold text-[#2D5016]">
                {plan.label}
                {plan.recommended && <span className="ml-2 text-xs text-[#7BA428]">Populaire</span>}
              </p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">
                {plan.price === 0 ? "0" : `Des ${Math.min(...plan.billingOptions.map((option) => option.dailyPrice)).toFixed(1)}`}
                <span className="text-xs font-semibold text-gray-400 ml-1">
                  {plan.price === 0 ? " MAD" : " DH/j"}
                </span>
              </p>
              {plan.stars > 0 && <PlanStars count={plan.stars} />}
            </div>
            {plan.id === currentPlanId && (
              <span className="px-2 py-1 rounded-md bg-[#E8F5D0] text-[#2D5016] text-[11px] font-bold">
                Actuel
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <div key={feature.text} className="flex items-start gap-2 text-sm text-gray-600">
                {feature.included ? (
                  <Check size={15} className="mt-0.5 text-[#7BA428] shrink-0" />
                ) : (
                  <X size={15} className="mt-0.5 text-gray-300 shrink-0" />
                )}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function PaymentPanel({ plan, payment, onChange, onSubmit, submitting, isCurrent }) {
  const isFree = plan.price === 0;

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 sticky top-[78px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Paiement</p>
          <h2 className="text-lg font-extrabold text-gray-900 mt-1">{plan.label}</h2>
          <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-[#2D5016]">{plan.price} MAD</p>
          {plan.period && <p className="text-xs text-gray-400">par mois</p>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Annonces" value={plan.activeListings} />
        <Metric label="Durée" value={`${plan.durationDays} j`} />
        <Metric label="Utilisateurs" value={plan.users} />
        <Metric label="Boosts/mois" value={plan.boostsPerMonth || "—"} />
      </div>

      {!isFree && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {paymentMethods.map((method) => {
              const Icon = METHOD_ICONS[method.id] || CreditCard;
              const active = payment.paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onChange("paymentMethod", method.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition
                    ${active ? "border-[#2D5016] bg-[#E8F5D0]/60" : "border-gray-200 hover:border-[#A7D129]"}`}
                >
                  <span className="w-9 h-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-[#2D5016] shrink-0">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-gray-900">{method.label}</span>
                    <span className="block text-xs text-gray-500">{method.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {payment.paymentMethod === "card" && (
            <div className="grid grid-cols-1 gap-3">
              <Input label="Titulaire" value={payment.cardholderName} onChange={(value) => onChange("cardholderName", value)} />
              <Input label="Numéro de carte" value={payment.cardNumber} onChange={(value) => onChange("cardNumber", value)} inputMode="numeric" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="MM/AA" value={payment.expiry} onChange={(value) => onChange("expiry", value)} placeholder="08/29" />
                <Input label="CVC" value={payment.cvc} onChange={(value) => onChange("cvc", value)} inputMode="numeric" />
              </div>
            </div>
          )}

          {payment.paymentMethod === "bank_transfer" && (
            <Input
              label="Référence du virement"
              value={payment.reference}
              onChange={(value) => onChange("reference", value)}
              placeholder="REF-123456"
            />
          )}

          {payment.paymentMethod === "cash" && (
            <Input
              label="Téléphone de suivi"
              value={payment.phone}
              onChange={(value) => onChange("phone", value)}
              placeholder="+212 ..."
            />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || isCurrent}
        className={`mt-5 w-full h-11 rounded-lg text-sm font-extrabold flex items-center justify-center gap-2 transition
          ${isCurrent
            ? "bg-gray-100 text-gray-400 cursor-default"
            : "bg-[#2D5016] text-white hover:bg-[#3d6b1e]"
          }`}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {isCurrent ? "Plan déjà actif" : isFree ? "Activer gratuitement" : "Confirmer le paiement"}
      </button>

      <p className="text-[11px] text-gray-400 leading-relaxed mt-3">
        Les informations de carte ne sont pas stockées par l'application. Seule la référence du paiement et
        l'abonnement actif sont conservés.
      </p>
    </div>
  );
}

function PaymentPanelV2({ plan, billingOption, selectedDurationDays, onDurationChange, payment, onChange, onSubmit, submitting, isCurrent }) {
  const isFree = plan.price === 0;
  const totalPrice = billingOption?.price ?? plan.price;

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 sticky top-[78px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Paiement</p>
          <h2 className="text-lg font-extrabold text-gray-900 mt-1">{plan.label}</h2>
          <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
          {plan.stars > 0 && <PlanStars count={plan.stars} />}
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-[#2D5016]">{totalPrice} MAD</p>
          {billingOption && <p className="text-xs text-gray-400">{billingOption.priceLabel}</p>}
        </div>
      </div>

      {plan.billingOptions?.length > 1 && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Duree</p>
          <div className="grid grid-cols-3 gap-2">
            {plan.billingOptions.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => onDurationChange(option.days)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  selectedDurationDays === option.days
                    ? "border-[#2D5016] bg-[#E8F5D0]"
                    : "border-gray-200 hover:border-[#A7D129]"
                }`}
              >
                <span className="block text-sm font-extrabold text-gray-900">{option.days}j</span>
                <span className="block text-xs font-semibold text-[#2D5016]">{option.priceLabel}</span>
                {option.originalPriceLabel && <span className="block text-[11px] text-gray-400 line-through">{option.originalPriceLabel}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Annonces" value={plan.activeListings} />
        <Metric label="Duree" value={`${billingOption?.days || plan.durationDays} j`} />
        <Metric label="Utilisateurs" value={plan.users} />
        <Metric label="Boosts" value={plan.boostsPerMonth || "-"} />
      </div>

      {!isFree && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {paymentMethods.map((method) => {
              const Icon = METHOD_ICONS[method.id] || CreditCard;
              const active = payment.paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onChange("paymentMethod", method.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${active ? "border-[#2D5016] bg-[#E8F5D0]/60" : "border-gray-200 hover:border-[#A7D129]"}`}
                >
                  <span className="w-9 h-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-[#2D5016] shrink-0">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-gray-900">{method.label}</span>
                    <span className="block text-xs text-gray-500">{method.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {payment.paymentMethod === "card" && (
            <div className="grid grid-cols-1 gap-3">
              <Input label="Titulaire" value={payment.cardholderName} onChange={(value) => onChange("cardholderName", value)} />
              <Input label="Numero de carte" value={payment.cardNumber} onChange={(value) => onChange("cardNumber", value)} inputMode="numeric" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="MM/AA" value={payment.expiry} onChange={(value) => onChange("expiry", value)} placeholder="08/29" />
                <Input label="CVC" value={payment.cvc} onChange={(value) => onChange("cvc", value)} inputMode="numeric" />
              </div>
            </div>
          )}

          {payment.paymentMethod === "bank_transfer" && (
            <Input label="Reference du virement" value={payment.reference} onChange={(value) => onChange("reference", value)} placeholder="REF-123456" />
          )}

          {payment.paymentMethod === "cash" && (
            <Input label="Telephone de suivi" value={payment.phone} onChange={(value) => onChange("phone", value)} placeholder="+212 ..." />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || isCurrent}
        className={`mt-5 w-full h-11 rounded-lg text-sm font-extrabold flex items-center justify-center gap-2 transition ${isCurrent ? "bg-gray-100 text-gray-400 cursor-default" : "bg-[#2D5016] text-white hover:bg-[#3d6b1e]"}`}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {isCurrent ? "Plan deja actif" : isFree ? "Activer gratuitement" : "Confirmer le paiement"}
      </button>

      <p className="text-[11px] text-gray-400 leading-relaxed mt-3">
        Les informations de carte ne sont pas stockees par l'application. Seule la reference du paiement et l'abonnement actif sont conserves.
      </p>
    </div>
  );
}

function PlanStars({ count }) {
  return (
    <div className="flex items-center gap-0.5 mt-1 text-[#FF8C42]" aria-label={`${count} etoiles`}>
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} size={13} fill="currentColor" strokeWidth={1.5} />
      ))}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-extrabold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "", inputMode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gray-500 mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#A7D129]/30"
      />
    </label>
  );
}

function InfoBlock({ title, text }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <p className="text-sm font-extrabold text-[#2D5016]">{title}</p>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
