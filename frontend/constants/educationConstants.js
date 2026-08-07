import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Languages,
  School,
} from "lucide-react";

export const EDUCATION_TYPES = [
  { value: "PRESCHOOL", label: "Maternelle / prescolaire", slug: "maternelles", icon: School },
  { value: "PRIMARY_SCHOOL", label: "Ecole primaire", slug: "ecoles-primaires", icon: School },
  { value: "MIDDLE_SCHOOL", label: "College", slug: "colleges", icon: BookOpen },
  { value: "HIGH_SCHOOL", label: "Lycee", slug: "lycees", icon: BookOpen },
  { value: "UNIVERSITY", label: "Universite", slug: "universites", icon: GraduationCap },
  { value: "FACULTY", label: "Faculte", slug: "facultes", icon: GraduationCap },
  { value: "ENGINEERING_SCHOOL", label: "Grande ecole", slug: "grandes-ecoles", icon: Building2 },
  { value: "BUSINESS_SCHOOL", label: "Ecole de commerce", slug: "ecoles-commerce", icon: BriefcaseBusiness },
  { value: "INSTITUTE", label: "Institut", slug: "instituts", icon: Building2 },
  { value: "VOCATIONAL_TRAINING", label: "Formation professionnelle", slug: "formation-professionnelle", icon: BriefcaseBusiness },
  { value: "OFPPT", label: "OFPPT", slug: "ofppt", icon: BriefcaseBusiness },
  { value: "LANGUAGE_CENTER", label: "Centre de langues", slug: "centres-langues", icon: Languages },
  { value: "TRAINING_CENTER", label: "Centre de formation", slug: "centres-formation", icon: BookOpen },
  { value: "OTHER", label: "Autre", slug: "autres", icon: Building2 },
];

export const EDUCATION_TYPE_MAP = Object.fromEntries(EDUCATION_TYPES.map((item) => [item.value, item]));
export const EDUCATION_TYPE_BY_SLUG = Object.fromEntries(EDUCATION_TYPES.map((item) => [item.slug, item]));

export const EDUCATION_SECTORS = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Prive" },
  { value: "SEMI_PUBLIC", label: "Semi-public" },
];

export const MOROCCO_REGIONS = [
  {
    name: "Casablanca-Settat",
    provinces: [
      { name: "Casablanca", cities: ["Casablanca", "Ain Harrouda", "Bouskoura", "Dar Bouazza"] },
      { name: "Mohammedia", cities: ["Mohammedia", "Benslimane"] },
      { name: "El Jadida", cities: ["El Jadida", "Azemmour"] },
      { name: "Settat", cities: ["Settat", "Berrechid"] },
    ],
  },
  {
    name: "Rabat-Sal\u00e9-K\u00e9nitra",
    provinces: [
      { name: "Rabat", cities: ["Rabat", "Temara"] },
      { name: "Sale", cities: ["Sale"] },
      {
        name: "K\u00e9nitra",
        cities: [
          "Ameur Seflia",
          "Arbaoua",
          "Bahhara Ouled Ayad",
          "Ben Mansour",
          "Beni Malek",
          "Chouafaa",
          "Haddada",
          "Kariat Ben Aouda",
          "K\u00e9nitra",
          "Lalla Mimouna",
          "Mehdya",
          "Mnasra",
          "Mograne",
          "Moulay Bousselham",
          "Oued El Makhazine",
          "Ouled Slama",
          "Sidi Allal Tazi",
          "Sidi Boubker El Haj",
          "Sidi Mohamed Benmansour",
          "Sidi Mohamed Lahmar",
          "Sidi Taibi",
          "Souk El Arbaa",
          "Souk Tlet El Gharb",
        ],
      },
    ],
  },
  {
    name: "F\u00e8s-Mekn\u00e8s",
    provinces: [
      { name: "Fes", cities: ["Fes", "Sefrou"] },
      { name: "Meknes", cities: ["Meknes", "Ifrane", "El Hajeb"] },
      { name: "Taza", cities: ["Taza"] },
    ],
  },
  {
    name: "Marrakech-Safi",
    provinces: [
      { name: "Marrakech", cities: ["Marrakech", "Chichaoua"] },
      { name: "Safi", cities: ["Safi", "Essaouira", "Youssoufia"] },
    ],
  },
  {
    name: "Tanger-Tetouan-Al Hoceima",
    provinces: [
      { name: "Tanger-Assilah", cities: ["Tanger", "Assilah"] },
      { name: "Tetouan", cities: ["Tetouan", "Martil"] },
      { name: "Al Hoceima", cities: ["Al Hoceima"] },
    ],
  },
  { name: "Oriental", provinces: [{ name: "Oujda-Angad", cities: ["Oujda"] }, { name: "Nador", cities: ["Nador", "Berkane"] }] },
  { name: "Beni Mellal-Khenifra", provinces: [{ name: "Beni Mellal", cities: ["Beni Mellal"] }, { name: "Khenifra", cities: ["Khenifra"] }] },
  { name: "Draa-Tafilalet", provinces: [{ name: "Errachidia", cities: ["Errachidia"] }, { name: "Ouarzazate", cities: ["Ouarzazate"] }] },
  { name: "Souss-Massa", provinces: [{ name: "Agadir Ida-Outanane", cities: ["Agadir"] }, { name: "Taroudant", cities: ["Taroudant"] }] },
  { name: "Guelmim-Oued Noun", provinces: [{ name: "Guelmim", cities: ["Guelmim"] }] },
  { name: "Laayoune-Sakia El Hamra", provinces: [{ name: "Laayoune", cities: ["Laayoune"] }] },
  { name: "Dakhla-Oued Ed-Dahab", provinces: [{ name: "Oued Ed-Dahab", cities: ["Dakhla"] }] },
];

export const MOROCCO_CITIES = [...new Set(MOROCCO_REGIONS.flatMap((region) => region.provinces.flatMap((province) => province.cities)))].sort();
