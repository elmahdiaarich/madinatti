import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EducationDirectory from "@/components/education/EducationDirectory";

export function generateMetadata({ params }) {
  const city = String(params.city || "").replace(/-/g, " ");
  return {
    title: `Education a ${city} - Ecoles et universites`,
    description: `Etablissements educatifs a ${city}: ecoles, instituts, universites et centres de formation.`,
  };
}

export default function EducationCityPage({ params }) {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement</div>}>
      <EducationDirectory initialCity={params.city} />
    </Suspense>
  );
}
