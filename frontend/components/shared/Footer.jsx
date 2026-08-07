import Link from "next/link";
import LogoWhite from "./logos/Logo_white";

const serviceLinks = [
  { href: "/jobs", label: "Emplois" },
  { href: "/cars", label: "Véhicules" },
  { href: "/press", label: "Actualités" },
  { href: "/evenements", label: "Événements" },
];

const supportLinks = [
  { href: "/#faq", label: "Centre d'aide" },
  { href: "/#contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] px-6 py-12 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <LogoWhite />
          </div>
          <p className="mb-4 text-sm text-white/75">Votre ville connectée</p>
          <p className="text-xs leading-relaxed text-white/60">
            La plateforme qui connecte votre ville. Trouvez emplois, véhicules, actualités et événements près de chez vous.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-semibold">Services</h4>
          <div className="flex flex-col gap-2">
            {serviceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-white/70 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-semibold">Support</h4>
          <div className="flex flex-col gap-2">
            {supportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-white/70 transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/20 pt-6 text-center text-xs text-white/60 sm:flex-row sm:text-left">
        <p>© 2024 Madinatti. Tous droits réservés. | Plateforme de services locaux au Maroc</p>
        <p>Fait au Maroc</p>
      </div>
    </footer>
  );
}
