// backend/controllers/taskRequestController.js
const taskRequestService = require('../services/taskRequests');
const { createNotification } = require('./notificationController');
const prisma = require('../config/db');

const searchTaskRequests = async (req, res) => {
  try {
    const viewerUserId = req.user?.userId ?? null;
    const result = await taskRequestService.searchTaskRequests(req.query, viewerUserId);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[taskRequestController.searchTaskRequests]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTaskRequestById = async (req, res) => {
  try {
    const task = await taskRequestService.getTaskRequestById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    return res.json({ success: true, data: task });
  } catch (err) {
    console.error('[taskRequestController.getTaskRequestById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createTaskRequest = async (req, res) => {
  try {
    const task = await taskRequestService.createTaskRequest(req.user.userId, req.body);

    // Notify workers whose approved WorkerProfile matches this category
    const matchingWorkers = await prisma.workerProfile.findMany({
      where: { categoryId: task.categoryId, status: 'APPROVED', isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    });
    for (const w of matchingWorkers) {
      if (w.userId === req.user.userId) continue;
      await createNotification(
        w.userId,
        'TASK_REQUEST_MATCH',
        'Nouvelle demande dans votre catégorie 🔔',
        `Une nouvelle demande "${task.title}" correspond à votre catégorie.`,
        `/mini-jobs/tasks/${task.id}`
      );
    }

    return res.status(201).json({ success: true, data: task });
} catch (err) {
    if (err.code === 'PROFILE_INCOMPLETE' || err.code === 'INVALID_CATEGORY') {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('[taskRequestController.createTaskRequest]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyTaskRequests = async (req, res) => {
  try {
    // Opportunistic reminder check — no cron infra in the project, so this
    // runs lazily whenever the citizen views their own task requests.
    await taskRequestService.sendDueCompletionReminders(req.user.userId, createNotification);

    const tasks = await taskRequestService.getMyTaskRequests(req.user.userId);
    return res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('[taskRequestController.getMyTaskRequests]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const markCompleted = async (req, res) => {
  try {
    const task = await taskRequestService.markCompleted(req.params.id, req.user.userId);
    return res.json({ success: true, data: task });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'INVALID_STATE') return res.status(400).json({ success: false, message: err.message });
    console.error('[taskRequestController.markCompleted]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const cancelAcceptance = async (req, res) => {
  try {
    const task = await taskRequestService.cancelAcceptance(
      req.params.id,
      req.user.userId,
      req.body.cancelReason
    );

    // Notify the worker whose acceptance was just cancelled
    const cancelledApp = await prisma.taskApplication.findFirst({
      where: { taskRequestId: req.params.id, status: 'CANCELLED' },
      include: { workerProfile: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (cancelledApp) {
      await createNotification(
        cancelledApp.workerProfile.userId,
        'TASK_ACCEPTANCE_CANCELLED',
        'Candidature annulée',
        `Votre candidature pour "${task.title}" a été annulée par le client.`,
        `/mini-jobs/tasks/${task.id}`
      );
    }

    return res.json({ success: true, data: task });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'INVALID_STATE') return res.status(400).json({ success: false, message: err.message });
    console.error('[taskRequestController.cancelAcceptance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  searchTaskRequests,
  getTaskRequestById,
  createTaskRequest,
  getMyTaskRequests,
  markCompleted,
  cancelAcceptance,
};