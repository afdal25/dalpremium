const router = require("express").Router();

const {
  getEmails,
  createEmails,
  updateEmailStatus,
} = require("../controllers/emailController");

router.get("/", getEmails);

router.post("/", createEmails);

router.put("/:id", updateEmailStatus);

module.exports = router;