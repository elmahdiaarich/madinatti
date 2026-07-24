'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../services/pressService';

const STATUS_STYLES = {
  PENDING:   { label: 'En attente',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  APPROVED:  { label: 'Publié',      bg: 'bg-[#E8F5D0]', text: 'text-[#2D5016]',  border: 'border-[#A7D129]/40' },
  REJECTED:  { label: 'Refusé',      bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200' },
  ARCHIVED:  { label: 'Archivé',     bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200' },
};

const LANGUAGE_LABELS = { AR: 'Arabe', FR: 'Français' };

function ArticleCard({ article }) {
  const style = STATUS_STYLES[article.status] || STATUS_STYLES.PENDING;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#E8F5D0] flex items-center justify-center">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">📰</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{article.title}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
            {style.label}
          </span>
        </div>
        <p className="text-xs text-[#7BA428] font-semibold mt-1">{article.category?.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          {article.city && <span>{article.city}</span>}
          {article.language && <span>· {LANGUAGE_LABELS[article.language] || article.language}</span>}
        </div>

        {article.status === 'REJECTED' && (article.adminNote || article.adminNotes) && (
          <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-xs text-red-600">
              <strong>Motif du refus :</strong> {article.adminNote || article.adminNotes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Link href={`/my-space/newsroom/edit/${article.id}`} className="text-xs font-bold text-[#2D5016] hover:underline">
            Modifier
          </Link>
          {article.status === 'APPROVED' && (
            <Link href={`/press/${article.id}`} target="_blank" className="text-xs font-bold text-gray-500 hover:text-gray-800 hover:underline">
              Voir l'article public
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsroomPage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // Le journaliste non encore validé n'a pas accès à /mine/list (403 attendu,
    // pas une vraie erreur) — on n'affiche la liste que pour un compte APPROVED.
    if (user?.journalistStatus !== 'APPROVED') {
      setLoading(false);
      return;
    }
    pressService.getMyArticles()
      .then((res) => setArticles(res.data ?? []))
      .catch((e) => toast.error(e.response?.data?.message || e.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [token, user?.journalistStatus]);

  const isPendingAccount = user?.journalistStatus === 'PENDING';
  const isRejectedAccount = user?.journalistStatus === 'REJECTED';

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      {isPendingAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-bold text-amber-700">⏳ Compte en attente de validation</p>
          <p className="text-xs text-amber-700/80 mt-1">
            Un administrateur doit valider votre compte journaliste avant que vous puissiez soumettre des articles.
          </p>
        </div>
      )}
      {isRejectedAccount && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-bold text-red-700">❌ Compte refusé</p>
          <p className="text-xs text-red-700/80 mt-1">
            Votre demande de compte journaliste n'a pas été validée.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes articles</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Chargement…' : `${articles.length} article${articles.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {user?.journalistStatus === 'APPROVED' && (
          <Link href="/my-space/newsroom/create"
            className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all whitespace-nowrap">
            + Nouvel article
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-gray-700">Aucun article pour l'instant</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}