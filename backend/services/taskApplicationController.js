const taskApplicationService = require('../services/taskApplications');
const { createNotification } = require('./notificationController');
const prisma = require('../config/db');

const applyToTaskRequest = async (req, res) => {
  try {
    const application = await taskApplicationService.applyToTaskRequest(
      req.user.userId,
      req.params.taskRequestId,
      req.body.message
    );

    const task = await prisma.taskRequest.findUnique({ where: { id: req.params.taskRequestId } });
    await createNotification(
      task.userId,
      'TASK_APPLICATION_RECEIVED',
      'Nouvelle candidature reçue 📩',
      `Vous avez reçu une candidature pour "${task.title}".`,
      `/my-space/task-requests/${task.id}`
    );

    return res.status(201).json({ success: true, data: application });
  } catch (err) {
    if (err.code === 'NEEDS_WORKER_PROFILE') {
      // Frontend uses this specific code to redirect to profile creation
      // and preserve the taskRequestId so the user lands back on it after.
      return res.status(400).json({
        success: false,
        code: 'NEEDS_WORKER_PROFILE',
        message: err.message,
        taskRequestId: req.params.taskRequestId,
      });
    }
    if (
      ['NOT_FOUND', 'SELF_APPLICATION_FORBIDDEN', 'TASK_NOT_OPEN', 'ALREADY_APPLIED'].includes(err.code)
    ) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ success: false, code: err.code, message: err.message });
    }
    console.error('[taskApplicationController.applyToTaskRequest]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const acceptApplication = async (req, res) => {
  try {
    const application = await taskApplicationService.acceptApplication(req.params.id, req.user.userId);

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: application.workerProfileId },
    });
    const task = await prisma.taskRequest.findUnique({ where: { id: application.taskRequestId } });

    await createNotification(
      workerProfile.userId,
      'TASK_APPLICATION_ACCEPTED',
      'Candidature acceptée ✅',
      `Votre candidature pour "${task.title}" a été acceptée.`,
      `/mini-jobs/tasks/${task.id}`
    );

    return res.json({ success: true, data: application });
  } catch (err) {
    if (['NOT_FOUND', 'TASK_NOT_OPEN'].includes(err.code)) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
    console.error('[taskApplicationController.acceptApplication]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getApplicationsForTaskRequest = async (req, res) => {
  try {
    const applications = await taskApplicationService.getApplicationsForTaskRequest(
      req.params.taskRequestId,
      req.user.userId
    );
    return res.json({ success: true, data: applications });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    console.error('[taskApplicationController.getApplicationsForTaskRequest]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  applyToTaskRequest,
  acceptApplication,
  getApplicationsForTaskRequest,
};