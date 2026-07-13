// frontend\components\mini-jobs\TaskRequestCard.jsx
'use client';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight, CircleCheck } from 'lucide-react';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function TaskRequestCard({ task }) {
  const hasBudget = !!task.budget;

  return (
    <Link href={`/mini-jobs/tasks/${task.id}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200">
        {task.matchesProfile && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-mint text-primary-dark mb-2">
            <CircleCheck size={11} />
            Correspond à votre profil
          </span>
        )}
        <h3
          dir="auto"
          className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-dark transition-colors"
        >
          {task.title}
        </h3>
        {task.category?.name && (
          <span className="inline-block text-[11px] font-bold text-primary-dark bg-primary-mint px-2.5 py-0.5 rounded-full mt-1.5">
            {task.category.name}
          </span>
        )}
        <p dir="auto" className="text-sm text-gray-500 mt-2 line-clamp-2">
          {task.description}
        </p>
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {task.city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />{task.city}
              </span>
            )}
            {task.neededDate && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />{fmtDate(task.neededDate)}
              </span>
            )}
          </div>
          <span
            className={
              hasBudget
                ? 'text-sm font-bold text-primary-dark'
                : 'text-sm font-semibold italic text-gray-500'
            }
          >
            {hasBudget ? `${Number(task.budget).toLocaleString('fr-MA')} MAD` : 'Budget à discuter'}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 text-xs font-bold text-accent group-hover:gap-2 transition-all">
          Voir la demande
          <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
}