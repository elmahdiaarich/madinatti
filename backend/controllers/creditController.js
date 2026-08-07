const prisma = require("../config/db");

// Catalogue codé en dur pour l'instant — pas de vrai paiement, pas de gestion admin.
const CREDIT_PACKS = [
  { id: "pack_10",  name: "Pack Découverte", credits: 10,  price: 299  },
  { id: "pack_50",  name: "Pack Pro",        credits: 50,  price: 1199 },
  { id: "pack_150", name: "Pack Entreprise", credits: 150, price: 2999 },
];

const getPacks = async (req, res) => {
  res.json({ success: true, data: CREDIT_PACKS });
};

const getMyCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    res.json({ success: true, balance: user?.creditBalance ?? 0, transactions });
  } catch (error) {
    console.error("getMyCredits error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

const purchaseCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { packId } = req.body;

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return res.status(400).json({ success: false, message: "Pack introuvable" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: pack.credits } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount: pack.credits,
          packId: pack.id,
          packName: pack.name,
        },
      }),
    ]);

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });

    res.status(201).json({
      success: true,
      message: `${pack.credits} crédits ajoutés avec succès`,
      balance: updated.creditBalance,
    });
  } catch (error) {
    console.error("purchaseCredits error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = { getPacks, getMyCredits, purchaseCredits };