const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const rateLimit = new Map();

// ─── Système prompt Madina ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu t'appelles Madina, l'assistante officielle de la plateforme Madinatti — une plateforme marocaine de petites annonces pour l'immobilier et l'emploi.

TON COMPORTEMENT :
- Tu réponds TOUJOURS en français (sauf si l'utilisateur écrit en darija ou arabe)
- Ton ton est amical, simple et chaleureux
- Tes réponses sont courtes et claires (max 4-5 lignes)
- Si tu ne sais pas, tu dis honnêtement "Je ne sais pas, contactez le support"
- Tu ne parles JAMAIS de code, base de données, ou détails techniques
- Tu ne réponds qu'aux questions liées à Madinatti

LA PLATEFORME :
Madinatti permet de publier et consulter des annonces immobilières et des offres d'emploi.
- "Mon Espace" (/my-space) → pour les citoyens qui cherchent un emploi ou un logement
- "Dashboard" (/dashboard) → pour les entreprises et agences qui publient des annonces

TARIFS EMPLOI :
- Gratuit 0 MAD : 1 offre active, visibilité standard, expiration 7 jours
- Boost 39 MAD/offre : mise en avant 20 jours, visibilité prioritaire
- Pro 99 MAD/mois : 5 offres, badge entreprise vérifié, stats, expiration 60 jours
- VIP 249 MAD/mois : offres illimitées, accès CVs, chat candidats, expiration 90 jours

TARIFS IMMOBILIER :
- Gratuit 0 MAD : 2 annonces, 3 photos, expiration 7 jours
- Boost 59 MAD/annonce : mise en avant 20 jours, visibilité prioritaire, 5 photos sup
- Pro 149 MAD/mois : 10 annonces, badge agence vérifiée, expiration 60 jours
- VIP 349 MAD/mois : annonces illimitées, photos/vidéos illimitées, sponsoring, expiration 90 jours

PAGES IMPORTANTES :
- Chercher un emploi → /jobs
- Chercher un bien → /real-estate
- Publier une offre d'emploi → /dashboard/listings/jobs/create
- Publier une annonce immobilière → /dashboard/listings/real-estate/create
- Mon profil → /my-space/profile
- Mes favoris → /my-space/favorites
- Mes messages → /my-space/messages
- Créer un compte → /auth/register
- Se connecter → /auth/login

CE QUE TU NE PEUX PAS FAIRE :
- Afficher des annonces en temps réel
- Effectuer des actions à la place de l'utilisateur
- Accéder aux données personnelles des utilisateurs

IMPORTANT : À la fin de chaque réponse, suggère toujours 2-3 boutons d'action pertinents dans ce format JSON exact (après ta réponse textuelle) :
BUTTONS:{"buttons":[{"label":"🔍 Chercher un emploi","action":"redirect","value":"/jobs"},{"label":"⬅️ Menu principal","action":"message","value":"menu"}]}`;

// ─── Hardcoded fallback ───────────────────────────────────────────────────────
function getHardcodedResponse(message) {
  const msg = message.toLowerCase().trim();

  if (msg.includes('immobilier') || msg.includes('annonce') || msg.includes('appartement') || msg.includes('maison')) {
    return {
      text: "🏠 Pour l'immobilier sur Madinatti, vous pouvez consulter les annonces disponibles ou publier la vôtre.",
      buttons: [
        { label: "🔍 Chercher un bien", action: "redirect", value: "/real-estate" },
        { label: "📢 Publier une annonce", action: "redirect", value: "/dashboard/listings/real-estate/create" },
        { label: "💳 Voir les tarifs", action: "message", value: "tarifs immobilier" }
      ]
    };
  }

  if (msg.includes('emploi') || msg.includes('travail') || msg.includes('job') || msg.includes('offre')) {
    return {
      text: "💼 Madinatti vous permet de chercher un emploi ou de publier des offres.",
      buttons: [
        { label: "🔍 Chercher un emploi", action: "redirect", value: "/jobs" },
        { label: "📢 Publier une offre", action: "redirect", value: "/dashboard/listings/jobs/create" },
        { label: "💳 Voir les tarifs", action: "message", value: "tarifs emploi" }
      ]
    };
  }

  return {
    text: "👋 Bonjour ! Je suis Madina, votre assistante Madinatti. Comment puis-je vous aider ?",
    buttons: [
      { label: "🏠 Immobilier", action: "message", value: "immobilier" },
      { label: "💼 Emploi", action: "message", value: "emploi" },
      { label: "📋 Mon compte", action: "message", value: "compte" },
      { label: "💳 Tarifs & Plans", action: "message", value: "tarifs emploi" }
    ]
  };
}

// ─── Gemini response ──────────────────────────────────────────────────────────
async function getGeminiResponse(message) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT
  });

  const result = await model.generateContent(message);
  const fullText = result.response.text();

  // Parse buttons if Gemini included them
  const buttonMatch = fullText.match(/BUTTONS:(\{.*\})/s);
  let buttons = [];
  let text = fullText;

  if (buttonMatch) {
    try {
      const parsed = JSON.parse(buttonMatch[1]);
      buttons = parsed.buttons || [];
      text = fullText.replace(/BUTTONS:\{.*\}/s, '').trim();
    } catch (e) {
      // ignore parse error, keep text as is
    }
  }

  // Fallback buttons if Gemini didn't provide any
  if (buttons.length === 0) {
    buttons = [{ label: "⬅️ Menu principal", action: "message", value: "menu" }];
  }

  return { text, buttons };
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxMessages = 20;

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

    // ── Try Gemini first, fallback to hardcoded ──
    try {
      const response = await getGeminiResponse(message);
      return res.status(200).json(response);
    } catch (geminiError) {
      console.warn('Gemini failed, using hardcoded fallback:', geminiError.message);
      const response = getHardcodedResponse(message);
      return res.status(200).json(response);
    }

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
};

module.exports = { chat };