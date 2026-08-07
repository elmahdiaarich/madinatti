const express = require("express");
const router = express.Router();
const { getCandidates, getFiltersCount, unlockCandidate, getUnlockedCandidates } = require("../controllers/candidateSearchController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/candidates", authMiddleware, roleMiddleware("business"), getCandidates);
router.get("/filters-count", authMiddleware, roleMiddleware("business"), getFiltersCount);
router.post("/candidates/:id/unlock", authMiddleware, roleMiddleware("business"), unlockCandidate);
router.get("/unlocked", authMiddleware, roleMiddleware("business"), getUnlockedCandidates);

module.exports = router;