"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

const TYPE_CONFIG = {
  APPLICATION_ACCEPTED: { icon: "✅", label: "Candidature", color: "bg-green-50 text-green-700" },
  JOB_ALERT:            { icon: "🔔", label: "Alerte emploi", color: "bg-blue-50 text-blue-700" },
  NEW_APPLICATION:      { icon: "👤", label: "Candidature", color: "bg-purple-50 text-purple-700" },
  NEW_INQUIRY:          { icon: "💬", label: "Message", color: "bg-yellow-50 text-yellow-700" },
  LISTING_APPROVED: { icon: "✅", label: "Annonce approuvée", color: "bg-green-50 text-green-700" },
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setNotifications(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
    setMarkingAll(false);
  };

  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif.id);
    if (notif.link) router.push(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const config = (type) => TYPE_CONFIG[type] || { icon: "🔔", label: "Notification", color: "bg-gray-50 text-gray-700" };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#2D5016] border border-[#A7D129] rounded-xl hover:bg-[#E8F5D0] transition disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Tout marquer lu
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#A7D129] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Bell className="text-gray-300" size={40} />
            <p className="text-gray-500 font-medium">Aucune notification pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => {
              const c = config(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${!notif.isRead ? 'bg-[#E8F5D0]/20' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${c.color}`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>
                        {c.label}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#A7D129] mt-2 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}