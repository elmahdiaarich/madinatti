// backend/prisma/seeds/workerProfiles.seed.js
async function seedWorkerProfiles(prisma, categories) {
  console.log('🌱 Seeding worker profiles...');

  const mj = categories['mini-jobs'];
  const babysitting = mj.babysitting;
  const plomberie = mj.plomberie;
  const electricite = mj.electricite;
  const menage = mj.menage;
  const jardinage = mj.jardinage;
  const demenagement = mj.demenagement;
  const bricolage = mj.bricolage; // regroupe: bricolage, serrurerie, vitrerie, carrelage
  const peinture = mj.peinture;
  const climatisation = mj.climatisation;
  const coiffureBeaute = mj['coiffure-beaute'];
  const aidePersonnesAgees = mj['aide-personnes-agees'];
  const coursParticuliers = mj['cours-particuliers'];
  const evenementiel = mj.evenementiel; // regroupe: traiteur, photographe, couture
  const chauffeur = mj.chauffeur;
  const livraison = mj.livraison;
  const depannageInformatique = mj['depannage-informatique'];

  const requiredCats = {
    babysitting, plomberie, electricite, menage, jardinage, demenagement, bricolage,
    peinture, climatisation,
    coiffureBeaute, aidePersonnesAgees, coursParticuliers, evenementiel,
    chauffeur, livraison, depannageInformatique,
  };
  const missing = Object.entries(requiredCats).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.warn(`[workerProfiles.seed] Catégories mini-jobs manquantes: ${missing.join(', ')}`);
    return;
  }

  const citizens = await prisma.user.findMany({
    where: { role: { name: 'citizen' } },
    take: 10,
  });
  if (citizens.length === 0) {
    console.warn('[workerProfiles.seed] Aucun utilisateur citizen trouvé — seed ignoré.');
    return;
  }
  const ownerAt = (i) => citizens[i % citizens.length].id;

  const menPhoto   = (n) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
  const womenPhoto = (n) => `https://randomuser.me/api/portraits/women/${n}.jpg`;
  const portfolio  = (seed, count = 3) =>
    Array.from({ length: count }, (_, i) => ({ url: `https://picsum.photos/seed/${seed}-${i}/500/400` }));

  const profiles = [
    // ── Babysitting ──────────────────────────────────────────────────────
    {
      userId: ownerAt(0), categoryId: babysitting.id,
      headline: 'Baby-sitter expérimentée, disponible soirs et week-ends',
      description: "5 ans d'expérience avec des enfants de 2 à 10 ans. Formation premiers secours. Références disponibles.",
      city: 'Casablanca', pricingUnit: 'HOUR', rate: 40, yearsExperience: 5,
      photo: womenPhoto(44), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.8, ratingCount: 12,
    },
    {
      userId: ownerAt(1), categoryId: babysitting.id,
      headline: 'كنعتني بالدراري ب صبر و محبة',
      description: 'عندي تجربة ديال 3 سنين فـ رعاية الأطفال، كنعرف نلعب معاهم و نعاونهم فـ الواجبات. متوفرة نهار و ليل.',
      city: 'Rabat', pricingUnit: 'HOUR', rate: 35, yearsExperience: 3,
      photo: womenPhoto(68), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.5, ratingCount: 7,
    },

    // ── Plomberie ────────────────────────────────────────────────────────
    {
      userId: ownerAt(2), categoryId: plomberie.id,
      headline: 'Plombier - interventions rapides 7j/7',
      description: 'Fuites, débouchage, installation sanitaire. Devis gratuit, déplacement inclus.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 150, yearsExperience: 8,
      photo: menPhoto(15), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('plomberie-rabat'),
      ratingAvg: 4.6, ratingCount: 21,
    },
    {
      userId: ownerAt(3), categoryId: plomberie.id,
      headline: 'غسال، كنصلح التسريب و الأنابيب بسرعة',
      description: 'خدمة نظيفة و سريعة، كنجي فـ نفس النهار. تجربة ديال 6 سنين فـ الدارالبيضاء.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 130, yearsExperience: 6,
      photo: menPhoto(23), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.3, ratingCount: 9,
    },

    // ── Électricité ──────────────────────────────────────────────────────
    {
      userId: ownerAt(4), categoryId: electricite.id,
      headline: 'Électricien certifié - dépannage et installation',
      description: 'Pannes électriques, mise aux normes, installation de prises et luminaires.',
      city: 'Marrakech', pricingUnit: 'DAY', rate: 400, yearsExperience: 6,
      photo: menPhoto(31), status: 'PENDING',
    },
    {
      userId: ownerAt(0), categoryId: electricite.id,
      headline: 'كهربائي، تركيب و تصليح فـ الوقت',
      description: 'كنخدم مزيان و ب أثمنة معقولة، تجربة كبيرة فـ التمديدات الكهربائية للمنازل و المحلات.',
      city: 'Fès', pricingUnit: 'HOUR', rate: 60, yearsExperience: 4,
      photo: menPhoto(52), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.1, ratingCount: 5,
    },

    // ── Ménage ───────────────────────────────────────────────────────────
    {
      userId: ownerAt(1), categoryId: menage.id,
      headline: 'Service de ménage complet, disponible du lundi au samedi',
      description: 'Ménage à domicile, repassage, nettoyage en profondeur. Produits fournis sur demande.',
      city: 'Casablanca', pricingUnit: 'HOUR', rate: 30, yearsExperience: 7,
      photo: womenPhoto(12), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.9, ratingCount: 34,
    },
    {
      userId: ownerAt(2), categoryId: menage.id,
      headline: 'خدامة ديال الفراش، نظيفة و مسؤولة',
      description: 'كندير الفراش الكامل، الطبخ، الغسيل. متوفرة صباحا حتى العشية.',
      city: 'Tanger', pricingUnit: 'DAY', rate: 200, yearsExperience: 5,
      photo: womenPhoto(56), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.4, ratingCount: 11,
    },

    // ── Jardinage ────────────────────────────────────────────────────────
    {
      userId: ownerAt(3), categoryId: jardinage.id,
      headline: "Jardinier paysagiste - entretien et création d'espaces verts",
      description: 'Taille de haies, tonte, plantation, arrosage automatique. Interventions ponctuelles ou régulières.',
      city: 'Rabat', pricingUnit: 'DAY', rate: 350, yearsExperience: 10,
      photo: menPhoto(41), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('jardinage-rabat', 4),
      ratingAvg: 4.7, ratingCount: 16,
    },
    {
      userId: ownerAt(4), categoryId: jardinage.id,
      headline: 'كنعتني بالجنان، قص و سقي و تنظيف',
      description: 'خدمة ديال الجنان الصغيرة و الكبيرة، ب ثمن مناسب.',
      city: 'Marrakech', pricingUnit: 'TASK', rate: 180, yearsExperience: 3,
      photo: menPhoto(19), status: 'PENDING',
    },

    // ── Déménagement ─────────────────────────────────────────────────────
    {
      userId: ownerAt(0), categoryId: demenagement.id,
      headline: 'Équipe de déménagement - camion inclus',
      description: 'Déménagement rapide et soigné, avec camion et matériel de protection. Devis gratuit.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 600, isNegotiable: true, yearsExperience: 5,
      photo: menPhoto(27), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.2, ratingCount: 8,
    },
    {
      userId: ownerAt(1), categoryId: demenagement.id,
      headline: 'خدمة ديال الطونوبيل، كنهضرو الطوموبيلات بسرعة',
      description: 'عندي كامیو صغير، كنعاون فـ الديمينجمان ديال الشقق و الاستوديوهات.',
      city: 'Salé', pricingUnit: 'TASK', rate: 450, yearsExperience: 4,
      photo: menPhoto(38), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.0, ratingCount: 6,
    },

    // ── Bricolage & Petites Réparations ──────────────────────────────────
    // (regroupe les anciens profils bricolage, serrurerie, vitrerie, carrelage)
    {
      userId: ownerAt(2), categoryId: bricolage.id,
      headline: 'Homme à tout faire - montage meubles, petites réparations',
      description: "Montage IKEA, fixation d'étagères, petites réparations électriques et plomberie de base. Outils fournis.",
      city: 'Rabat', pricingUnit: 'HOUR', rate: 45, yearsExperience: 9,
      photo: menPhoto(50), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('bricolage-rabat'),
      ratingAvg: 4.6, ratingCount: 19,
    },
    {
      userId: ownerAt(3), categoryId: bricolage.id,
      headline: 'كنصلح كل شي فـ الدار، بريكولاج عام',
      description: 'تركيب الرفوف، تصليح الأبواب و الشبابيك، صباغة صغيرة.',
      city: 'Fès', pricingUnit: 'TASK', rate: 100, yearsExperience: 2,
      photo: menPhoto(63), status: 'PENDING',
    },
    {
      userId: ownerAt(3), categoryId: bricolage.id,
      headline: 'Serrurier - ouverture de porte, changement de serrure',
      description: 'Intervention rapide 24/7, ouverture de porte sans dégât, tous types de serrures.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 200, yearsExperience: 10,
      photo: menPhoto(32), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.6, ratingCount: 18,
    },
    {
      userId: ownerAt(4), categoryId: bricolage.id,
      headline: 'كنفتح الباب دغيا، عندي أدوات كاملة',
      description: 'خدمة ديال الفتح و التبديل ديال السركلة، بلا خسارة فـ الباب.',
      city: 'Tanger', pricingUnit: 'TASK', rate: 150, yearsExperience: 5,
      photo: menPhoto(39), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.3, ratingCount: 7,
    },
    {
      userId: ownerAt(0), categoryId: bricolage.id,
      headline: 'Vitrier - remplacement de vitres cassées, devis rapide',
      description: 'Remplacement de vitres simples et doubles vitrages, mesure et pose incluses.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 250, yearsExperience: 8,
      photo: menPhoto(47), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.4, ratingCount: 10,
    },
    {
      userId: ownerAt(1), categoryId: bricolage.id,
      headline: 'كنبدل الزجاج ديال الشبابيك بسرعة',
      description: 'خدمة نظيفة، كنقيس و كنركب الزجاج فنفس النهار.',
      city: 'Salé', pricingUnit: 'TASK', rate: 180, yearsExperience: 4,
      photo: womenPhoto(29), status: 'PENDING',
    },
    {
      userId: ownerAt(2), categoryId: bricolage.id,
      headline: 'Carreleur maçon - pose de carrelage, petits travaux de maçonnerie',
      description: "Pose de carrelage, faïence, réparations de murs. 12 ans d'expérience, chantiers soignés.",
      city: 'Marrakech', pricingUnit: 'TASK', rate: 500, yearsExperience: 12,
      photo: menPhoto(58), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('carrelage-marrakech', 4),
      ratingAvg: 4.8, ratingCount: 22,
    },
    {
      userId: ownerAt(3), categoryId: bricolage.id,
      headline: 'كنركب الزليج و كندير الخدمة ديال البناء الصغيرة',
      description: 'خدمة نظيفة و دقيقة، تجربة كبيرة فـ البناء و الزليج.',
      city: 'Fès', pricingUnit: 'DAY', rate: 300, yearsExperience: 6,
      photo: menPhoto(61), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.3, ratingCount: 9,
    },

    // ── Peinture ─────────────────────────────────────────────────────────
    {
      userId: ownerAt(4), categoryId: peinture.id,
      headline: 'Peintre professionnel - finitions soignées, intérieur/extérieur',
      description: 'Peinture de qualité, préparation des murs incluse, respect des délais. Devis gratuit.',
      city: 'Casablanca', pricingUnit: 'HOUR', rate: 50, yearsExperience: 7,
      photo: menPhoto(5), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.7, ratingCount: 14,
    },
    {
      userId: ownerAt(0), categoryId: peinture.id,
      headline: 'كنصبغ الدور بجودة و بثمن مزيان',
      description: 'خبرة فـ الصباغة الداخلية و الخارجية، خدمة نظيفة و منظمة.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 300, yearsExperience: 4,
      photo: womenPhoto(8), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.2, ratingCount: 6,
    },

    // ── Climatisation & Chauffage ────────────────────────────────────────
    {
      userId: ownerAt(1), categoryId: climatisation.id,
      headline: 'Installation et entretien climatiseurs, service rapide',
      description: 'Installation, nettoyage, recharge de gaz, dépannage toutes marques.',
      city: 'Marrakech', pricingUnit: 'DAY', rate: 350, yearsExperience: 6,
      photo: menPhoto(9), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('clim-marrakech'),
      ratingAvg: 4.5, ratingCount: 13,
    },
    {
      userId: ownerAt(2), categoryId: climatisation.id,
      headline: 'كنصلح الكليما و السخان، خدمة ديال الصيف',
      description: 'كنجي بسرعة، خدمة نظيفة و ب ثمن معقول.',
      city: 'Fès', pricingUnit: 'HOUR', rate: 70, yearsExperience: 3,
      photo: menPhoto(24), status: 'PENDING',
    },

    // ── Coiffure & Beauté à Domicile ─────────────────────────────────────
    {
      userId: ownerAt(4), categoryId: coiffureBeaute.id,
      headline: 'Coiffeuse à domicile - coupe, brushing, coiffure mariée',
      description: 'Services de coiffure et maquillage à domicile pour toutes occasions, spécialiste coiffure mariée.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 200, yearsExperience: 5,
      photo: womenPhoto(35), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('coiffure-casa'),
      ratingAvg: 4.9, ratingCount: 27,
    },
    {
      userId: ownerAt(0), categoryId: coiffureBeaute.id,
      headline: 'كنسرح و كنزين فالدار، خدمة ديال العروسات',
      description: 'خدمة كاملة ديال التزيين للمناسبات، فالدار ولا فمكان اخر.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 350, yearsExperience: 7,
      photo: womenPhoto(49), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.6, ratingCount: 15,
    },

    // ── Aide aux Personnes Âgées ─────────────────────────────────────────
    {
      userId: ownerAt(1), categoryId: aidePersonnesAgees.id,
      headline: 'Aide à domicile pour personnes âgées - accompagnement, soins de base',
      description: 'Accompagnement quotidien, aide aux repas et déplacements, présence rassurante et bienveillante.',
      city: 'Rabat', pricingUnit: 'HOUR', rate: 45, yearsExperience: 9,
      photo: womenPhoto(60), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.9, ratingCount: 20,
    },
    {
      userId: ownerAt(2), categoryId: aidePersonnesAgees.id,
      headline: 'كنعاون الشيوخ فالدار، صبورة و مسؤولة',
      description: 'كنعاون فالماكلة، الخروج، و الرفقة اليومية.',
      city: 'Fès', pricingUnit: 'DAY', rate: 250, yearsExperience: 4,
      photo: womenPhoto(71), status: 'PENDING',
    },

    // ── Cours Particuliers ───────────────────────────────────────────────
    {
      userId: ownerAt(3), categoryId: coursParticuliers.id,
      headline: 'Professeur de mathématiques - collège et lycée, préparation examens',
      description: 'Cours particuliers en mathématiques, méthodologie et préparation aux examens nationaux.',
      city: 'Casablanca', pricingUnit: 'HOUR', rate: 100, yearsExperience: 6,
      photo: menPhoto(70), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.7, ratingCount: 16,
    },
    {
      userId: ownerAt(4), categoryId: coursParticuliers.id,
      headline: 'كنعطي دروس ديال الفرنسية للصغار',
      description: 'دروس ديال الدعم فالفرنسية للابتدائي و الإعدادي.',
      city: 'Marrakech', pricingUnit: 'HOUR', rate: 80, yearsExperience: 3,
      photo: womenPhoto(85), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.4, ratingCount: 8,
    },

    // ── Services Événementiels ───────────────────────────────────────────
    // (regroupe les anciens profils traiteur, photographe, couture)
    {
      userId: ownerAt(0), categoryId: evenementiel.id,
      headline: 'Traiteur - cuisine marocaine traditionnelle pour événements',
      description: 'Préparation de plats traditionnels pour mariages, fêtes et réceptions. Menus personnalisables.',
      city: 'Fès', pricingUnit: 'TASK', rate: 800, isNegotiable: true, yearsExperience: 15,
      photo: womenPhoto(17), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('traiteur-fes', 4),
      ratingAvg: 4.9, ratingCount: 31,
    },
    {
      userId: ownerAt(1), categoryId: evenementiel.id,
      headline: 'كنطيب لعروسات و لمناسبات، طبخ بلدي',
      description: 'خدمة ديال الطبخ التقليدي المغربي بكميات كبيرة للمناسبات.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 600, yearsExperience: 10,
      photo: womenPhoto(91), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.5, ratingCount: 12,
    },
    {
      userId: ownerAt(2), categoryId: evenementiel.id,
      headline: 'Photographe événementiel - mariages, anniversaires, portraits',
      description: 'Couverture complète de vos événements, retouche incluse, livraison rapide des photos.',
      city: 'Marrakech', pricingUnit: 'TASK', rate: 1200, isNegotiable: true, yearsExperience: 8,
      photo: menPhoto(77), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('photographe-marrakech', 5),
      ratingAvg: 4.8, ratingCount: 24,
    },
    {
      userId: ownerAt(3), categoryId: evenementiel.id,
      headline: 'كنصور لمناسبات بثمن معقول',
      description: 'خدمة ديال التصوير للأعراس و الحفلات الصغيرة.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 500, yearsExperience: 3,
      photo: menPhoto(83), status: 'PENDING',
    },
    {
      userId: ownerAt(4), categoryId: evenementiel.id,
      headline: 'Couturière - retouches, confection sur mesure',
      description: 'Retouches de vêtements, confection sur mesure, ourlets, ajustements rapides.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 100, yearsExperience: 12,
      photo: womenPhoto(95), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.6, ratingCount: 17,
    },
    {
      userId: ownerAt(0), categoryId: evenementiel.id,
      headline: 'كنخيط و كندير الروتوش ديال الحوايج',
      description: 'خدمة سريعة و دقيقة ديال التفصيل و التصليح.',
      city: 'Tanger', pricingUnit: 'TASK', rate: 80, yearsExperience: 6,
      photo: womenPhoto(21), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.2, ratingCount: 6,
    },

    // ── Chauffeur Privé ──────────────────────────────────────────────────
    {
      userId: ownerAt(1), categoryId: chauffeur.id,
      headline: 'Chauffeur privé - trajets aéroport, déplacements professionnels',
      description: 'Véhicule confortable et climatisé, ponctualité garantie, disponible pour trajets longs.',
      city: 'Casablanca', pricingUnit: 'HOUR', rate: 80, yearsExperience: 7,
      photo: menPhoto(90), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.7, ratingCount: 20,
    },
    {
      userId: ownerAt(2), categoryId: chauffeur.id,
      headline: 'كنسوق ب طوموبيلة نظيفة، ثقة و احترام',
      description: 'خدمة ديال التنقل اليومي و التوصيل للمطار.',
      city: 'Rabat', pricingUnit: 'DAY', rate: 400, yearsExperience: 5,
      photo: menPhoto(84), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.4, ratingCount: 9,
    },

    // ── Livraison & Courses ──────────────────────────────────────────────
    {
      userId: ownerAt(3), categoryId: livraison.id,
      headline: 'Livraison rapide - colis, courses, documents',
      description: 'Livraison le jour même en ville, scooter disponible, service ponctuel ou régulier.',
      city: 'Casablanca', pricingUnit: 'TASK', rate: 30, yearsExperience: 2,
      photo: menPhoto(20), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.3, ratingCount: 11,
    },
    {
      userId: ownerAt(4), categoryId: livraison.id,
      headline: 'كندير التوصيل ديال الحوائج بسرعة',
      description: 'خدمة ديال التوصيل داخل المدينة، سريعة و موثوقة.',
      city: 'Salé', pricingUnit: 'TASK', rate: 25, yearsExperience: 1,
      photo: menPhoto(28), status: 'PENDING',
    },

    // ── Dépannage Informatique ───────────────────────────────────────────
    {
      userId: ownerAt(0), categoryId: depannageInformatique.id,
      headline: 'Technicien informatique - réparation PC, installation logiciels, réseaux',
      description: 'Réparation de pannes matérielles et logicielles, installation de réseaux, dépannage à domicile.',
      city: 'Rabat', pricingUnit: 'TASK', rate: 200, yearsExperience: 9,
      photo: menPhoto(36), status: 'APPROVED', publishedAt: new Date(),
      portfolioImages: portfolio('depannage-rabat'),
      ratingAvg: 4.6, ratingCount: 15,
    },
    {
      userId: ownerAt(1), categoryId: depannageInformatique.id,
      headline: 'كنصلح الكمبيوتر و كنثبت البرامج',
      description: 'خدمة سريعة و ب ثمن معقول ديال المشاكل التقنية.',
      city: 'Fès', pricingUnit: 'HOUR', rate: 60, yearsExperience: 4,
      photo: womenPhoto(40), status: 'APPROVED', publishedAt: new Date(),
      ratingAvg: 4.1, ratingCount: 5,
    },
  ];

  let created = 0;
  for (const profile of profiles) {
    const exists = await prisma.workerProfile.findFirst({
      where: { userId: profile.userId, categoryId: profile.categoryId, headline: profile.headline },
    });
    if (!exists) {
      await prisma.workerProfile.create({ data: profile });
      created++;
    }
  }
  console.log(`  ✅ ${created} profil(s) prestataire créé(s) (${profiles.length - created} déjà existants).`);
}

module.exports = { seedWorkerProfiles };