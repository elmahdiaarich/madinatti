'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../services/pressService';

const PAGE_SIZE = 8;
const LANGUAGE_LABELS = { AR: 'Arabe', FR: 'Français' };

// ─── Carte article ────────────────────────────────────────────────────────────

function ArticleCard({ article, onDeleted }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleCardClick = (e) => {
    // Ne pas déclencher si on clique sur un lien/bouton enfant
    if (e.target.closest('a, button')) return;
    router.push(`/my-space/newsroom/edit/${article.id}`);
  };

  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = window.confirm(
      'Supprimer définitivement cet article ? Cette action est irréversible et retire aussi la photo/vidéo associée.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await pressService.deleteArticle(article.id);
      toast.success('Article supprimé.');
      onDeleted(article.id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 cursor-pointer hover:border-[#A7D129]/60 hover:shadow-md transition-all group"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#E8F5D0] flex items-center justify-center">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-2xl">📰</span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{article.title}</h3>
        </div>

        <p className="text-xs text-[#7BA428] font-semibold mt-1">{article.category?.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          {article.city && <span>{article.city}</span>}
          {article.language && <span>· {LANGUAGE_LABELS[article.language] || article.language}</span>}
          {article.editCount > 0 && <span>· modifié {article.editCount}×</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3">
          <Link
            href={`/my-space/newsroom/edit/${article.id}`}
            className="text-xs font-bold text-[#2D5016] hover:text-[#A7D129] hover:underline"
          >
            Modifier
          </Link>

          <Link
            href={`/press/${article.id}`}
            target="_blank"
            className="text-xs font-bold text-gray-500 hover:text-gray-800 hover:underline"
          >
            Voir l'article public ↗
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-bold text-gray-400 hover:text-red-600 hover:underline ms-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function NewsroomPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);

  const load = () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    pressService.getMyArticles()
      .then((res) => setArticles(res.data ?? []))
      .catch((e) => {
        setLoadError(true);
        toast.error(e.response?.data?.message || e.message || 'Erreur lors du chargement');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleArticleDeleted = (id) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages   = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const pageArticles = articles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes articles</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading
              ? 'Chargement…'
              : loadError
              ? 'Erreur de chargement'
              : `${articles.length} article${articles.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <Link href="/my-space/newsroom/create"
          className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all whitespace-nowrap">
          + Nouvel article
        </Link>
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-red-100 flex flex-col items-center gap-4">
          <div className="text-4xl">⚠️</div>
          <p className="font-semibold text-gray-700">Impossible de charger vos articles</p>
          <button
            onClick={load}
            className="px-5 py-2 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-gray-700">Aucun article pour l'instant</p>
          <p className="text-xs text-gray-400 mt-1">Créez votre premier article pour commencer.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {pageArticles.map((a) => (
              <ArticleCard key={a.id} article={a} onDeleted={handleArticleDeleted} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-4 py-2 text-xs font-bold rounded-full border border-gray-200 text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Précédent
              </button>

              <span className="text-xs text-gray-500 font-medium">
                Page {safePage} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-4 py-2 text-xs font-bold rounded-full border border-gray-200 text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}