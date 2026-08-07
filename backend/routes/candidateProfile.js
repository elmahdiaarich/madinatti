const express = require("express");
const router = express.Router();
const { getMyCandidateProfile, upsertMyCandidateProfile } = require("../controllers/candidateProfileController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { upload } = require("../config/cloudinary");

router.get("/me", authMiddleware, roleMiddleware("citizen"), getMyCandidateProfile);
router.put("/me", authMiddleware, roleMiddleware("citizen"), upload.single("cv"), upsertMyCandidateProfile);

module.exports = router;