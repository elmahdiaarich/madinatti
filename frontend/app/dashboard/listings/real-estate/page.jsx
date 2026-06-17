"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { realEstateService } from "@/services/realEstateService";
import ListingDrawer from "@/components/real-estate/ListingDrawer";
import ListingFilters from "@/components/real-estate/ListingFilters";

const INQUIRY_STATUS_STYLES = {
  pending: { label: "Nouveau",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  read:    { label: "Lu",       cls: "bg-gray-50 text-gray-600 border-gray-200" },
  replied: { label: "Répondu",  cls: "bg-green-50 text-green-700 border-green-200" },
  closed:  { label: "Fermé",    cls: "bg-gray-100 text-gray-400 border-gray-200" },
};

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate  = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "";

function StatusBadge({ status, map }) {
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ listings }) {
  const active       = listings.filter((l) => l.status === "APPROVED").length;
  const pending      = listings.filter((l) => l.status === "PENDING").length;
  const totalInq     = listings.reduce((sum, l) => sum + (l._count?.inquiries ?? 0), 0);
  const newInq       = listings.reduce((sum, l) => sum + (l._count?.newInquiries ?? 0), 0);

  const stats = [
    {
      label: "Annonces actives",
      value: active,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
      color: "text-green-700 bg-green-50 border-green-100",
    },
    {
      label: "En attente",
      value: pending,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: "text-yellow-700 bg-yellow-50 border-yellow-100",
    },
    {
      label: "Demandes",
      value: totalInq,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: "text-blue-700 bg-blue-50 border-blue-100",
      badge: newInq > 0 ? `${newInq} nouvelles` : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${s.color}`}
        >
          <span className="opacity-60 shrink-0">{s.icon}</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-extrabold leading-none">{s.value}</p>
              {s.badge && (
                <span className="text-[9px] font-bold bg-white/70 border border-current/20 px-1.5 py-0.5 rounded-full opacity-80 leading-none">
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium opacity-70 mt-0.5 truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inquiries drawer ─────────────────────────────────────────────────────────
function InquiriesDrawer({ listingId, onClose, token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await realEstateService.getMyListingInquiries(listingId, {}, token);
        setInquiries(res.inquiries || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId]);

  const updateStatus = async (inquiryId, status) => {
    setUpdating(inquiryId);
    try {
      await realEstateService.updateInquiryStatus(inquiryId, status, token);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Messages reçus</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chargement...</div>
        ) : inquiries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 text-gray-400">
            <span className="text-4xl">💬</span>
            <p className="font-semibold text-gray-600">Aucun message pour l'instant</p>
            <p className="text-xs">Les messages des visiteurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {inquiries.map((inq) => (
              <div key={inq.id} className={`p-5 transition ${inq.status === "pending" ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{inq.user?.name || "Anonyme"}</p>
                    <p className="text-xs text-gray-400">{fmtDate(inq.createdAt)}</p>
                  </div>
                  <StatusBadge status={inq.status} map={INQUIRY_STATUS_STYLES} />
                </div>
                <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100 mb-3 leading-relaxed">
                  {inq.message}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                  {inq.contactPhone && (
                    <a href={`tel:${inq.contactPhone}`} className="flex items-center gap-1 hover:text-primary transition">
                      📞 {inq.contactPhone}
                    </a>
                  )}
                  {inq.contactEmail && (
                    <a href={`mailto:${inq.contactEmail}`} className="flex items-center gap-1 hover:text-primary transition">
                      ✉️ {inq.contactEmail}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["read", "replied", "closed"]
                    .filter((s) => s !== inq.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(inq.id, s)}
                        disabled={updating === inq.id}
                        className="text-[11px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 font-semibold"
                      >
                        {updating === inq.id ? "..." : INQUIRY_STATUS_STYLES[s]?.label}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, onDelete, onViewInquiries, onViewDetails }) {
  const cover        = listing.images?.find((i) => i.isCover) || listing.images?.[0];
  const inquiryCount = listing._count?.inquiries || 0;

  const statusStyles = {
    APPROVED: { label: "Approuvée",  className: "bg-green-50 text-green-700 border border-green-200" },
    PENDING:  { label: "En attente", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    REJECTED: { label: "Rejetée",    className: "bg-red-50 text-red-700 border border-red-200" },
  };
  const statusStyle = statusStyles[listing.status] ?? statusStyles.PENDING;

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all ${
        listing.status === "REJECTED" && listing.adminNotes ? "sm:min-h-32" : "sm:h-32"
      }`}
      onClick={() => onViewDetails(listing)}
    >
      {/* Thumbnail */}
      <div className="relative h-32 sm:h-auto sm:w-44 sm:self-stretch shrink-0 bg-gray-50">
        {cover?.url ? (
          <img src={cover.url} alt="" className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.className}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row: title + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{listing.title}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {listing.city || "—"}
              <span className="opacity-30">·</span>
              {listing.category?.name || "—"}
            </p>
          </div>
          <p className="text-base font-semibold text-gray-900 leading-none shrink-0">
            {fmtPrice(listing.price)}{" "}
            <span className="text-xs font-normal text-gray-400">MAD</span>
          </p>
        </div>

        {/* Admin rejection note */}
        {listing.status === "REJECTED" && listing.adminNotes && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <span className="mt-px shrink-0">⛔</span>
            <span className="line-clamp-2">{listing.adminNotes}</span>
          </div>
        )}

        {/* Bottom row: stats + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {listing.viewsCount || 0}
            </span>

            {/* Messages button — mirrors "Candidatures" button style from jobs */}
            <button
              onClick={(e) => { e.stopPropagation(); onViewInquiries(listing.id); }}
              title="Voir les messages"
              className={`relative flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                inquiryCount > 0
                  ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {inquiryCount} message{inquiryCount !== 1 ? "s" : ""}
              {inquiryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {inquiryCount}
                </span>
              )}
            </button>

            <span className="text-xs text-gray-300">{fmtDate(listing.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {listing.status === "APPROVED" && (
              <Link
                href={`/real-estate/${listing.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="hidden sm:inline">Voir</span>
              </Link>
            )}
            <Link
              href={`/dashboard/listings/real-estate/edit/${listing.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">Modifier</span>
            </Link>
            <button
              onClick={() => onDelete(listing.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessDashboard() {
  return (
    <ProtectedRoute roles={["business"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [listings, setListings]       = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({});
  const [page, setPage]               = useState(1);
  const [activeInquiryListingId, setActiveInquiryListingId] = useState(null);
  const [selectedListing, setSelectedListing]               = useState(null);
  const [justCreated] = useState(searchParams.get("created") === "1");

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const loadAll = async () => {
    try {
      const res = await realEstateService.getMyListings({ page: 1, limit: 100 }, token);
      setAllListings(res.listings || []);
    } catch (e) {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await realEstateService.getMyListings(
        {
          page,
          limit: 10,
          ...(filters.status      && { status: filters.status }),
          ...(filters.city        && { city: filters.city }),
          ...(filters.listingType && { listingType: filters.listingType }),
          ...(filters.search      && { search: filters.search }),
        },
        token,
      );
      setListings(res.listings || []);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      await realEstateService.deleteMyListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.filter((l) => l.id !== id));
      if (selectedListing?.id === id) setSelectedListing(null);
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Success toast */}
        {justCreated && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700 text-sm">Annonce soumise avec succès !</p>
              <p className="text-xs text-green-600">Elle sera visible après validation par l'administrateur.</p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {allListings.length > 0 && <StatsBar listings={allListings} />}

        {/* Filters + Publish button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ListingFilters onChange={handleFiltersChange} showStatus={true} listings={listings} />
          </div>
          <Link
            href="/dashboard/listings/real-estate/create"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Publier une annonce</span>
            <span className="sm:hidden">Publier</span>
          </Link>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">🏠</span>
            <p className="font-bold text-gray-700">Aucune annonce</p>
            <p className="text-sm text-gray-400">Publiez votre première annonce immobilière.</p>
            <Link
              href="/dashboard/listings/real-estate/create"
              className="mt-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-sage transition"
            >
              Publier une annonce
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onDelete={handleDelete}
                onViewInquiries={(id) => setActiveInquiryListingId(id)}
                onViewDetails={(listing) => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                  page === i + 1
                    ? "bg-primary-dark text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary-dark"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listing detail drawer */}
      {selectedListing && (
        <ListingDrawer
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onEdit={(id) => (window.location.href = `/dashboard/listings/real-estate/edit/${id}`)}
          onDelete={(id) => { handleDelete(id); setSelectedListing(null); }}
          isAdmin={false}
        />
      )}

      {/* Inquiries drawer */}
      {activeInquiryListingId && (
        <InquiriesDrawer
          listingId={activeInquiryListingId}
          token={token}
          onClose={() => setActiveInquiryListingId(null)}
        />
      )}
    </div>
  );
}