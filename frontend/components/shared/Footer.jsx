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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-4">

        {/* Brand */}
        <div className="md:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <LogoWhite />
          </div>
          <p className="mb-4 text-sm text-white/75">Votre ville connectée</p>
          <p className="text-xs leading-relaxed text-white/60">
            La plateforme qui connecte votre ville. Trouvez emplois, véhicules, actualités et événements près de chez vous.
          </p>
        </div>

        {/* Services */}
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

        {/* Support */}
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

        {/* Contact */}
        <div>
          <h4 className="mb-4 font-semibold">Contact</h4>
          <div className="flex flex-col gap-3 text-sm text-white/70">
            {/* Address */}
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="leading-snug">
                15, Rue Sebou résidence La Chope Center<br />
                14000 Kénitra – Maroc
              </span>
            </div>

            {/* Phones */}
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="leading-snug">
                <a href="tel:+212537327386" className="hover:text-white transition">05 37 32 73 86</a><br />
                <a href="tel:+212537360330" className="hover:text-white transition">05 37 36 03 30</a>
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:Contact@madinatti.com" className="hover:text-white transition">
                Contact@madinatti.com
              </a>
            </div>
          </div>
        </div>

      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-white/20 pt-6 text-center text-xs text-white/60 sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} Madinatti. Tous droits réservés. | Plateforme de services locaux au Maroc</p>
        <p>Fait au Maroc 🇲🇦</p>
      </div>
    </footer>
  );
}
