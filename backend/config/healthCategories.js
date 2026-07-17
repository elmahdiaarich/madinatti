const HEALTH_CATEGORY_SLUG = 'sante';

const HEALTH_SUBCATEGORIES = [
  {
    slug: 'pharmacy',
    label: 'Pharmacies',
    googleTypes: ['pharmacy', 'drugstore'],
    textQueries: ['pharmacie au Maroc', 'صيدلية المغرب'],
  },
  {
    slug: 'hospital-clinic',
    label: 'Hopitaux et cliniques',
    googleTypes: ['hospital', 'general_hospital'],
    textQueries: ['clinique hopital au Maroc', 'مصحة مستشفى المغرب'],
  },
  {
    slug: 'medical-laboratory',
    label: "Laboratoires d'analyses",
    googleTypes: [],
    textQueries: ["laboratoire d'analyses medicales Maroc", 'مختبر التحاليل الطبية المغرب'],
  },
  {
    slug: 'doctor-office',
    label: 'Medecins et cabinets',
    googleTypes: ['doctor'],
    textQueries: ['cabinet medical medecin Maroc', 'طبيب عيادة المغرب'],
  },
  {
    slug: 'dentist',
    label: 'Dentistes',
    googleTypes: ['dentist', 'dental_clinic'],
    textQueries: ['dentiste cabinet dentaire Maroc', 'طبيب اسنان المغرب'],
  },
  {
    slug: 'radiology-center',
    label: 'Centres de radiologie',
    googleTypes: [],
    textQueries: ['centre de radiologie Maroc', 'مركز الأشعة المغرب'],
  },
  {
    slug: 'parapharmacy',
    label: 'Parapharmacies',
    googleTypes: [],
    textQueries: ['parapharmacie Maroc', 'بارافارماسي المغرب'],
  },
];

const HEALTH_SUBCATEGORY_MAP = Object.fromEntries(
  HEALTH_SUBCATEGORIES.map((item) => [item.slug, item]),
);

function getHealthSubcategory(slug) {
  return HEALTH_SUBCATEGORY_MAP[slug] || null;
}

module.exports = {
  HEALTH_CATEGORY_SLUG,
  HEALTH_SUBCATEGORIES,
  HEALTH_SUBCATEGORY_MAP,
  getHealthSubcategory,
};
