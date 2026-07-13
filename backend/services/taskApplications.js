
const prisma = require('../config/db');

async function applyToTaskRequest(userId, taskRequestId, message) {
  const task = await prisma.taskRequest.findUnique({ where: { id: taskRequestId } });
  if (!task || task.deletedByOwner) {
    const err = new Error('Demande introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (task.userId === userId) {
    const err = new Error('Vous ne pouvez pas postuler à votre propre demande');
    err.code = 'SELF_APPLICATION_FORBIDDEN';
    throw err;
  }

  if (task.status !== 'OPEN') {
    const err = new Error("Cette demande n'accepte plus de candidatures");
    err.code = 'TASK_NOT_OPEN';
    throw err;
  }

  // Must have an APPROVED WorkerProfile in the exact matching category
  const matchingProfile = await prisma.workerProfile.findFirst({
    where: { userId, categoryId: task.categoryId, status: 'APPROVED', deletedByOwner: false },
  });

  if (!matchingProfile) {
    const err = new Error('Un profil prestataire approuvé dans cette catégorie est requis pour postuler');
    err.code = 'NEEDS_WORKER_PROFILE';
    throw err;
  }

  try {
    return await prisma.taskApplication.create({
      data: {
        taskRequestId,
        workerProfileId: matchingProfile.id,
        message: message ?? null,
        status: 'PENDING',
      },
    });
  } catch (err) {
    // Unique constraint [taskRequestId, workerProfileId] violation
    if (err.code === 'P2002') {
      const dupErr = new Error('Vous avez déjà postulé à cette demande avec ce profil');
      dupErr.code = 'ALREADY_APPLIED';
      throw dupErr;
    }
    throw err;
  }
}

async function acceptApplication(applicationId, clientUserId) {
  const application = await prisma.taskApplication.findUnique({
    where: { id: applicationId },
    include: { taskRequest: true, workerProfile: true },
  });

  if (!application || application.taskRequest.userId !== clientUserId) {
    const err = new Error('Candidature introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (application.taskRequest.status !== 'OPEN') {
    const err = new Error("Cette demande n'est plus ouverte aux candidatures");
    err.code = 'TASK_NOT_OPEN';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const accepted = await tx.taskApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    // Decline all other pending applications for this task
    await tx.taskApplication.updateMany({
      where: {
        taskRequestId: application.taskRequestId,
        id: { not: applicationId },
        status: 'PENDING',
      },
      data: { status: 'DECLINED' },
    });

    await tx.taskRequest.update({
      where: { id: application.taskRequestId },
      data: { status: 'IN_PROGRESS' },
    });

    return accepted;
  });
}

async function getApplicationsForTaskRequest(taskRequestId, clientUserId) {
  const task = await prisma.taskRequest.findUnique({ where: { id: taskRequestId } });
  if (!task || task.userId !== clientUserId) {
    const err = new Error('Demande introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return prisma.taskApplication.findMany({
    where: { taskRequestId },
    include: { workerProfile: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
}

module.exports = {
  applyToTaskRequest,
  acceptApplication,
  getApplicationsForTaskRequest,
};