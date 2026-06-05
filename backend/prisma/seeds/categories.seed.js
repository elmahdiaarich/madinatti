async function seedCategories(prisma) {
  const catInfo         = await prisma.category.upsert({ where: { slug: 'informatique' },  update: {}, create: { name: 'Informatique & Tech',        slug: 'informatique'  } })
  const catMarketing    = await prisma.category.upsert({ where: { slug: 'marketing' },     update: {}, create: { name: 'Marketing & Communication',   slug: 'marketing'     } })
  const catFinance      = await prisma.category.upsert({ where: { slug: 'finance' },       update: {}, create: { name: 'Finance & Comptabilité',      slug: 'finance'       } })
  const catRH           = await prisma.category.upsert({ where: { slug: 'rh' },            update: {}, create: { name: 'Ressources Humaines',          slug: 'rh'            } })
  const catBTP          = await prisma.category.upsert({ where: { slug: 'btp' },           update: {}, create: { name: 'BTP & Travaux',               slug: 'btp'           } })
  const catVente        = await prisma.category.upsert({ where: { slug: 'vente' },         update: {}, create: { name: 'Vente & Commerce',            slug: 'vente'         } })
  const catSante        = await prisma.category.upsert({ where: { slug: 'sante' },         update: {}, create: { name: 'Santé & Médical',             slug: 'sante'         } })
  const catLogistique   = await prisma.category.upsert({ where: { slug: 'logistique' },    update: {}, create: { name: 'Logistique & Transport',      slug: 'logistique'    } })
  const catJuridique    = await prisma.category.upsert({ where: { slug: 'juridique' },     update: {}, create: { name: 'Juridique & Droit',           slug: 'juridique'     } })
  const catEnseignement = await prisma.category.upsert({ where: { slug: 'enseignement' },  update: {}, create: { name: 'Enseignement & Formation',    slug: 'enseignement'  } })
  console.log('✅ Categories created')

  return {
    catInfo,
    catMarketing,
    catFinance,
    catRH,
    catBTP,
    catVente,
    catSante,
    catLogistique,
    catJuridique,
    catEnseignement
  }
}

module.exports = { seedCategories }