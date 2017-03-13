var passport = require("passport");
var pinterestStrategy = require("passport-pinterest").Strategy;
var db = require("../models");
require("dotenv").config();

passport.serializeUser(function(user, cb){
	cb(null, user.id);
});

passport.deserializeUser(function(id, cb){
	db.user.findById(id)
	.then(function(user){
		cb(null, user);
	})
	.catch(cb);
});


passport.use(new pinterestStrategy({
	clientID: process.env.PINTEREST_APP_ID,
	clientSecret: process.env.PINTEREST_SECRET,
	callbackURL: process.env.BASE_URL + "/auth/callback/pinterest",
	profileFields: ["firstname", "lastname", "email"],
	enableProof: true
}, function(accessToken, refreshToken, profile, cb){
	//see if you can get email
	var email = profile.emails ? profile.emails[0].value : null;
	//see if user exists in our database
	db.user.findOne({
		where: {email: email}
	}).then(function(existingUser){
		//this user has logged in before:
		if(existingUser && email){
			//If not null user was found and pint profile loaded ok
			existingUser.updateAttributes({
				pinterestId: profile.id,
				pinterestToken: accessToken
			}).then(function(updatedUser){
				cb(null, updatedUser);
			}).catch(cb);
		}else{
			//theyre just a new user and we need to create a new entry for them
			db.user.findOrCreate({
				where: {pinterestId: profile.id},
				defaults: {
					pinterestToken : accessToken,
					email: email,
					firstname: profile.displayName.split(" ")[0],
					lastname: profile.displayName.split(" ")[1],
				}
			}).spread(function(user, wasCreated){
				if(wasCreated){
					//they were new, we created a user
					cb(null, user);
				}else{
					//they were not new after all - just update their token
					user.pinterestToken = accessToken;
					user.save().then(function(){
						cb(null, user);
					}).catch(cb);

				}
			}).catch(cb);
		}
	})
}))

module.exports = passport;