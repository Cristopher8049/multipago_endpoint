const {
  connect,
  get_enviarmensaje,
  post_enviarmensaje,
  close,
} = require("../app/index");
const { Router } = require("express");
const router = Router();

connect();
router.get("/enviarmensaje", async (req, res) => {

  await get_enviarmensaje(req, res);
});
router.get("/close", close);

router.post("/enviarmensaje", post_enviarmensaje);

module.exports = router;
