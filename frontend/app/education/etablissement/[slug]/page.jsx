import EducationInstitutionDetail from "@/components/education/EducationInstitutionDetail";

async function fetchInstitution(slug) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}/api/education/institutions/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const institution = await fetchInstitution(params.slug);
  if (!institution) {
    return {
      title: "Etablissement education - Informations, adresse et contact",
      description: "Fiche d'un etablissement educatif au Maroc.",
    };
  }

  const city = institution.city ? ` a ${institution.city}` : "";
  return {
    title: `${institution.name}${city} - Informations, adresse et contact`,
    description: [institution.name, institution.address, institution.city, institution.region].filter(Boolean).join(" - "),
  };
}

export default function EducationInstitutionPage() {
  return <EducationInstitutionDetail />;
}
