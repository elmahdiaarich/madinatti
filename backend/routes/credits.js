const express = require("express");
const router = express.Router();
const { getPacks, getMyCredits, purchaseCredits } = require("../controllers/creditController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/packs", authMiddleware, roleMiddleware("business"), getPacks);
router.get("/me", authMiddleware, roleMiddleware("business"), getMyCredits);
router.post("/purchase", authMiddleware, roleMiddleware("business"), purchaseCredits);

module.exports = router;