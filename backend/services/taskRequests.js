const prisma = require('../config/db');

// ----------------------------------------------------------
// PUBLIC SEARCH / LIST
// ----------------------------------------------------------

async function searchTaskRequests({
  categoryId,
  categorySlug,
  city,
  minBudget,
  maxBudget,
  page = 1,
  limit = 12,
}, viewerUserId) {
  const where = {
    status: 'OPEN',
    deletedByOwner: false,
  };

  // The Phase 5 frontend (TaskRequestFilter.jsx) sends `categorySlug`, not
  // `categoryId` — resolve it here so the filter actually works. `categoryId`
  // is still honored directly if a caller passes it (kept for compatibility).
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId && categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: categorySlug, module: 'mini-jobs' },
      select: { id: true },
    });
    // Slug didn't resolve to a real category — force an empty result set
    // instead of silently ignoring the filter.
    resolvedCategoryId = category ? category.id : '__no_match__';
  }

  if (resolvedCategoryId) where.categoryId = resolvedCategoryId;
  if (city) where.city = { equals: city, mode: 'insensitive' };

  // These were previously accepted by TaskRequestFilter.jsx but never read
  // here, so the budget filter silently did nothing.
  if (minBudget || maxBudget) {
    where.budget = {};
    if (minBudget) where.budget.gte = Number(minBudget);
    if (maxBudget) where.budget.lte = Number(maxBudget);
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Priority ordering: if the viewer has an approved WorkerProfile, surface
  // matching categories first. Falls back to plain createdAt desc otherwise.
  let viewerCategoryIds = [];
  if (viewerUserId) {
    const profiles = await prisma.workerProfile.findMany({
      where: { userId: viewerUserId, status: 'APPROVED', deletedByOwner: false },
      select: { categoryId: true },
    });
    viewerCategoryIds = profiles.map((p) => p.categoryId);
  }

  const [items, total] = await Promise.all([
    prisma.taskRequest.findMany({
      where,
      include: { category: true, user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.taskRequest.count({ where }),
  ]);

  // Presentation-layer sort only — no schema impact. Stable sort: matching
  // categories first, preserving createdAt desc order within each group.
  const sorted = viewerCategoryIds.length
    ? [...items].sort((a, b) => {
        const aMatch = viewerCategoryIds.includes(a.categoryId) ? 0 : 1;
        const bMatch = viewerCategoryIds.includes(b.categoryId) ? 0 : 1;
        return aMatch - bMatch;
      })
    : items;

  return { items: sorted, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
}

async function getTaskRequestById(id) {
  return prisma.taskRequest.findUnique({
    where: { id },
    include: {
      category: true,
      user: { select: { id: true, name: true, avatar: true, createdAt: true } },
      applications: {
        include: { workerProfile: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
  });
}

// ----------------------------------------------------------
// CREATE — immediate publication (no PENDING), reactive moderation only
// ----------------------------------------------------------

async function createTaskRequest(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.profileCompleted) {
    const err = new Error('Complétez votre profil avant de publier une demande');
    err.code = 'PROFILE_INCOMPLETE';
    throw err;
  }

  // The frontend (tasks/create/page.jsx) sends categorySlug, not categoryId —
  // same resolution needed here as in searchTaskRequests.
  let categoryId = data.categoryId;
  if (!categoryId && data.categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: data.categorySlug, module: 'mini-jobs' },
      select: { id: true },
    });
    if (!category) {
      const err = new Error('Catégorie introuvable');
      err.code = 'INVALID_CATEGORY';
      throw err;
    }
    categoryId = category.id;
  }

  if (!categoryId) {
    const err = new Error('Catégorie requise');
    err.code = 'INVALID_CATEGORY';
    throw err;
  }

  return prisma.taskRequest.create({
    data: {
      userId,
      categoryId,
      title: data.title,
      description: data.description,
      city: data.city,
      region: data.region ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      location: data.location ?? null,
      budget: data.budget ?? null,
      neededDate: new Date(data.neededDate),
      status: 'OPEN',
    },
  });
}

async function getMyTaskRequests(userId) {
  return prisma.taskRequest.findMany({
    where: { userId, deletedByOwner: false },
    include: {
      category: true,
      applications: {
        include: { workerProfile: { include: { user: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ----------------------------------------------------------
// LIFECYCLE
// ----------------------------------------------------------

async function markCompleted(taskRequestId, userId) {
  const task = await prisma.taskRequest.findUnique({ where: { id: taskRequestId } });
  if (!task || task.userId !== userId) {
    const err = new Error('Demande introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (task.status !== 'IN_PROGRESS') {
    const err = new Error('Seule une tâche en cours peut être marquée terminée');
    err.code = 'INVALID_STATE';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.taskRequest.update({
      where: { id: taskRequestId },
      data: { status: 'COMPLETED' },
    });
    await tx.taskApplication.updateMany({
      where: { taskRequestId, status: 'ACCEPTED' },
      data: { status: 'ACCEPTED' }, // stays ACCEPTED — TaskApplication itself doesn't need a COMPLETED state, gated via TaskRequest.status for reviews
    });
    return updated;
  });
}

// Client cancels the current acceptance — task reopens, accepted application -> CANCELLED
async function cancelAcceptance(taskRequestId, userId, cancelReason) {
  const task = await prisma.taskRequest.findUnique({ where: { id: taskRequestId } });
  if (!task || task.userId !== userId) {
    const err = new Error('Demande introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (task.status !== 'IN_PROGRESS') {
    const err = new Error("Cette demande n'est pas en cours");
    err.code = 'INVALID_STATE';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const acceptedApp = await tx.taskApplication.findFirst({
      where: { taskRequestId, status: 'ACCEPTED' },
    });

    if (acceptedApp) {
      await tx.taskApplication.update({
        where: { id: acceptedApp.id },
        data: { status: 'CANCELLED', cancelReason: cancelReason ?? null },
      });
    }

    return tx.taskRequest.update({ where: { id: taskRequestId }, data: { status: 'OPEN' } });
  });
}

// ----------------------------------------------------------
// COMPLETION REMINDER — no cron infra in the project yet, so this is
// checked opportunistically (lazily) whenever getMyTaskRequests runs,
// rather than on a schedule. See adminController-style lazy patterns
// already used elsewhere (e.g. view tracking).
// ----------------------------------------------------------

async function sendDueCompletionReminders(userId, createNotification) {
  const now = new Date();
  const dueTasks = await prisma.taskRequest.findMany({
    where: { userId, status: 'IN_PROGRESS', neededDate: { lt: now } },
  });

  for (const task of dueTasks) {
    // Avoid duplicate reminders: check if one was already sent for this task
    const alreadyNotified = await prisma.notification.findFirst({
      where: { userId, type: 'TASK_COMPLETION_REMINDER', link: `/my-space/task-requests/${task.id}` },
    });
    if (alreadyNotified) continue;

    await createNotification(
      userId,
      'TASK_COMPLETION_REMINDER',
      'Votre tâche est-elle terminée ? 🔔',
      `N'oubliez pas de marquer "${task.title}" comme terminée pour pouvoir laisser un avis.`,
      `/my-space/task-requests/${task.id}`
    );
  }
}

module.exports = {
  searchTaskRequests,
  getTaskRequestById,
  createTaskRequest,
  getMyTaskRequests,
  markCompleted,
  cancelAcceptance,
  sendDueCompletionReminders,
};