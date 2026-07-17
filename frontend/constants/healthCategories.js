import {
  Building2,
  Cross,
  FlaskConical,
  HeartPulse,
  Pill,
  ScanLine,
  Stethoscope,
} from "lucide-react";

export const HEALTH_SUBCATEGORIES = [
  { slug: "pharmacy", label: "Pharmacies", icon: Pill, color: "#2D5016" },
  { slug: "hospital-clinic", label: "Hopitaux et cliniques", icon: Cross, color: "#B42318" },
  { slug: "medical-laboratory", label: "Laboratoires", icon: FlaskConical, color: "#155EEF" },
  { slug: "doctor-office", label: "Medecins", icon: Stethoscope, color: "#7A2E0E" },
  { slug: "dentist", label: "Dentistes", icon: HeartPulse, color: "#027A48" },
  { slug: "radiology-center", label: "Radiologie", icon: ScanLine, color: "#6941C6" },
  { slug: "parapharmacy", label: "Parapharmacies", icon: Building2, color: "#B54708" },
];

export const HEALTH_SUBCATEGORY_MAP = Object.fromEntries(
  HEALTH_SUBCATEGORIES.map((item) => [item.slug, item]),
);

export const MOROCCO_CITIES = [
  "Casablanca",
  "Rabat",
  "Kenitra",
  "Tanger",
  "Marrakech",
  "Fes",
  "Meknes",
  "Agadir",
  "Oujda",
  "Tetouan",
  "Safi",
  "El Jadida",
  "Nador",
  "Beni Mellal",
  "Laayoune",
  "Mohammedia",
];
