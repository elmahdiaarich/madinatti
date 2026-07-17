import Logo_w from "./logos/Logo_white";

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white px-6 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Logo_w />
          </div>
          <p className="text-sm text-gray-300 mb-4">Votre ville connectée</p>
          <p className="text-xs text-gray-400">La plateforme qui connecte votre ville. Trouvez emplois, véhicules, actualités et événements près de chez vous.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Services</h4>
          <div className="flex flex-col gap-2">
            <a href="/jobs" className="text-sm text-gray-300 hover:text-white">Emplois</a>
            <a href="/vehicules" className="text-sm text-gray-300 hover:text-white">Véhicules</a>
            <a href="/press" className="text-sm text-gray-300 hover:text-white">Actualités</a>
            <a href="/evenements" className="text-sm text-gray-300 hover:text-white">Événements</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Support</h4>
          <div className="flex flex-col gap-2">
            <a href="#" className="text-sm text-gray-300 hover:text-white">Centre d'aide</a>
            <a href="#" className="text-sm text-gray-300 hover:text-white">Contact</a>
            <a href="#" className="text-sm text-gray-300 hover:text-white">Confidentialité</a>
            <a href="#" className="text-sm text-gray-300 hover:text-white">Conditions</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-gray-600 mt-8 pt-6 flex justify-between items-center">
        <p className="text-xs text-gray-400">© 2024 Madinatti. Tous droits réservés. | Plateforme de services locaux au Maroc</p>
        <p className="text-xs text-gray-400">Fait avec ❤️ au Maroc</p>
      </div>
    </footer>
  )
}