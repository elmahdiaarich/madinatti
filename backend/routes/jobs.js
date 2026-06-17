const express = require('express');
const router  = express.Router();
const {
  getJobs,
  getJobById,
  getFiltersCount,
  getJobCategories,
  createJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  toggleFavorite,
  getMyFavorites,
  getMyJobs,
  updateJob,
  deleteJob,
  getBusinessApplications
} = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { upload }     = require('../config/cloudinary');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/',              getJobs);
router.get('/filters-count', getFiltersCount);
router.get('/categories',    getJobCategories);

// ⚠️ Routes fixes AVANT /:id pour éviter les conflits Express
router.get('/favorites/me',      authMiddleware, getMyFavorites);
router.get('/my',                authMiddleware, roleMiddleware('business'), getMyJobs);

// ── CV download proxy (AVANT /:id) ───────────────────────────────────────────
router.get('/cv/download', async (req, res) => {
  const { url, name } = req.query
  if (!url) return res.status(400).json({ message: 'URL manquante' })
  
  const axios = require('axios')
  const safeName = name 
    ? `CV_${name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u017E]/g, '')}.pdf`
    : 'CV.pdf'
  
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`)
    res.send(Buffer.from(response.data))
  } catch (e) {
    console.error('CV download error:', e.message)
    res.status(500).json({ message: 'Erreur: ' + e.message })
  }
})
router.get('/my-applications', authMiddleware, roleMiddleware('business'), getBusinessApplications);

// ── Candidature (citoyen) ────────────────────────────────────────────────────
router.post('/:id/apply',        authMiddleware, roleMiddleware('citizen'), upload.single('cv'), applyToJob);

// ── Candidatures d'une offre (business) ─────────────────────────────────────
router.get( '/:id/applications', authMiddleware, roleMiddleware('business'), getJobApplications);

// ── Changer statut d'une candidature (business: viewed | accepted) ───────────
router.patch('/applications/:appId/status', authMiddleware, roleMiddleware('business'), updateApplicationStatus);

// ── Détail d'une offre ───────────────────────────────────────────────────────
router.get('/:id', getJobById);

// ── Authentifié (citoyen ou business) ───────────────────────────────────────
router.post('/:id/favorite', authMiddleware, toggleFavorite);

// ── Business only ────────────────────────────────────────────────────────────
router.post('/',    authMiddleware, roleMiddleware('business'), createJob);
router.put('/:id',  authMiddleware, roleMiddleware('business'), updateJob);
router.delete('/:id', authMiddleware, deleteJob);

module.exports = router;