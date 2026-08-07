import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EducationDirectory from "@/components/education/EducationDirectory";

export function generateMetadata({ params }) {
  const city = String(params.city || "").replace(/-/g, " ");
  const type = String(params.typeSlug || "").replace(/-/g, " ");
  return {
    title: `${type} a ${city} - Education au Maroc`,
    description: `Recherche d'etablissements educatifs a ${city} par type et secteur.`,
  };
}

export default function EducationCityTypePage({ params }) {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement</div>}>
      <EducationDirectory initialCity={params.city} initialTypeSlug={params.typeSlug} />
    </Suspense>
  );
}
