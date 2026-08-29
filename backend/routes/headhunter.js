const express = require("express");
const router = express.Router();
const {
  getCandidates,
  getFiltersCount,
  unlockCandidate,
  getUnlockedCandidates,
  updateUnlockNotes,
  exportUnlockedCsv,
  toggleFavoriteCandidate,
  getFavoriteCandidates,
} = require("../controllers/candidateSearchController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/candidates", authMiddleware, roleMiddleware("business"), getCandidates);
router.get("/filters-count", authMiddleware, roleMiddleware("business"), getFiltersCount);
router.post("/candidates/:id/unlock", authMiddleware, roleMiddleware("business"), unlockCandidate);
router.patch("/candidates/:id/notes", authMiddleware, roleMiddleware("business"), updateUnlockNotes);
router.get("/unlocked/export", authMiddleware, roleMiddleware("business"), exportUnlockedCsv);
router.get("/unlocked", authMiddleware, roleMiddleware("business"), getUnlockedCandidates);
router.post("/candidates/:id/favorite", authMiddleware, roleMiddleware("business"), toggleFavoriteCandidate);
router.get("/favorites", authMiddleware, roleMiddleware("business"), getFavoriteCandidates);

module.exports = router;