var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('selfieStick', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
const uuidV1 = require('uuid/v1');
var fileupload = require('fileupload').createFileUpload('public/img').middleware;


//Login Page - Get
router.get('/login',function(req,res){
	res.render('login');
});

//Register Page - Get
router.get('/register',function(req,res){
	res.render('register');
});

//Register - POST
router.post('/register',function(req,res){
	//Get form values
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	//Validation
	req.checkBody('name','Name field is required').notEmpty();
	req.checkBody('email','Email field is required').notEmpty();
	req.checkBody('email','Please use a valid email').isEmail();
	req.checkBody('username','Username field is required').notEmpty();
	req.checkBody('password','Password field is required').notEmpty();
	req.checkBody('password2','Passwords do not match').equals(req.body.password2);

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors: errors,
			name: name,
			email: email,
			username:username,
			password:password,
			password2:password2
		});
	}else{
		var newUser = {
			name: name,
			email: email,
			username:username,
			password:password,
			uuid:uuidV1(),
			circle:[]
		}

		bcrypt.genSalt(10,function(err,salt){
			bcrypt.hash(newUser.password,salt,function(err,hash){
				newUser.password = hash;
				db.users.insert(newUser,function(err,doc){
				if(err){
					res.send(err);
				}else{
					console.log('user added...');

					//Success message
					req.flash('success','You are successfully registered, login to continue..');
					
					//Redirect after register
					res.location('/');
					res.redirect('/');
					}
				});
			});
		})	
	}

});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  db.users.findOne({_id: mongojs.ObjectId(id)},function(err,user){
  	done(err,user);
  });
});

passport.use(new localStrategy(
	function(username,password,done){
		
		db.users.findOne({username:username},function(err,user){
			if(err){
				return done(err);
			}
			if(!user){
				return done(null,false, {message:'Incorrect username'});
			}

			bcrypt.compare(password,user.password,function(err,isMatch){
				if(err){
					return done(err);
				}
				if(isMatch){
					passport.serializeUser(function(user, done) {
  					done(null, user._id);

				});
					return done(null,user);
				}
				else{
					return done(null,false, {message:'Incorrect password'});
				}
			});
		});
	}
	));

//Login - POST
router.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/users/login',
                                   failureFlash: 'Invalid Username or Password' }),
  function(req,res){
  		res.redirect('/');
  });

router.get('/logout',function(req,res){
	req.logout();
	req.flash('success','You have logged out');
	res.redirect('/users/login');
});

router.get('/follow',function(req,res){
	
	db.users.update(
		{ _id: req.user._id },
   		{ $addToSet: {circle: req.param('id') } }
	);

	res.redirect('/users/circle');
});

router.post('/upload',fileupload,function(req,res){
	//Insert post object into the database and upload file onto hdd
	//db.post.insert();

	req.flash('success','Message posted successfully');
	res.redirect('/');
});

router.get('/unfollow',function(req,res){
	
	db.users.update(
		{ _id: req.user._id },
   		{ $pull: {circle: req.param('id') } }
	);

	res.redirect('/users/circle');
});

router.get('/circle',function(req,res){
	var allUsers;
	db.users.find({_id:{$ne: req.user._id}},function(err,allUsers){
		if(err){
			return console.dir(err);
		}
		//console.log(allUsers);
		return allUsers;
	});
	
	console.log(allUsers);

	db.users.find({_id:{$ne: req.user._id}}).sort({priority:1},function(err,returnvalue){
	if(err){
		return console.dir(err);
	}
	res.render('circle',{
		data: returnvalue
	});
	});
});

module.exports = router; 