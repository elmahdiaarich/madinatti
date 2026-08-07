import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EducationDirectory from "@/components/education/EducationDirectory";

export const metadata = {
  title: "Education au Maroc - Ecoles, universites et instituts",
  description: "Trouvez des etablissements educatifs au Maroc par ville, region, type et secteur.",
};

export default function EducationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement</div>}>
      <EducationDirectory />
    </Suspense>
  );
}
