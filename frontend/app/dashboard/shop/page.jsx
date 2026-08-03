"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Bell, Car, Copy, Eye, Heart, Megaphone, Phone, Plus, Settings, Store } from "lucide-react";
import { shopService } from "@/services/shopService";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <Icon size={18} className="text-[#2D5016]" />
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, text, href, onClick }) {
  const className = "flex min-h-[112px] flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#A7D129] hover:shadow-md";
  const content = (
    <>
      <Icon size={20} className="text-[#2D5016]" />
      <h3 className="mt-3 font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </>
  );
  if (href) return <Link href={href} className={className}>{content}</Link>;
  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

export default function ShopDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [customForm, setCustomForm] = useState({
    boutiqueDescription: "",
    boutiqueBanner: "",
    boutiquePhone: "",
    boutiqueEmail: "",
    boutiqueListingSort: "newest",
    boutiqueFeaturedListingIds: "",
  });

  useEffect(() => {
    shopService.dashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const shop = data?.currentShop;
    if (!shop) return;
    setCustomForm({
      boutiqueDescription: shop.customization?.description || shop.description || "",
      boutiqueBanner: shop.customization?.banner || shop.coverImage || "",
      boutiquePhone: shop.customization?.phone || shop.professionalPhone || "",
      boutiqueEmail: shop.customization?.email || shop.professionalEmail || "",
      boutiqueListingSort: shop.customization?.listingSort || "newest",
      boutiqueFeaturedListingIds: (shop.customization?.featuredListingIds || []).join("\n"),
    });
  }, [data?.currentShop?.id]);

  const updateCustom = (key, value) => setCustomForm((prev) => ({ ...prev, [key]: value }));

  const saveCustomization = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await shopService.updateAccountBoutique(customForm);
      setData((prev) => ({ ...prev, currentShop: res.data, shops: [res.data, ...(prev?.shops || []).filter((item) => item.id !== res.data.id)] }));
      setMessage("Boutique mise a jour. Les visiteurs voient maintenant vos nouveaux contenus.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Modification boutique impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6 text-sm text-gray-500">Chargement...</main>;
  const shop = data?.currentShop;
  if (!shop) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <Store className="mx-auto text-[#2D5016]" size={42} />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Aucune boutique active</h1>
          <p className="mt-2 text-sm text-gray-500">Activez un plan PRO ou creez une boutique professionnelle pour afficher le badge et la page publique.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/subscription" className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Activer un plan PRO</Link>
            <Link href="/dashboard/shop/create" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"><Store size={16} /> Creer une boutique</Link>
          </div>
        </div>
      </main>
    );
  }

  const publicUrl = `/boutiques/${shop.slug}`;
  const plan = shop.subscription?.plan || {};
  const limit = plan.listingLimit || plan.maxListings || 0;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espace boutique PRO</h1>
          <p className="text-sm text-gray-500">{shop.name} · {plan.name || "Plan actif"}</p>
        </div>
        <div className="flex gap-2">
          <Link href={publicUrl} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Previsualiser</Link>
          <Link href="/dashboard/subscription" className="rounded-xl bg-[#2D5016] px-4 py-2 text-sm font-semibold text-white">Abonnement</Link>
        </div>
      </div>

      {message && <div className="mb-4 rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0] p-3 text-sm text-[#2D5016]">{message}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Megaphone} label="Annonces actives" value={shop.stats.activeListings} />
        <Stat icon={Bell} label="A corriger ou expirees" value={shop.stats.expiredListings} />
        <Stat icon={Eye} label="Vues" value={shop.stats.views} />
        <Stat icon={Phone} label="Contacts" value={shop.stats.contacts} />
        <Stat icon={Heart} label="Favoris" value={shop.stats.favorites} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Actions utiles</h2>
          <p className="mt-2 text-sm text-gray-500">Votre plan PRO affiche le badge boutique et regroupe les annonces du compte sur une page publique.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ActionCard icon={Car} title="Publier un vehicule" text="Creer une annonce auto avec votre badge boutique." href="/dashboard/listings/cars/create" />
            <ActionCard icon={Megaphone} title="Gerer mes annonces" text="Voir, corriger ou relancer vos annonces existantes." href="/dashboard/listings/cars" />
            <ActionCard icon={Settings} title="Profil entreprise" text="Modifier le nom, le logo, le telephone et le site web." href="/dashboard/company" />
            <ActionCard
              icon={Copy}
              title="Copier le lien boutique"
              text={publicUrl}
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}${publicUrl}`);
                setMessage("Lien de boutique copie.");
              }}
            />
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Plan business</h2>
          <p className="mt-2 text-sm text-gray-500">Statut : {shop.status} · Abonnement : {shop.subscription?.status || "Aucun"}</p>
          <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p>Limite annonces : <strong className="text-gray-900">{limit}</strong></p>
            <p>Badge public : <strong className="text-gray-900">{shop.isVerified ? "Actif" : "Non actif"}</strong></p>
            <p>Page publique : <strong className="break-all text-[#2D5016]">{publicUrl}</strong></p>
          </div>
          <button onClick={() => setMessage("Les statistiques detaillees arrivent ici: vues par annonce, contacts, favoris et conversions.")} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
            <BarChart3 size={15} />
            Voir les statistiques
          </button>
        </section>
      </div>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900">Personnaliser ma boutique publique</h2>
          <p className="mt-1 text-sm text-gray-500">Ces informations apparaissent sur la page boutique PRO visible par les visiteurs.</p>
        </div>
        <form onSubmit={saveCustomization} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-gray-700">Description boutique</span>
            <textarea
              value={customForm.boutiqueDescription}
              onChange={(e) => updateCustom("boutiqueDescription", e.target.value)}
              rows={4}
              maxLength={700}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
              placeholder="Ex: Nous sommes specialistes de l'achat-vente de voitures d'occasion a Kenitra..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Image banniere URL</span>
            <input
              value={customForm.boutiqueBanner}
              onChange={(e) => updateCustom("boutiqueBanner", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
              placeholder="https://..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Tri par defaut</span>
            <select
              value={customForm.boutiqueListingSort}
              onChange={(e) => updateCustom("boutiqueListingSort", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
            >
              <option value="newest">Plus recentes</option>
              <option value="views">Plus vues</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix decroissant</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Telephone public</span>
            <input
              value={customForm.boutiquePhone}
              onChange={(e) => updateCustom("boutiquePhone", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
              placeholder="06 00 00 00 00"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Email public</span>
            <input
              value={customForm.boutiqueEmail}
              onChange={(e) => updateCustom("boutiqueEmail", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
              placeholder="contact@entreprise.ma"
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-bold text-gray-700">Annonces a mettre en haut</span>
            <textarea
              value={customForm.boutiqueFeaturedListingIds}
              onChange={(e) => updateCustom("boutiqueFeaturedListingIds", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2D5016]"
              placeholder="Collez les IDs des annonces, une par ligne, dans l'ordre voulu."
            />
          </label>
          <div className="flex justify-end lg:col-span-2">
            <button disabled={saving} className="rounded-xl bg-[#2D5016] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
              {saving ? "Enregistrement..." : "Enregistrer la personnalisation"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
