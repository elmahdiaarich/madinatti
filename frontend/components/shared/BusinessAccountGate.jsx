'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BusinessAccountGate() {
  const { addAccount } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('choice');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await addAccount(form.email, form.password);
      if (res?.user?.role !== 'business') {
        setError("Ce compte n'est pas un compte business.");
        return;
      }
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E8F5D0] flex items-center justify-center text-2xl mx-auto mb-4">
          🏢
        </div>
        <h2 className="text-lg font-extrabold text-[#2D5016] mb-2">
          Un compte business est nécessaire
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Pour publier une annonce, vous devez disposer d'un compte business.
          Votre compte citoyen reste actif — vous pourrez basculer entre les deux à tout moment.
        </p>

        {mode === 'choice' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/auth/register?type=business')}
              className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition"
            >
              Créer un compte business
            </button>
            <button
              onClick={() => setMode('add')}
              className="w-full py-3 rounded-xl border-2 border-[#2D5016] text-[#2D5016] font-bold text-sm hover:bg-[#E8F5D0] transition"
            >
              J'ai déjà un compte business
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {mode === 'add' && (
          <form onSubmit={handleAdd} className="flex flex-col gap-3 text-left">
            <input
              type="email"
              placeholder="Email du compte business"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129]"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="text-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129]"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#2D5016] text-white font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-50"
              >
                {loading ? '...' : 'Se connecter'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('choice'); setError(''); }}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}