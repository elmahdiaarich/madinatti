const EDUCATION_INSTITUTION_TYPES = [
  { value: 'PRESCHOOL', label: 'Maternelle / prescolaire', slug: 'maternelles' },
  { value: 'PRIMARY_SCHOOL', label: 'Ecole primaire', slug: 'ecoles-primaires' },
  { value: 'MIDDLE_SCHOOL', label: 'College', slug: 'colleges' },
  { value: 'HIGH_SCHOOL', label: 'Lycee', slug: 'lycees' },
  { value: 'UNIVERSITY', label: 'Universite', slug: 'universites' },
  { value: 'FACULTY', label: 'Faculte', slug: 'facultes' },
  { value: 'ENGINEERING_SCHOOL', label: 'Grande ecole / ingenierie', slug: 'grandes-ecoles' },
  { value: 'BUSINESS_SCHOOL', label: 'Ecole de commerce', slug: 'ecoles-commerce' },
  { value: 'INSTITUTE', label: 'Institut', slug: 'instituts' },
  { value: 'VOCATIONAL_TRAINING', label: 'Formation professionnelle', slug: 'formation-professionnelle' },
  { value: 'OFPPT', label: 'OFPPT', slug: 'ofppt' },
  { value: 'LANGUAGE_CENTER', label: 'Centre de langues', slug: 'centres-langues' },
  { value: 'TRAINING_CENTER', label: 'Centre de formation', slug: 'centres-formation' },
  { value: 'OTHER', label: 'Autre etablissement', slug: 'autres' },
];

const EDUCATION_TYPE_VALUES = EDUCATION_INSTITUTION_TYPES.map((type) => type.value);
const EDUCATION_TYPE_BY_SLUG = Object.fromEntries(EDUCATION_INSTITUTION_TYPES.map((type) => [type.slug, type.value]));
const EDUCATION_TYPE_SLUG_BY_VALUE = Object.fromEntries(EDUCATION_INSTITUTION_TYPES.map((type) => [type.value, type.slug]));

const EDUCATION_SECTORS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Prive' },
  { value: 'SEMI_PUBLIC', label: 'Semi-public' },
];

const EDUCATION_SECTOR_VALUES = EDUCATION_SECTORS.map((sector) => sector.value);

module.exports = {
  EDUCATION_INSTITUTION_TYPES,
  EDUCATION_TYPE_VALUES,
  EDUCATION_TYPE_BY_SLUG,
  EDUCATION_TYPE_SLUG_BY_VALUE,
  EDUCATION_SECTORS,
  EDUCATION_SECTOR_VALUES,
};
