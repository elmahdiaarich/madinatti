'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { workerProfilesService } from '../../services/WorkerProfilesService';
import { taskRequestsService } from '../../services/TaskRequestsService';
import { bookingsService } from '../../services/BookingsService';

function StatCard({ icon, label, value, href, accent }) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#A7D129] transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: accent + '22' }}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </Link>
  );
}

export default function MySpaceOverviewPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [profilesRes, tasksRes, bookClientRes, bookWorkerRes] = await Promise.all([
          workerProfilesService.getMyWorkerProfiles(token).catch(() => ({ data: [] })),
          taskRequestsService.getMyTaskRequests(token).catch(() => ({ data: [] })),
          bookingsService.getMyBookingsAsClient(token).catch(() => ({ data: [] })),
          bookingsService.getMyBookingsAsWorker(token).catch(() => ({ data: [] })),
        ]);
        const profiles = profilesRes.data ?? [];
        const tasks = tasksRes.data ?? [];
        const bookingsClient = bookClientRes.data ?? [];
        const bookingsWorker = bookWorkerRes.data ?? [];

        setStats({
          profilesTotal: profiles.length,
          profilesPending: profiles.filter((p) => p.status === 'PENDING').length,
          tasksActive: tasks.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length,
          bookingsPending:
            bookingsClient.filter((b) => b.status === 'PENDING').length +
            bookingsWorker.filter((b) => b.status === 'PENDING').length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bonjour {user?.name?.split(' ')[0] || ''} 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">Voici un aperçu de votre espace</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon="🔧" label="Profils prestataire"
            value={stats.profilesTotal}
            href="/my-space/worker-profiles"
            accent="#A7D129"
          />
          <StatCard
            icon="📋" label="Demandes actives"
            value={stats.tasksActive}
            href="/my-space/task-requests"
            accent="#FF8C42"
          />
          <StatCard
            icon="📅" label="Réservations en attente"
            value={stats.bookingsPending}
            href="/my-space/bookings"
            accent="#28A745"
          />
          <StatCard
            icon="⏳" label="Profils en attente"
            value={stats.profilesPending}
            href="/my-space/worker-profiles"
            accent="#FFC107"
          />
        </div>
      )}

      <div className="bg-[#E8F5D0] rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold text-[#2D5016] text-sm">Envie de proposer vos services ?</p>
          <p className="text-xs text-[#2D5016]/70 mt-0.5">Créez un profil prestataire pour être visible et recevoir des demandes.</p>
        </div>
        <Link
          href="/my-space/worker-profiles/create"
          className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all whitespace-nowrap"
        >
          Créer un profil
        </Link>
      </div>
    </div>
  );
}