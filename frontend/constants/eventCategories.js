import {
  CalendarDays,
  Drama,
  Music,
  Tent,
  Store,
  Landmark,
  Image as ImageIcon,
  Film,
  Presentation,
  GraduationCap,
  Trophy,
  Palette,
  HeartHandshake,
  Users,
  Baby,
  Utensils,
  Sparkles,
  Cpu,
  BriefcaseBusiness,
  Gamepad2,
  Moon,
  DoorOpen,
  Tags,
  CircleEllipsis,
} from "lucide-react";

export const EVENT_CATEGORIES = [
  { slug: "theatre-spectacle", label: "Theatre et spectacle", icon: Drama },
  { slug: "concert-musique", label: "Concert et musique", icon: Music },
  { slug: "festival", label: "Festival", icon: Tent },
  { slug: "marche-souk", label: "Marche et souk", icon: Store },
  { slug: "salon-foire", label: "Salon et foire", icon: Landmark },
  { slug: "exposition", label: "Exposition", icon: ImageIcon },
  { slug: "cinema-projection", label: "Cinema et projection", icon: Film },
  { slug: "conference-seminaire", label: "Conference et seminaire", icon: Presentation },
  { slug: "formation-atelier", label: "Formation et atelier", icon: GraduationCap },
  { slug: "sport", label: "Sport", icon: Trophy },
  { slug: "culture", label: "Culture", icon: Palette },
  { slug: "religieux", label: "Religieux", icon: HeartHandshake },
  { slug: "associatif", label: "Associatif", icon: Users },
  { slug: "famille-enfants", label: "Famille et enfants", icon: Baby },
  { slug: "gastronomie", label: "Gastronomie", icon: Utensils },
  { slug: "mode-beaute", label: "Mode et beaute", icon: Sparkles },
  { slug: "technologie-innovation", label: "Technologie et innovation", icon: Cpu },
  { slug: "entrepreneuriat-emploi", label: "Entrepreneuriat et emploi", icon: BriefcaseBusiness },
  { slug: "tourisme-patrimoine", label: "Tourisme et patrimoine", icon: Landmark },
  { slug: "jeux-esport", label: "Jeux et esport", icon: Gamepad2 },
  { slug: "vie-nocturne", label: "Vie nocturne", icon: Moon },
  { slug: "portes-ouvertes", label: "Portes ouvertes", icon: DoorOpen },
  { slug: "brocante-vide-grenier", label: "Brocante et vide-grenier", icon: Tags },
  { slug: "autre", label: "Autre", icon: CircleEllipsis },
];

export const EVENT_CATEGORY_MAP = Object.fromEntries(EVENT_CATEGORIES.map((item) => [item.slug, item]));

export const EVENT_MODES = [
  { value: "", label: "Tous modes" },
  { value: "IN_PERSON", label: "Presentiel" },
  { value: "ONLINE", label: "En ligne" },
  { value: "HYBRID", label: "Hybride" },
];

export const EVENT_STATUSES = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PENDING_REVIEW", label: "En validation" },
  { value: "PUBLISHED", label: "Publie" },
  { value: "REJECTED", label: "Refuse" },
  { value: "CANCELLED", label: "Annule" },
  { value: "POSTPONED", label: "Reporte" },
  { value: "FINISHED", label: "Termine" },
];

export const RECURRENCE_TYPES = [
  { value: "NONE", label: "Aucune" },
  { value: "DAILY", label: "Quotidienne" },
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "YEARLY", label: "Annuelle" },
  { value: "CUSTOM", label: "RRULE personnalisee" },
];

export const DEFAULT_EVENT_ICON = CalendarDays;
