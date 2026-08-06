const TEMPLATE_DEFINITIONS = [
  {
    key: 'performing_arts',
    name: 'Arts et scene',
    slugs: ['theatre-spectacle', 'festival', 'culture', 'exposition', 'cinema-projection'],
    fields: [
      { fieldName: 'program', label: 'Programme', fieldType: 'textarea', required: true },
      { fieldName: 'artists', label: 'Artistes / intervenants', fieldType: 'text' },
      { fieldName: 'language', label: 'Langue', fieldType: 'select', options: ['Francais', 'Arabe', 'Amazigh', 'Anglais', 'Autre'] },
    ],
  },
  {
    key: 'music',
    name: 'Musique',
    slugs: ['concert-musique', 'vie-nocturne'],
    fields: [
      { fieldName: 'musicStyle', label: 'Style musical', fieldType: 'text', required: true },
      { fieldName: 'lineup', label: 'Line-up', fieldType: 'textarea' },
      { fieldName: 'minimumAge', label: 'Age minimum', fieldType: 'number', validationRules: { min: 0 } },
    ],
  },
  {
    key: 'sport',
    name: 'Sport',
    slugs: ['sport'],
    fields: [
      { fieldName: 'sportType', label: 'Discipline sportive', fieldType: 'text', required: true },
      { fieldName: 'competitionLevel', label: 'Niveau', fieldType: 'select', options: ['Loisir', 'Amateur', 'Professionnel', 'Tous niveaux'] },
      { fieldName: 'equipmentRequired', label: 'Materiel requis', fieldType: 'textarea' },
    ],
  },
  {
    key: 'family',
    name: 'Famille',
    slugs: ['famille-enfants'],
    fields: [
      { fieldName: 'targetAge', label: 'Age cible', fieldType: 'text', required: true },
      { fieldName: 'parentPresence', label: 'Presence parentale requise', fieldType: 'checkbox' },
      { fieldName: 'childrenCapacity', label: 'Nombre d enfants maximum', fieldType: 'number', validationRules: { min: 0 } },
    ],
  },
  {
    key: 'gastronomy',
    name: 'Gastronomie',
    slugs: ['gastronomie', 'marche-souk'],
    fields: [
      { fieldName: 'cuisineType', label: 'Type de cuisine', fieldType: 'text', required: true },
      { fieldName: 'tastingIncluded', label: 'Degustation incluse', fieldType: 'checkbox' },
      { fieldName: 'dietaryOptions', label: 'Options alimentaires', fieldType: 'textarea' },
    ],
  },
  {
    key: 'learning_business',
    name: 'Formation et professionnel',
    slugs: ['formation-atelier', 'conference-seminaire', 'salon-foire', 'entrepreneuriat-emploi', 'technologie-innovation', 'portes-ouvertes'],
    fields: [
      { fieldName: 'speakerName', label: 'Intervenant principal', fieldType: 'text', required: true },
      { fieldName: 'learningObjectives', label: 'Objectifs', fieldType: 'textarea' },
      { fieldName: 'certificateProvided', label: 'Attestation fournie', fieldType: 'checkbox' },
    ],
  },
  {
    key: 'community',
    name: 'Communautaire',
    slugs: ['religieux', 'associatif', 'tourisme-patrimoine', 'jeux-esport', 'mode-beaute', 'brocante-vide-grenier', 'autre'],
    fields: [
      { fieldName: 'audienceType', label: 'Public vise', fieldType: 'text' },
      { fieldName: 'registrationDetails', label: 'Modalites de participation', fieldType: 'textarea' },
      { fieldName: 'partnerNames', label: 'Partenaires', fieldType: 'textarea' },
    ],
  },
];

async function seedEventFormTemplates(prisma) {
  console.log('Seeding event form templates...');
  const templatesByKey = {};

  for (const template of TEMPLATE_DEFINITIONS) {
    const record = await prisma.formTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: { name: template.name },
    });
    templatesByKey[template.key] = record;

    for (const [index, field] of template.fields.entries()) {
      await prisma.formField.upsert({
        where: {
          formTemplateId_fieldName: {
            formTemplateId: record.id,
            fieldName: field.fieldName,
          },
        },
        update: {
          label: field.label,
          fieldType: field.fieldType,
          required: Boolean(field.required),
          options: field.options || undefined,
          validationRules: field.validationRules || undefined,
          displayOrder: index + 1,
        },
        create: {
          formTemplateId: record.id,
          fieldName: field.fieldName,
          label: field.label,
          fieldType: field.fieldType,
          required: Boolean(field.required),
          options: field.options || undefined,
          validationRules: field.validationRules || undefined,
          displayOrder: index + 1,
        },
      });
    }

    await prisma.category.updateMany({
      where: { module: 'events', slug: { in: template.slugs } },
      data: { formTemplateId: record.id },
    });
  }

  console.log(`  ${Object.keys(templatesByKey).length} template(s) ready.`);
  return templatesByKey;
}

module.exports = { seedEventFormTemplates, TEMPLATE_DEFINITIONS };
