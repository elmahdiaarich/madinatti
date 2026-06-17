"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Briefcase, Home, Mail, Users, ArrowRight, Edit2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_CONFIG = {
  APPROVED: { label: "Actif",      color: "bg-green-100 text-green-700" },
  PENDING:  { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  REJECTED: { label: "Refusé",     color: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, colorClass, bgColorClass, href }) {
  const content = (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center shadow-sm hover:border-[#A7D129] hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${bgColorClass} ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function DashboardPage() {
  const { token, user } = useAuth();

  const [stats, setStats] = useState({
    activeJobs: 0,
    activeRealEstate: 0,
    totalApplications: 0,
    unreadMessages: 0,
  });

  const [latestJobs, setLatestJobs] = useState([]);
  const [latestRealEstate, setLatestRealEstate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(false);

        const headers = { Authorization: `Bearer ${token}` };

        const [jobsRes, reRes, msgRes] = await Promise.all([
          fetch(`${API}/api/jobs/my?limit=100`, { headers }),
          fetch(`${API}/api/real-estate/business/my-listings?limit=100`, { headers }),
          fetch(`${API}/api/messages`, { headers }),
        ]);

        // Log which ones failed to help debug
        if (!jobsRes.ok || !reRes.ok) {
          console.error("jobs:", jobsRes.status, "re:", reRes.status, "msg:", msgRes.status);
          setError(true);
          return;
        }

        const jobsData = await jobsRes.json();
        const reData   = await reRes.json();

        const jobs        = jobsData.jobs      || [];
        const realEstate  = reData.listings    || [];

        let activeJobs = 0;
        let applications = 0;
        jobs.forEach(j => {
          if (j.status === "APPROVED") activeJobs++;
          applications += j._count?.applications || 0;
        });

        let activeRealEstate = 0;
        realEstate.forEach(r => {
          if (r.status === "APPROVED") activeRealEstate++;
        });

        // Messages: don't block dashboard if this fails
        let unreadMessages = 0;
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const messages = msgData.data || [];
          unreadMessages = messages.filter(m => !m.isRead).length;
        }

        setStats({ activeJobs, activeRealEstate, totalApplications: applications, unreadMessages });
        setLatestJobs(jobs.slice(0, 3));
        setLatestRealEstate(realEstate.slice(0, 3));

      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="text-gray-500 mt-1">Bienvenue sur votre espace professionnel, {user?.name}</p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center gap-2">
          <AlertCircle className="text-red-300" size={32} />
          <p className="font-semibold text-gray-700">Impossible de charger les données</p>
          <p className="text-sm text-gray-400">Veuillez rafraîchir la page ou réessayer plus tard.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-[104px] animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Offres d'emploi actives" value={stats.activeJobs} icon={Briefcase} colorClass="text-[#2D5016]" bgColorClass="bg-[#E8F5D0]" href="/dashboard/listings/jobs" />
          <StatCard title="Annonces immo actives" value={stats.activeRealEstate} icon={Home} colorClass="text-yellow-700" bgColorClass="bg-yellow-50" href="/dashboard/listings/real-estate" />
          <StatCard title="Candidatures reçues" value={stats.totalApplications} icon={Users} colorClass="text-blue-700" bgColorClass="bg-blue-50" href="/dashboard/applications" />
          <StatCard title="Messages non lus" value={stats.unreadMessages} icon={Mail} colorClass="text-purple-700" bgColorClass="bg-purple-50" href="/dashboard/messages" />
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Dernières offres d'emploi</h2>
              <Link href="/dashboard/listings/jobs" className="text-sm font-medium text-[#2D5016] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={16} />
              </Link>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
              ) : latestJobs.length > 0 ? (
                latestJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{fmtDate(job.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={job.status} />
                      <Link href={`/dashboard/listings/jobs/edit/${job.id}`} className="text-gray-400 hover:text-[#2D5016] transition-colors p-2 rounded-lg hover:bg-gray-100">
                        <Edit2 size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Briefcase className="text-gray-400" size={20} />
                  </div>
                  <p className="text-sm text-gray-500">Aucune offre d'emploi trouvée.</p>
                  <Link href="/dashboard/listings/jobs/create" className="text-[#2D5016] text-sm font-medium hover:underline mt-2">Publier une offre</Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Dernières annonces immobilières</h2>
              <Link href="/dashboard/listings/real-estate" className="text-sm font-medium text-[#2D5016] hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={16} />
              </Link>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
              ) : latestRealEstate.length > 0 ? (
                latestRealEstate.map(listing => (
                  <div key={listing.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{fmtDate(listing.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={listing.status} />
                      <Link href={`/dashboard/listings/real-estate/edit/${listing.id}`} className="text-gray-400 hover:text-[#2D5016] transition-colors p-2 rounded-lg hover:bg-gray-100">
                        <Edit2 size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Home className="text-gray-400" size={20} />
                  </div>
                  <p className="text-sm text-gray-500">Aucune annonce immobilière trouvée.</p>
                  <Link href="/dashboard/listings/real-estate/create" className="text-[#2D5016] text-sm font-medium hover:underline mt-2">Publier une annonce</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}