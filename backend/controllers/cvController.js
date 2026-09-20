const { findAuthorizedCv, readCv } = require('../services/cvService');

async function downloadCv(req, res) {
  const { applicationId, candidateId, mine } = req.query;
  if (req.query.url !== undefined || [applicationId, candidateId, mine].filter(Boolean).length !== 1
      || (applicationId && typeof applicationId !== 'string')
      || (candidateId && typeof candidateId !== 'string') || (mine && mine !== 'true')) {
    return res.status(400).json({ message: 'Identifiant de CV requis.' });
  }
  res.set('Cache-Control', 'private, no-store');
  try {
    const asset = await findAuthorizedCv({ applicationId, candidateId, mine: mine === 'true' }, req.user);
    if (!asset) return res.status(404).json({ message: 'CV introuvable.' });
    const data = await readCv(asset);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment; filename="CV.pdf"');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.send(data);
  } catch {
    // Provider errors may contain signed URLs; never log or return those URLs.
    return res.status(502).json({ message: 'CV indisponible. Veuillez réessayer.' });
  }
}

module.exports = { downloadCv };
