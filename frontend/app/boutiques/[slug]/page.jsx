"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Store,
} from "lucide-react";
import { shopService } from "@/services/shopService";

function listingHref(item) {
  if (item.module === "cars") return `/cars/${item.slug || item.id}`;
  if (item.module === "real-estate") return `/real-estate/${item.slug || item.id}`;
  if (item.module === "jobs") return `/jobs/${item.id}`;
  return "#";
}

function listingImage(item) {
  const first = Array.isArray(item.images) ? item.images.find((img) => img?.isCover) || item.images[0] : null;
  if (typeof first === "string") return first;
  return first?.url || item.companyLogo || null;
}

function listingPrice(item) {
  if (item.price === null || item.price === undefined || Number(item.price) <= 0) return "Prix sur demande";
  return `${Number(item.price).toLocaleString("fr-MA")} MAD`;
}

function moduleLabel(module) {
  if (module === "cars") return "Vehicule";
  if (module === "real-estate") return "Immobilier";
  if (module === "jobs") return "Emploi";
  return "Annonce";
}

function ListingBadge({ item }) {
  if (item.isSponsored) return <span className="rounded-full bg-[#2D5016] px-2.5 py-1 text-[11px] font-bold text-white">Sponsorise</span>;
  if (item.isFeatured) return <span className="rounded-full bg-[#E8F5D0] px-2.5 py-1 text-[11px] font-bold text-[#2D5016]">Mis en avant</span>;
  return null;
}

export default function PublicShopPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [moduleFilter, setModuleFilter] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    shopService.publicShop(slug)
      .then((res) => {
        setShop(res.data);
        if (res.data?.customization?.listingSort) setSort(res.data.customization.listingSort);
      })
      .catch((err) => setError(err.response?.data?.message || "Boutique introuvable."))
      .finally(() => setLoading(false));
  }, [slug]);

  const listings = useMemo(() => {
    const items = shop?.listings || [];
    return items
      .filter((item) => !moduleFilter || item.module === moduleFilter)
      .sort((a, b) => {
        if (sort === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
        if (sort === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
        if (sort === "views") return Number(b.viewsCount || 0) - Number(a.viewsCount || 0);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [shop, moduleFilter, sort]);

  if (loading) return <main className="p-6 text-sm text-gray-500">Chargement...</main>;
  if (error || !shop) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">{error || "Boutique introuvable."}</div>
      </main>
    );
  }

  const phone = shop.professionalPhone;
  const email = shop.professionalEmail;
  const whatsapp = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${shop.name}, je vous contacte depuis votre boutique Madinatti.`)}` : null;
  const publicUrl = typeof window !== "undefined" ? window.location.href : `/boutiques/${shop.slug}`;

  return (
    <main className="min-h-screen bg-[#F6F8F3] pb-12">
      <section className="relative bg-white">
        <div className="absolute inset-x-0 top-0 h-56 bg-[#2D5016]" />
        <div
          className="relative h-56 overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(167,209,41,.18) 25%, transparent 25%), linear-gradient(225deg, rgba(232,245,208,.18) 25%, transparent 25%), linear-gradient(315deg, rgba(167,209,41,.18) 25%, transparent 25%), linear-gradient(45deg, rgba(232,245,208,.18) 25%, transparent 25%)",
            backgroundSize: "58px 58px",
            backgroundPosition: "0 0, 0 29px, 29px -29px, -29px 0",
          }}
        >
          {shop.coverImage && <img src={shop.coverImage} alt="" className="h-full w-full object-cover opacity-90" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-7">
          <div className="-mt-16 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F6F8F3] shadow">
                  {shop.logo ? <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover" /> : <Store size={42} className="text-[#2D5016]" />}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-extrabold text-gray-950 sm:text-3xl">{shop.name}</h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5D0] px-3 py-1 text-xs font-extrabold text-[#2D5016]">
                      <Store size={13} />
                      Boutique
                    </span>
                    {shop.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                        <BadgeCheck size={13} />
                        Verifiee
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{shop.description || "Boutique professionnelle Madinatti."}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                    {shop.city && <span className="inline-flex items-center gap-1"><MapPin size={15} /> {shop.city}</span>}
                    {shop.website && <a href={shop.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2D5016]"><Globe size={15} /> Site internet</a>}
                    <span>{shop.activeListingsCount || listings.length} annonces actives</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100" aria-label="WhatsApp"><MessageCircle size={20} /></a>}
                {phone && <a href={`tel:${phone}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2D5016] px-4 text-sm font-extrabold text-white hover:bg-[#1f3a0f]"><Phone size={16} /> Contacter</a>}
                {email && <a href={`mailto:${email}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"><Mail size={16} /> Email</a>}
                <button onClick={() => { navigator.clipboard?.writeText(publicUrl); setMessage("Lien boutique copie."); }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#2D5016] px-4 text-sm font-bold text-[#2D5016] hover:bg-[#E8F5D0]"><Share2 size={16} /> Partager</button>
              </div>
            </div>
          </div>
          {message && <div className="mt-4 rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0] p-3 text-sm text-[#2D5016]">{message}</div>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7">
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-gray-950">Annonces de {shop.name}</h2>
              <p className="mt-1 text-sm text-gray-500">Parcourez les annonces publiees par cette boutique professionnelle.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                <option value="">Toutes</option>
                <option value="cars">Vehicules</option>
                <option value="real-estate">Immobilier</option>
                <option value="jobs">Emploi</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm">
                <option value="newest">Plus recentes</option>
                <option value="views">Plus vues</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
              </select>
            </div>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500">Cette boutique n'a aucune annonce active pour ce filtre.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((item) => {
              const image = listingImage(item);
              return (
                <Link key={`${item.module}-${item.id}`} href={listingHref(item)} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {image ? <img src={image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <Store className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" size={48} />}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#2D5016] backdrop-blur">{moduleLabel(item.module)}</span>
                      <ListingBadge item={item} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 min-h-[44px] text-base font-extrabold leading-snug text-gray-950">{item.title}</h3>
                    <p className="mt-2 text-lg font-extrabold text-[#2D5016]">{listingPrice(item)}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span className="truncate">{item.city || item.location || shop.city || "Maroc"}</span>
                      <span>{Number(item.viewsCount || 0)} vues</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-gray-700">
                        <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#E8F5D0]">
                          {shop.logo && <img src={shop.logo} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="truncate">{shop.name}</span>
                      </span>
                      <ExternalLink size={15} className="shrink-0 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
