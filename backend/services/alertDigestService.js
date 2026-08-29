const prisma = require("../config/db");
const { createNotification } = require("../controllers/notificationController");

const MODULE_LABELS = {
  emploi: "offre(s) d'emploi",
  immobilier: "annonce(s) immobilière(s)",
  automobile: "annonce(s) véhicule",
  headhunter: "candidat(s)",
};

// Le digest renvoie vers la page de gestion des alertes plutôt que vers une
// annonce précise — logique pour un résumé groupé, et ça répond aussi au
// besoin d'un accès direct à "Mes alertes" depuis la notification reçue.
const MODULE_LINKS = {
  emploi: "/my-space/alerts",
  immobilier: "/my-space/alerts",
  automobile: "/my-space/alerts",
  headhunter: "/dashboard/headhunter/alerts",
};

async function runAlertDigest() {
  try {
    const matches = await prisma.alertMatch.findMany({
      include: { alert: true },
      orderBy: { createdAt: "asc" },
    });
    if (matches.length === 0) return;

    // Regroupe par utilisateur + module — un utilisateur avec 3 alertes emploi
    // matchées le même jour ne reçoit qu'UNE notification, pas trois.
    const groups = new Map();
    for (const m of matches) {
      const key = `${m.alert.userId}|${m.alert.module}`;
      if (!groups.has(key)) {
        groups.set(key, { userId: m.alert.userId, module: m.alert.module, count: 0, sample: m.targetTitle });
      }
      groups.get(key).count += 1;
    }

    for (const g of groups.values()) {
      const label = MODULE_LABELS[g.module] || "résultat(s)";
      const link = MODULE_LINKS[g.module] || "/my-space/alerts";
      const title = g.count === 1
        ? `Nouveau ${label.replace("(s)", "")} qui vous correspond 🔔`
        : `${g.count} nouveaux ${label} correspondent à vos alertes 🔔`;
      const body = g.count === 1
        ? `"${g.sample}" correspond à l'une de vos alertes.`
        : `${g.count} nouveaux résultats correspondent à vos alertes, dont "${g.sample}".`;

      await createNotification(g.userId, "ALERT_DIGEST", title, body, link);
    }

    await prisma.alertMatch.deleteMany({
      where: { id: { in: matches.map((m) => m.id) } },
    });

    console.log(`[alertDigest] ${groups.size} notification(s) envoyée(s) pour ${matches.length} correspondance(s).`);
  } catch (err) {
    console.error("[alertDigest] error:", err);
  }
}

function startAlertDigestScheduler() {
  // Envoi groupé une fois par jour au lieu d'une notification immédiate par
  // correspondance — évite de spammer l'utilisateur si plusieurs annonces ou
  // candidats correspondent le même jour.
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(runAlertDigest, TWENTY_FOUR_HOURS);
  console.log("[alertDigest] scheduler démarré — envoi groupé toutes les 24h.");
}

module.exports = { runAlertDigest, startAlertDigestScheduler };