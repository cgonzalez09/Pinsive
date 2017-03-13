var express = require("express");
var https = require("https");
var fs = require("fs");
var request = require("request");
var ejsLayouts = require("express-ejs-layouts");
var bodyParser = require("body-parser");
var session = require("express-session");
var flash = require("connect-flash");
var passport = require("./config/passportConfig");
var isLoggedIn = require("./middleware/isLoggedIn");
var async = require("async");
var cheerio = require("cheerio");
var _ = require("lodash");
var underscore = require("underscore");
require("dotenv").config();

var keyPath = "./server.key";
var certPath = "./server.crt";
var app = express();

var port = 3000;

//listen
if(fs.existsSync(keyPath) && fs.existsSync(certPath)) {
	port = 5000;

	var options = {
		key: fs.readFileSync(keyPath),
		cert: fs.readFileSync(certPath)
	};

	var server = https.createServer(options, app).listen(port, function(){
		console.log("Express server listening on port " + port);
	});
} else {
	var server = app.listen(port, function(){
		console.log("Server started on port " + port);
	});
}

app.listen(process.env.PORT || 5000)

//set and use statements
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(ejsLayouts);
app.use(session({//session must come before passport initialize
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());//session must come before passport initialize
app.use(passport.session());
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.alerts = req.flash();
	next();
})
app.use(express.static(__dirname + "/public"));

//routes
app.get("/", isLoggedIn, function(req, res){
	res.render("suggested");
});

app.get("/profile", isLoggedIn, function(req, res){
	res.render("profile");
});

app.get("/suggested", isLoggedIn, function(req, res){
	var pinIdArray = ["554857616577037440", "51721095701378456", "129619295506364205", "208432288985084461"];			
	var boardIdArray = [];
	var showPins = [];

function shuffleArray(pinIdArray) {
  for (var i = pinIdArray.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = pinIdArray[i];
    pinIdArray[i] = array[j];
    array[j] = temp;
  }
  return pinIdArray;
}

var array = [];
for(var i = 0; i < 12; i ++) {
    array[i] = i;
};

	async.forEachSeries(pinIdArray, function(pinId, cb){
		var url = "https://api.pinterest.com/v1/pins/"+ pinId +"/?fields=id%2Clink%2Cnote%2Curl%2Cboard&access_token=" + req.user.pinterestToken;
		request(url, function(err, response, body){
			if(err){
				console.log("ERROR", err);
				return;
			}
			var info = JSON.parse(body);
			boardIdArray.push(info.data.board.id);
			cb();
		});
	}, function(){
		console.log(boardIdArray);
		async.forEachSeries(boardIdArray, function(boardId, cb){
			var boardUrl = "https://api.pinterest.com/v1/boards/" + boardId +"/pins/?access_token=" + req.user.pinterestToken;
			console.log(boardUrl);
			request(boardUrl, function(err, response, body){
				if(err){
					console.log("ERROR", err);
					return;
				}
				console.log("Success looking up board");
				var info = JSON.parse(body);
				console.log(info.data);
				showPins = showPins.concat(info.data);
				cb();
			});
		}, function(){
			console.log("boardIds are done");
			res.render("suggested", {pins: _.shuffle(showPins)});//****goes with***
		})
	});	
});


//=======================================================================================================

//Controllers
app.use("/auth", require("./controllers/auth"));