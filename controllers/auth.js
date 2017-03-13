var express = require("express");
var db = require("../models");
var passport = require("../config/passportConfig");
var router = express.Router();

//routes
router.get("/login", function(req, res){
	res.render("auth/login");
});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You are logged out");
	res.redirect("/");
});

router.get("/pinterest", passport.authenticate("pinterest", {
	scope: ["read_public", "read_relationships"]
}));

router.get("/callback/pinterest", passport.authenticate("pinterest", {
	successRedirect: "/suggested",
	successFlash: "You successfully logged in via Pinterest!",
	failureRedirect: "/auth/login",
	failureFlash: "You must log in to view this site"
}));

//export
module.exports = router;