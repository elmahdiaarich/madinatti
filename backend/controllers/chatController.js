const rateLimit = new Map();

// ─── Réponses hardcodées par intention ─────────────────────────────────────────
const RESPONSES = {
  bonjour: {
    text: "👋 Bonjour ! Je suis Madina, votre assistante Madinatti. Comment puis-je vous aider ?",
    buttons: [
      { label: "🏠 Immobilier", action: "message", value: "immobilier" },
      { label: "💼 Emploi", action: "message", value: "emploi" },
      { label: "📋 Mon compte", action: "message", value: "compte" },
      { label: "💳 Tarifs & Plans", action: "message", value: "tarifs" }
    ]
  },

  menu: {
    text: "⬅️ Voici le menu principal. Que souhaitez-vous faire ?",
    buttons: [
      { label: "🏠 Immobilier", action: "message", value: "immobilier" },
      { label: "💼 Emploi", action: "message", value: "emploi" },
      { label: "📋 Mon compte", action: "message", value: "compte" },
      { label: "💳 Tarifs & Plans", action: "message", value: "tarifs" }
    ]
  },

  immobilier: {
    text: "🏠 Pour l'immobilier sur Madinatti, vous pouvez consulter les annonces disponibles ou publier la vôtre.",
    buttons: [
      { label: "🔍 Chercher un bien", action: "redirect", value: "/real-estate" },
      { label: "📢 Publier une annonce", action: "redirect", value: "/dashboard/listings/real-estate/create" },
      { label: "💳 Voir les tarifs immo", action: "message", value: "tarifs immobilier" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  emploi: {
    text: "💼 Madinatti vous permet de chercher un emploi ou de publier des offres.",
    buttons: [
      { label: "🔍 Chercher un emploi", action: "redirect", value: "/jobs" },
      { label: "📢 Publier une offre", action: "redirect", value: "/dashboard/listings/jobs/create" },
      { label: "💳 Voir les tarifs emploi", action: "message", value: "tarifs emploi" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  compte: {
    text: "📋 Gérez votre compte Madinatti : profil, favoris, messages et connexion.",
    buttons: [
      { label: "👤 Mon profil", action: "redirect", value: "/my-space/profile" },
      { label: "⭐ Mes favoris", action: "redirect", value: "/my-space/favorites" },
      { label: "💬 Mes messages", action: "redirect", value: "/my-space/messages" },
      { label: "🔐 Se connecter", action: "redirect", value: "/auth/login" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  tarifs: {
    text: "💳 Madinatti propose des tarifs pour l'emploi et l'immobilier. Lequel souhaitez-vous voir ?",
    buttons: [
      { label: "💼 Tarifs emploi", action: "message", value: "tarifs emploi" },
      { label: "🏠 Tarifs immobilier", action: "message", value: "tarifs immobilier" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  "tarifs emploi": {
    text: "💼 Tarifs Emploi :\n• Gratuit 0 MAD — 1 offre, 7 jours\n• Boost 39 MAD/offre — mise en avant 20 jours\n• Pro 99 MAD/mois — 5 offres, badge vérifié, 60 jours\n• VIP 249 MAD/mois — offres illimitées, accès CVs, 90 jours",
    buttons: [
      { label: "📢 Publier une offre", action: "redirect", value: "/dashboard/listings/jobs/create" },
      { label: "🏠 Tarifs immobilier", action: "message", value: "tarifs immobilier" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  "tarifs immobilier": {
    text: "🏠 Tarifs Immobilier :\n• Gratuit 0 MAD — 2 annonces, 3 photos, 7 jours\n• Boost 59 MAD/annonce — mise en avant 20 jours\n• Pro 149 MAD/mois — 10 annonces, badge vérifié, 60 jours\n• VIP 349 MAD/mois — annonces illimitées, photos/vidéos illimitées, 90 jours",
    buttons: [
      { label: "📢 Publier une annonce", action: "redirect", value: "/dashboard/listings/real-estate/create" },
      { label: "💼 Tarifs emploi", action: "message", value: "tarifs emploi" },
      { label: "⬅️ Menu principal", action: "message", value: "menu" }
    ]
  },

  default: {
    text: "🤔 Je n'ai pas bien compris votre demande. Voici ce que je peux vous montrer :",
    buttons: [
      { label: "🏠 Immobilier", action: "message", value: "immobilier" },
      { label: "💼 Emploi", action: "message", value: "emploi" },
      { label: "📋 Mon compte", action: "message", value: "compte" },
      { label: "💳 Tarifs & Plans", action: "message", value: "tarifs" }
    ]
  }
};

// ─── Détection d'intention par mots-clés ──────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase().trim();

  if (msg === 'bonjour' || msg === 'salut' || msg === 'hello' || msg === 'slt') return 'bonjour';
  if (msg === 'menu') return 'menu';
  if (msg === 'compte' || msg.includes('mon compte') || msg.includes('profil') || msg.includes('favoris') || msg.includes('connexion') || msg.includes('connecter') || msg.includes('inscription') || msg.includes('inscrire')) return 'compte';

  if (msg.includes('tarif') || msg.includes('prix') || msg.includes('plan') || msg.includes('abonnement')) {
    if (msg.includes('immo') || msg.includes('appartement') || msg.includes('maison') || msg.includes('bien')) return 'tarifs immobilier';
    if (msg.includes('emploi') || msg.includes('travail') || msg.includes('job')) return 'tarifs emploi';
    return 'tarifs';
  }

  if (msg.includes('immobilier') || msg.includes('annonce') || msg.includes('appartement') || msg.includes('maison') || msg.includes('villa') || msg.includes('terrain') || msg.includes('louer') || msg.includes('location')) return 'immobilier';

  if (msg.includes('emploi') || msg.includes('travail') || msg.includes('job') || msg.includes('offre') || msg.includes('cv') || msg.includes('recrut')) return 'emploi';

  return 'default';
}

function getHardcodedResponse(message) {
  const intent = detectIntent(message);
  return RESPONSES[intent] || RESPONSES.default;
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxMessages = 30;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }

  const data = rateLimit.get(ip);
  if (now - data.start > windowMs) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }

  if (data.count >= maxMessages) return false;
  data.count++;
  return true;
}

// ─── Main controller ──────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;

    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: "Trop de messages. Réessayez dans 15 minutes."
      });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message invalide." });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: "Message trop long (max 500 caractères)." });
    }

    const response = getHardcodedResponse(message);
    return res.status(200).json(response);

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
};

module.exports = { chat };