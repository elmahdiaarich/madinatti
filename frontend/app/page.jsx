import Link from 'next/link'

const categories = [
  { name: 'Emploi', count: '0 offres', href: '/jobs' },
  { name: 'Véhicules', count: '0 annonces', href: '/vehicules' },
  { name: 'Actualités', count: '0 articles', href: '/actualites' },
  { name: 'Événements', count: '0 événements', href: '/evenements' },
  { name: 'Santé', count: 'Services', href: '/sante' },
  { name: 'Droit', count: 'Services', href: '/droit' },
  { name: 'Tourisme', count: 'Services', href: '/tourisme' },
  { name: 'Annonces', count: 'Services', href: '/annonces' },
]

const popularSearches = ['Madinatti Centre', 'Quartier Nord', 'Zone Industrielle', 'Bord de mer']

export default function HomePage() {
  return (
    <main>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-dark to-primary min-h-96 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">
          Bienvenue sur <span className="text-primary-mint">Madinatti</span>
        </h1>
        <h2 className="text-xl font-semibold text-white mb-4">Votre ville connectée</h2>
        <p className="text-white text-sm mb-10 max-w-lg opacity-90">
          Découvrez emplois, véhicules, actualités et événements dans votre ville ou quartier
        </p>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl p-4 w-full max-w-2xl flex flex-col gap-4">
          <div className="flex gap-3">
            <select className="flex-1 p-3 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Toutes les catégories</option>
              <option>Emploi</option>
              <option>Véhicules</option>
              <option>Immobilier</option>
              <option>Événements</option>
            </select>
            <input
              type="text"
              placeholder="Ville, quartier..."
              className="flex-1 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-sage transition">
              Rechercher
            </button>
          </div>
        </div>

        {/* Recherches populaires */}
        <div className="flex items-center gap-3 mt-6 flex-wrap justify-center">
          <span className="text-white text-xs opacity-75">Recherches populaires :</span>
          {popularSearches.map((search) => (
            <button
              key={search}
              className="border border-white text-white text-xs px-4 py-1.5 rounded-full hover:bg-white hover:text-primary-dark transition"
            >
              {search}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Explorez par catégorie</h2>
        <p className="text-center text-gray-500 text-sm mb-10">Trouvez rapidement ce que vous cherchez dans votre région</p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-primary-mint rounded-lg"></div>
              <span className="text-sm font-medium text-gray-800">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}