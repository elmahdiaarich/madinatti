const bcrypt = require('bcryptjs')

const logo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

async function seedJobs(prisma, { business }, {
  catInfo, catMarketing, catFinance, catRH,
  catBTP, catVente, catSante, catLogistique,
  catJuridique, catEnseignement
}) {
  // ── RESET JOBS ────────────────────────────────────────────
  await prisma.jobListing.deleteMany({})
  console.log('🗑️  Job listings supprimés')
  // ── USERS BUSINESS ────────────────────────────────────────
  const testPassword = await bcrypt.hash('password123', 10)

  const e1 = await prisma.user.upsert({
    where: { email: 'capgemini@madinatti.ma' },
    update: {},
    create: { name: 'Sara Moussaoui', email: 'capgemini@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Capgemini Maroc', companyLogo: logo('capgemini.com'), companyWebsite: 'https://capgemini.com' }
  })

  const e2 = await prisma.user.upsert({
    where: { email: 'oracle@madinatti.ma' },
    update: {},
    create: { name: 'Hassan Ouali', email: 'oracle@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Oracle Maroc', companyLogo: logo('oracle.com'), companyWebsite: 'https://oracle.com' }
  })

  const e3 = await prisma.user.upsert({
    where: { email: 'iam@madinatti.ma' },
    update: {},
    create: { name: 'Nadia Berrada', email: 'iam@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Maroc Telecom', companyLogo: logo('iam.ma'), companyWebsite: 'https://iam.ma' }
  })

  const e4 = await prisma.user.upsert({
    where: { email: 'attijariwafa@madinatti.ma' },
    update: {},
    create: { name: 'Mehdi Chraibi', email: 'attijariwafa@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Attijariwafa Bank', companyLogo: logo('attijariwafabank.com'), companyWebsite: 'https://attijariwafabank.com' }
  })

  const e5 = await prisma.user.upsert({
    where: { email: 'ocp@madinatti.ma' },
    update: {},
    create: { name: 'Yassine Kettani', email: 'ocp@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'OCP Group', companyLogo: logo('ocpgroup.ma'), companyWebsite: 'https://ocpgroup.ma' }
  })

  const e6 = await prisma.user.upsert({
    where: { email: 'deloitte@madinatti.ma' },
    update: {},
    create: { name: 'Amal Tazi', email: 'deloitte@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Deloitte Maroc', companyLogo: logo('deloitte.com'), companyWebsite: 'https://deloitte.com' }
  })

  const e7 = await prisma.user.upsert({
    where: { email: 'pwc@madinatti.ma' },
    update: {},
    create: { name: 'Rachid Bensouda', email: 'pwc@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'PwC Maroc', companyLogo: logo('pwc.com'), companyWebsite: 'https://pwc.com' }
  })

  const e8 = await prisma.user.upsert({
    where: { email: 'amazon@madinatti.ma' },
    update: {},
    create: { name: 'Fatima Zouheir', email: 'amazon@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Amazon Web Services', companyLogo: logo('aws.amazon.com'), companyWebsite: 'https://aws.amazon.com' }
  })

  const e9 = await prisma.user.upsert({
    where: { email: 'bmce@madinatti.ma' },
    update: {},
    create: { name: 'Karim Sqalli', email: 'bmce@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Bank of Africa', companyLogo: logo('bankofafrica.ma'), companyWebsite: 'https://bankofafrica.ma' }
  })

  const e10 = await prisma.user.upsert({
    where: { email: 'masen@madinatti.ma' },
    update: {},
    create: { name: 'Omar Fassi', email: 'masen@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'MASEN', companyLogo: logo('masen.ma'), companyWebsite: 'https://masen.ma' }
  })

  console.log('✅ Users business créés')

  // ── JOB LISTINGS — 30 offres ──────────────────────────────
  // Format languages : [{ language: "...", level: "..." }]
  // Niveaux : "maternelle" | "courant" | "bon niveau" | "intermédiaire" | "notions"
  // region  : nom de la région marocaine (string)
  // remote  : "ON_SITE" | "REMOTE" | "HYBRID"

  const jobsData = [

    // ── 1 · INFORMATIQUE ──────────────────────────────────
    {
      title: 'Développeur Full Stack React / Node.js',
      user: e1, category: catInfo,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'MID_2_TO_5',
      salaryMin: 8000, salaryMax: 12000, isFeatured: true,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['React', 'Node.js', 'PostgreSQL', 'Git'],
      description: `Développeur Full Stack passionné pour rejoindre notre équipe Agile.

Missions :
- Développer des fonctionnalités front-end avec React.js
- Concevoir des APIs REST avec Node.js / Express
- Travailler en méthode Agile Scrum

Profil :
- 2 ans expérience minimum
- Maîtrise React, Node.js, PostgreSQL`,
    },

    // ── 2
    {
      title: 'Ingénieur DevOps',
      user: e2, category: catInfo,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',
      salaryMin: 15000, salaryMax: 22000, isFeatured: true,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'anglais',  level: 'courant'    },
        { language: 'français', level: 'bon niveau' },
      ],
      skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
      description: `Ingénieur DevOps senior pour notre infrastructure cloud.

Missions :
- Gérer les pipelines CI/CD
- Administrer les clusters Kubernetes
- Automatiser les déploiements cloud AWS

Profil :
- 5+ ans expérience DevOps
- Certifications AWS/Azure souhaitées`,
    },

    // ── 3
    {
      title: 'Architecte Solutions Cloud',
      user: e8, category: catInfo,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'CDI', remote: 'REMOTE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'EXPERT_PLUS_10',
      salaryMin: 25000, salaryMax: 35000, isFeatured: true,
      languages: [
        { language: 'anglais',  level: 'courant'    },
        { language: 'français', level: 'bon niveau' },
        { language: 'arabe',    level: 'maternelle' },
      ],
      skills: ['AWS', 'GCP', 'Azure', 'Architecture', 'Microservices'],
      description: `Architecte Cloud pour accompagner nos clients grands comptes.

Missions :
- Concevoir des architectures cloud scalables
- Accompagner la migration vers AWS
- Définir les patterns d'architecture

Profil :
- 10+ ans expérience
- Certifié AWS Solutions Architect`,
    },

    // ── 4
    {
      title: 'Data Scientist',
      user: e2, category: catInfo,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 12000, salaryMax: 18000, isFeatured: false,
      languages: [
        { language: 'anglais',  level: 'courant'      },
        { language: 'français', level: 'bon niveau'   },
        { language: 'arabe',    level: 'maternelle'   },
      ],
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Power BI'],
      description: `Data Scientist pour notre division Analytics.

Missions :
- Analyser des volumes importants de données
- Construire des modèles prédictifs ML
- Présenter des insights aux stakeholders

Profil :
- Maîtrise Python, R, SQL
- Expérience Machine Learning`,
    },

    // ── 5
    {
      title: 'Développeur Mobile Flutter',
      user: e1, category: catInfo,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDD', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'MID_2_TO_5',
      salaryMin: null, salaryMax: null, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Flutter', 'Dart', 'Firebase', 'REST API'],
      description: `Mission 6 mois — Application mobile cross-platform.

Missions :
- Développer une app Flutter iOS/Android
- Intégrer des APIs REST
- Publier sur App Store et Google Play

Profil :
- Expérience Flutter/Dart requise
- Connaissance Firebase appréciée`,
    },

    // ── 6
    {
      title: 'Stagiaire Développeur Web',
      user: e1, category: catInfo,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'STAGE', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'STUDENT_FRESH_GRAD',
      salaryMin: 2000, salaryMax: 3000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'notions'       },
      ],
      skills: ['HTML', 'CSS', 'JavaScript', 'React'],
      description: `Stage de fin d'études en développement web.

Missions :
- Participer au développement de projets clients
- Apprendre les bonnes pratiques
- Travailler en équipe agile

Profil :
- Étudiant Bac+2/Bac+3
- Bases HTML/CSS/JS`,
    },

    // ── 7 · MARKETING ──────────────────────────────────────
    {
      title: 'Chargé(e) de Marketing Digital',
      user: e3, category: catMarketing,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'MID_2_TO_5',
      salaryMin: 5000, salaryMax: 7000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Social Media', 'SEO', 'Copywriting', 'Google Analytics'],
      description: `Chargé Marketing Digital pour nos campagnes digitales.

Missions :
- Gérer les réseaux sociaux
- Créer du contenu engageant
- Analyser les performances des campagnes

Profil :
- Maîtrise des outils digitaux
- Créatif et analytique`,
    },

    // ── 8
    {
      title: 'Chef de Projet Marketing',
      user: e4, category: catMarketing,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 10000, salaryMax: 14000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'bon niveau' },
      ],
      skills: ['Gestion de projet', 'Marketing Mix', 'CRM', 'Budgeting'],
      description: `Chef de Projet Marketing pour nos campagnes nationales.

Missions :
- Piloter les campagnes marketing
- Coordonner avec les agences créatives
- Mesurer les ROI

Profil :
- Bac+5 marketing/commerce
- Expérience bancaire appréciée`,
    },

    // ── 9
    {
      title: 'Community Manager Freelance',
      user: e3, category: catMarketing,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'FREELANCE', remote: 'REMOTE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: 3000, salaryMax: 5000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Facebook', 'Instagram', 'TikTok', 'Canva'],
      description: `Community manager freelance pour nos marques.

Missions :
- Animer les communautés en ligne
- Créer du contenu viral
- Modérer commentaires et messages

Profil :
- Maîtrise Facebook, Instagram, TikTok
- Sens créatif développé`,
    },

    // ── 10 · FINANCE ───────────────────────────────────────
    {
      title: 'Analyste Financier',
      user: e4, category: catFinance,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 12000, salaryMax: 17000, isFeatured: true,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'bon niveau' },
      ],
      skills: ['Analyse Financière', 'Excel', 'Modélisation', 'PowerPoint'],
      description: `Analyste Financier — Direction des Risques.

Missions :
- Analyse des états financiers
- Modélisation financière
- Reporting mensuel à la direction

Profil :
- Grande école de commerce
- Maîtrise Excel avancé`,
    },

    // ── 11
    {
      title: 'Contrôleur de Gestion',
      user: e3, category: catFinance,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 11000, salaryMax: 15000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Contrôle de gestion', 'SAP', 'Excel', 'Budget', 'Reporting'],
      description: `Contrôleur de gestion pour la direction financière.

Missions :
- Élaborer les budgets et forecasts
- Analyser les écarts
- Produire les tableaux de bord

Profil :
- Bac+5 Finance/Gestion
- 3+ ans en contrôle de gestion`,
    },

    // ── 12
    {
      title: 'Comptable — Temps Partiel',
      user: e7, category: catFinance,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'TEMPS_PARTIEL', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: null, salaryMax: null, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'bon niveau' },
      ],
      skills: ['Comptabilité', 'Sage', 'Excel', 'Saisie'],
      description: `Comptable temps partiel (20h/semaine).

Missions :
- Saisie comptable
- Rapprochements bancaires
- Classement et archivage

Profil :
- BTS Comptabilité
- Disponible matin ou après-midi`,
    },

    // ── 13 · RH ─────────────────────────────────────────────
    {
      title: 'Responsable RH',
      user: e5, category: catRH,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',
      salaryMin: 9000, salaryMax: 13000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Recrutement', 'Paie', 'Droit du travail', 'GPEC'],
      description: `Responsable RH groupe industriel.

Missions :
- Recrutement et intégration
- Paie et déclarations sociales
- Politique de formation

Profil :
- Bac+5 GRH ou équivalent
- 5+ ans expérience RH`,
    },

    // ── 14
    {
      title: 'Chargé(e) de Recrutement',
      user: e1, category: catRH,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: 5500, salaryMax: 7500, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Recrutement', 'LinkedIn Recruiter', 'ATS', 'Entretien'],
      description: `Chargé Recrutement pour nos profils IT.

Missions :
- Sourcing et sélection de candidats
- Conduite d'entretiens
- Gestion des offres et contrats

Profil :
- Première expérience en recrutement
- Bonne connaissance des métiers IT`,
    },

    // ── 15
    {
      title: 'RH Anapec — Assistant RH',
      user: e3, category: catRH,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'ANAPEC', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'STUDENT_FRESH_GRAD',
      salaryMin: null, salaryMax: null, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'bon niveau' },
      ],
      skills: ['Administration RH', 'Excel', 'Communication'],
      description: `Poste dans le cadre du contrat Idmaj ANAPEC.

Missions :
- Appui à la gestion administrative du personnel
- Suivi des dossiers collaborateurs
- Archivage et classement

Profil :
- Jeune diplômé Bac+2
- Inscrit à l'ANAPEC`,
    },

    // ── 16 · BTP ───────────────────────────────────────────
    {
      title: 'Ingénieur Génie Civil',
      user: e5, category: catBTP,
      location: 'Marrakech', region: 'Marrakech-Safi',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 10000, salaryMax: 15000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['AutoCAD', 'Gestion de chantier', 'Béton armé', 'Revit'],
      description: `Ingénieur génie civil pour nos projets infrastructure.

Missions :
- Superviser les chantiers
- Élaborer les plans techniques
- Assurer conformité aux normes

Profil :
- Diplôme ingénieur GC
- 3+ ans en chantier`,
    },

    // ── 17
    {
      title: 'Architecte DESA',
      user: e5, category: catBTP,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: null, salaryMax: null, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'bon niveau' },
      ],
      skills: ['AutoCAD', 'Revit', 'SketchUp', 'ArchiCAD'],
      description: `Architecte pour nos projets résidentiels haut de gamme.

Missions :
- Conception de projets résidentiels
- Suivi de chantier
- Relation client

Profil :
- DESA Architecture
- Maîtrise AutoCAD, Revit, SketchUp`,
    },

    // ── 18
    {
      title: 'Ingénieur Énergie Renouvelable',
      user: e10, category: catBTP,
      location: 'Ouarzazate', region: 'Drâa-Tafilalet',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 12000, salaryMax: 18000, isFeatured: true,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'bon niveau' },
      ],
      skills: ['Énergie solaire', 'AutoCAD', 'PVsyst', 'Gestion de projet'],
      description: `Ingénieur spécialisé énergies renouvelables.

Missions :
- Concevoir des installations solaires photovoltaïques
- Suivre les chantiers éoliens
- Rédiger les études de faisabilité

Profil :
- Ingénieur énergie/électrotechnique
- Connaissance des normes CEI`,
    },

    // ── 19
    {
      title: 'Électricien Industriel',
      user: e5, category: catBTP,
      location: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC', experienceLevel: 'MID_2_TO_5',
      salaryMin: null, salaryMax: null, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'intermédiaire' },
      ],
      skills: ['Électricité industrielle', 'Automates', 'Maintenance', 'Normes NF'],
      description: `Électricien industriel pour site de production.

Missions :
- Installation et maintenance électrique
- Dépannage des équipements
- Respect des normes sécurité

Profil :
- BEP/BAC électrotechnique
- Habilitation électrique`,
    },

    // ── 20 · VENTE ──────────────────────────────────────────
    {
      title: 'Commercial Terrain B2B',
      user: e3, category: catVente,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: 5000, salaryMax: 9000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'notions'       },
      ],
      skills: ['Vente B2B', 'Négociation', 'CRM', 'Prospection'],
      description: `Commercial terrain portefeuille entreprises.

Missions :
- Prospection et développement du portefeuille
- Vente de solutions télécom B2B
- Fidélisation des clients

Profil :
- Permis B requis
- Bon négociateur`,
    },

    // ── 21
    {
      title: 'Key Account Manager',
      user: e2, category: catVente,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',
      salaryMin: 18000, salaryMax: 28000, isFeatured: true,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'courant'    },
      ],
      skills: ['Vente B2B', 'Négociation grands comptes', 'CRM Salesforce', 'ERP'],
      description: `Key Account Manager grands comptes.

Missions :
- Gérer et développer les grands comptes
- Vente de licences et services
- Coordination avec les équipes techniques

Profil :
- 5+ ans vente logiciels B2B
- Réseau grands comptes établi`,
    },

    // ── 22
    {
      title: 'Conseiller Clientèle Bancaire',
      user: e9, category: catVente,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: 5500, salaryMax: 7500, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Relation client', 'Vente', 'Produits bancaires', 'CRM'],
      description: `Conseiller Clientèle Particuliers.

Missions :
- Accueil et conseil des clients
- Vente de produits bancaires
- Gestion du portefeuille clients

Profil :
- Bac+3 Banque/Finance
- Sens du service client`,
    },

    // ── 23
    {
      title: 'Commercial Anapec — Chargé de Clientèle',
      user: e3, category: catVente,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'ANAPEC', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'STUDENT_FRESH_GRAD',
      salaryMin: 2800, salaryMax: 3500, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'bon niveau' },
      ],
      skills: ['Relation client', 'Vente', 'Communication'],
      description: `Poste Idmaj ANAPEC — Chargé de clientèle.

Missions :
- Accueil et conseil clientèle
- Vente de services
- Gestion des réclamations

Profil :
- Jeune diplômé Bac+2
- Inscrit à l'ANAPEC`,
    },

    // ── 24 · SANTÉ ──────────────────────────────────────────
    {
      title: 'Médecin Généraliste',
      user: e5, category: catSante,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 15000, salaryMax: 25000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
      ],
      skills: ['Médecine générale', 'Diagnostic', 'Urgences'],
      description: `Médecin généraliste pour clinique privée.

Missions :
- Consultations de médecine générale
- Suivi des patients
- Coordination avec les spécialistes

Profil :
- Doctorat en médecine
- Inscrit au conseil de l'Ordre`,
    },

    // ── 25
    {
      title: 'Infirmier(ère) Diplômé(e) d\'État',
      user: e5, category: catSante,
      location: 'Rabat', region: 'Rabat-Salé-Kénitra',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'JUNIOR_LESS_2',
      salaryMin: 5000, salaryMax: 7000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'bon niveau' },
      ],
      skills: ['Soins infirmiers', 'Urgences', 'Prise en charge'],
      description: `Infirmier pour service médecine interne.

Missions :
- Soins infirmiers
- Suivi des patients
- Administration des traitements

Profil :
- Diplôme d'État infirmier
- Bon sens relationnel`,
    },

    // ── 26 · LOGISTIQUE ────────────────────────────────────
    {
      title: 'Responsable Logistique Supply Chain',
      user: e5, category: catLogistique,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',
      salaryMin: 12000, salaryMax: 16000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['Supply Chain', 'WMS', 'Transport', 'Management'],
      description: `Responsable Logistique Supply Chain groupe.

Missions :
- Piloter la chaîne logistique
- Optimiser les coûts de transport
- Manager l'équipe entrepôt

Profil :
- Bac+5 Logistique
- 5+ ans expérience`,
    },

    // ── 27
    {
      title: 'Agent de Transit Douanier',
      user: e5, category: catLogistique,
      location: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_2', experienceLevel: 'MID_2_TO_5',
      salaryMin: 6000, salaryMax: 9000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'bon niveau'    },
        { language: 'espagnol', level: 'intermédiaire' },
      ],
      skills: ['Transit', 'Douane', 'Incoterms', 'Import/Export'],
      description: `Agent de transit import/export port de Tanger.

Missions :
- Gestion des formalités douanières
- Suivi des dossiers import/export
- Relation avec les autorités portuaires

Profil :
- BTS Commerce International
- Connaissance réglementation douanière`,
    },

    // ── 28 · JURIDIQUE ─────────────────────────────────────
    {
      title: 'Juriste d\'Entreprise',
      user: e4, category: catJuridique,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',
      salaryMin: 11000, salaryMax: 15000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'bon niveau' },
      ],
      skills: ['Droit des affaires', 'Contrats', 'Compliance', 'OHADA'],
      description: `Juriste Entreprise — Direction Juridique.

Missions :
- Rédaction et analyse de contrats
- Veille juridique et réglementaire
- Conseil aux opérationnels

Profil :
- Master 2 Droit des affaires
- Expérience en banque ou cabinet`,
    },

    // ── 29 · ENSEIGNEMENT ──────────────────────────────────
    {
      title: 'Formateur Développement Web',
      user: e1, category: catEnseignement,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'HYBRID',
      educationLevel: 'BAC_PLUS_3', experienceLevel: 'MID_2_TO_5',
      salaryMin: 7000, salaryMax: 10000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle'    },
        { language: 'français', level: 'courant'       },
        { language: 'anglais',  level: 'intermédiaire' },
      ],
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Pédagogie'],
      description: `Formateur développement web pour école de coding.

Missions :
- Animer des formations HTML/CSS/JS/React
- Accompagner les apprenants
- Créer des supports pédagogiques

Profil :
- 3+ ans dev web
- Pédagogie et patience`,
    },

    // ── 30
    {
      title: 'Responsable Compliance & AML',
      user: e4, category: catJuridique,
      location: 'Casablanca', region: 'Casablanca-Settat',
      contractType: 'CDI', remote: 'ON_SITE',
      educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',
      salaryMin: 15000, salaryMax: 20000, isFeatured: false,
      languages: [
        { language: 'arabe',    level: 'maternelle' },
        { language: 'français', level: 'courant'    },
        { language: 'anglais',  level: 'courant'    },
      ],
      skills: ['Compliance', 'AML', 'KYC', 'Réglementation BAM'],
      description: `Responsable Conformité & Lutte Anti-Blanchiment.

Missions :
- Piloter le dispositif LCB-FT
- Former les équipes
- Reporting à Bank Al-Maghrib

Profil :
- Expert compliance bancaire
- Certifié CAMS apprécié`,
    },
  ]

  // ── CRÉER LES JOBS ────────────────────────────────────────
  let count = 0
  for (const job of jobsData) {
    await prisma.jobListing.create({
      data: {
        userId:              job.user.id,
        categoryId:          job.category.id,
        title:               job.title,
        companyName:         job.user.companyName,
        location:            job.location,
        region:              job.region,
        contractType:        job.contractType,
        remote:              job.remote,
        educationLevel:      job.educationLevel,
        experienceLevel:     job.experienceLevel,
        salaryMin:           job.salaryMin,
        salaryMax:           job.salaryMax,
        salaryPeriod:        'MONTHLY',
        description:         job.description,
        skills:              job.skills,
        languages:           job.languages,
        status:              'PUBLISHED',
        isFeatured:          job.isFeatured ?? false,
        publishedAt:         new Date(),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    count++
  }

  console.log(`✅ ${count} Job listings créés`)
  console.log('')
  console.log('📋 Comptes de test :')
  console.log('   admin@madinatti.ma        / admin123')
  console.log('   capgemini@madinatti.ma    / password123  (Capgemini)')
  console.log('   oracle@madinatti.ma       / password123  (Oracle)')
  console.log('   iam@madinatti.ma          / password123  (Maroc Telecom)')
  console.log('   attijariwafa@madinatti.ma / password123  (Attijariwafa Bank)')
  console.log('   ocp@madinatti.ma          / password123  (OCP Group)')
  console.log('   deloitte@madinatti.ma     / password123  (Deloitte)')
  console.log('   pwc@madinatti.ma          / password123  (PwC)')
  console.log('   amazon@madinatti.ma       / password123  (AWS)')
  console.log('   bmce@madinatti.ma         / password123  (Bank of Africa)')
  console.log('   masen@madinatti.ma        / password123  (MASEN)')
  console.log('')
  console.log('🌱 Seed terminé avec succès !')
}

module.exports = { seedJobs }