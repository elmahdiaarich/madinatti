"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { realEstateService } from "@/services/realEstateService";
import ListingDrawer from "@/components/real-estate/ListingDrawer";
import ListingFilters from "@/components/real-estate/ListingFilters";

const STATUS_STYLES = {
  PENDING: {
    label: "En attente",
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  APPROVED: {
    label: "Approuvée",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  REJECTED: { label: "Rejetée", cls: "bg-red-50 text-red-700 border-red-200" },
};

const INQUIRY_STATUS_STYLES = {
  pending: {
    label: "Nouveau",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  read: { label: "Lu", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  replied: {
    label: "Répondu",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  closed: { label: "Fermé", cls: "bg-gray-100 text-gray-400 border-gray-200" },
};

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

function StatusBadge({ status, map }) {
  const s = map[status] || {
    label: status,
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─── Inquiries drawer ─────────────────────────────────────────────────────────
function InquiriesDrawer({ listingId, onClose, token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await realEstateService.getMyListingInquiries(
          listingId,
          {},
          token,
        );
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
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Chargement...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 text-gray-400">
            <span className="text-4xl">💬</span>
            <p className="font-semibold text-gray-600">
              Aucun message pour l'instant
            </p>
            <p className="text-xs">
              Les messages des visiteurs apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className={`p-5 transition ${inq.status === "pending" ? "bg-blue-50/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {inq.user?.name || "Anonyme"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(inq.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={inq.status}
                    map={INQUIRY_STATUS_STYLES}
                  />
                </div>
                <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100 mb-3 leading-relaxed">
                  {inq.message}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                  {inq.contactPhone && (
                    <a
                      href={`tel:${inq.contactPhone}`}
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
                      📞 {inq.contactPhone}
                    </a>
                  )}
                  {inq.contactEmail && (
                    <a
                      href={`mailto:${inq.contactEmail}`}
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
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
                        {updating === inq.id
                          ? "..."
                          : INQUIRY_STATUS_STYLES[s]?.label}
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
  const cover = listing.images?.find((i) => i.isCover) || listing.images?.[0];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-primary/30 hover:shadow-md transition"
      onClick={() => onViewDetails(listing)}
    >
      {/* Thumbnail */}
      <div className="w-full sm:w-32 h-32 bg-gray-100 shrink-0">
        {cover?.url ? (
          <img src={cover.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            🏠
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-800 text-sm line-clamp-1">
            {listing.title}
          </p>
          <StatusBadge status={listing.status} map={STATUS_STYLES} />
        </div>
        <p className="text-primary-dark font-extrabold text-base">
          {fmtPrice(listing.price)} MAD
        </p>
        <p className="text-xs text-gray-400">
          {listing.city || "—"} · {listing.category?.name || "—"}
        </p>
        {listing.status === "REJECTED" && listing.adminNotes && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mt-1">
            ⛔ Note admin: {listing.adminNotes}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-400">
            {listing.viewsCount || 0} vue{listing.viewsCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-400">
            {listing._count?.inquiries || 0} message
            {listing._count?.inquiries !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-400">
            {fmtDate(listing.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions — stop propagation so clicks don't open drawer */}
      <div
        className="flex sm:flex-col gap-2 p-4 shrink-0 justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {listing.status === "APPROVED" && (
          <Link
            href={`/real-estate/${listing.id}`}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-semibold text-center"
          >
            Voir
          </Link>
        )}
        <Link
          href={`/my-space/services/real-estate/edit/${listing.id}`}
          className="text-xs px-3 py-1.5 rounded-xl border border-primary text-primary-dark hover:bg-primary-mint transition font-semibold text-center"
        >
          Modifier
        </Link>
        <button
          onClick={() => onViewInquiries(listing.id)}
          className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition font-semibold relative"
        >
          Messages
          {listing._count?.inquiries > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {listing._count.inquiries}
            </span>
          )}
        </button>
        <button
          onClick={() => onDelete(listing.id)}
          className="text-xs px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition font-semibold"
        >
          Supprimer
        </button>
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
  const router = { push: (path) => (window.location.href = path) };
  const searchParams = useSearchParams();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [activeInquiryListingId, setActiveInquiryListingId] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [justCreated] = useState(searchParams.get("created") === "1");

  useEffect(() => {
    load();
  }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await realEstateService.getMyListings(
        {
          page,
          limit: 10,
          ...(filters.status && { status: filters.status }),
          ...(filters.city && { city: filters.city }),
          ...(filters.listingType && { listingType: filters.listingType }),
          ...(filters.search && { search: filters.search }),
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
      // close drawer if the deleted listing was open
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">
            Mes annonces
          </h1>
          <Link
            href="/my-space/services/real-estate/create"
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition"
          >
            + Nouvelle annonce
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Success toast */}
        {justCreated && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700 text-sm">
                Annonce soumise avec succès !
              </p>
              <p className="text-xs text-green-600">
                Elle sera visible après validation par l'administrateur.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <ListingFilters
          onChange={handleFiltersChange}
          showStatus={true}
          listings={listings}
        />
        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">🏠</span>
            <p className="font-bold text-gray-700">Aucune annonce</p>
            <p className="text-sm text-gray-400">
              Publiez votre première annonce immobilière.
            </p>
            <Link
              href="/my-space/services/real-estate/create"
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
          onEdit={(id) => (window.location.href = `/my-space/services/real-estate/edit/[id]${id}`)}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedListing(null);
          }}
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
