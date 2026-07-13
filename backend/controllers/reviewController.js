const reviewService = require('../services/reviews');

const ERROR_STATUS = {
  RATING_INVALID: 400,
  MISSING_TARGET: 400,
  MISSING_REFERENCE: 400,
  AMBIGUOUS_REFERENCE: 400,
  ACCOUNT_TOO_NEW: 400,
  NOT_COMPLETED: 400,
  TARGET_MISMATCH: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_REVIEWED: 409,
};

const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    const status = ERROR_STATUS[err.code];
    if (status) {
      return res.status(status).json({ success: false, code: err.code, message: err.message });
    }
    console.error('[reviewController.createReview]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getReviewsForTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    if (!targetType || !targetId) {
      return res
        .status(400)
        .json({ success: false, message: 'targetType et targetId sont requis' });
    }
    const result = await reviewService.getReviewsForTarget(targetType, targetId, req.query);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[reviewController.getReviewsForTarget]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getReviewsForTarget,
};