const express = require("express");
const router = express.Router();
const { resolveMapsUrl } = require("../controllers/geo");

router.get("/resolve-maps-url", resolveMapsUrl);

module.exports = router;