var express = require("express");
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});
// define the home page route
router.get("/matching", function(req, res) {
  res.send("return matching");
});
// define the about route
router.get("/tracking", function(req, res) {
  res.send("tracking");
});

module.exports = router;
