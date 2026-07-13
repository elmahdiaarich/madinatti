
const workerProfileService = require('../services/workerProfiles');

const searchWorkerProfiles = async (req, res) => {
  try {
    const result = await workerProfileService.searchWorkerProfiles(req.query);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[workerProfileController.searchWorkerProfiles]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getWorkerProfileById = async (req, res) => {
  try {
    const profile = await workerProfileService.getWorkerProfileById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profil introuvable' });
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('[workerProfileController.getWorkerProfileById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyWorkerProfiles = async (req, res) => {
  try {
    const profiles = await workerProfileService.getMyWorkerProfiles(req.user.userId);
    return res.json({ success: true, data: profiles });
  } catch (err) {
    console.error('[workerProfileController.getMyWorkerProfiles]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createWorkerProfile = async (req, res) => {
  try {
    const profile = await workerProfileService.createWorkerProfile(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    if (err.code === 'WORKER_PROFILE_LIMIT_REACHED') {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('[workerProfileController.createWorkerProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    const profile = await workerProfileService.updateWorkerProfile(
      req.params.id,
      req.user.userId,
      req.body
    );
    return res.json({ success: true, data: profile });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('[workerProfileController.updateWorkerProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const toggleActive = async (req, res) => {
  try {
    const profile = await workerProfileService.toggleActive(
      req.params.id,
      req.user.userId,
      req.body.isActive
    );
    return res.json({ success: true, data: profile });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('[workerProfileController.toggleActive]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteWorkerProfile = async (req, res) => {
  try {
    const force = req.query.force === 'true';
    await workerProfileService.softDeleteWorkerProfile(req.params.id, req.user.userId, force);
    return res.json({ success: true, message: 'Profil supprimé' });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.code === 'ACTIVE_ENGAGEMENTS') {
      return res.status(409).json({
        success: false,
        code: err.code,
        message: err.message,
        activeCount: err.activeCount,
      });
    }
    console.error('[workerProfileController.deleteWorkerProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// NOTE: no admin handlers here — moderation (list/approve/reject/suspend/
// unsuspend) goes through the generic /api/admin/listings?module=miniJobs
// endpoints in adminController.js. See MODULE_REGISTRY integration.

module.exports = {
  searchWorkerProfiles,
  getWorkerProfileById,
  getMyWorkerProfiles,
  createWorkerProfile,
  updateWorkerProfile,
  toggleActive,
  deleteWorkerProfile,
};