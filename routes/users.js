var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('walhack', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
const uuidV1 = require('uuid/v1');


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
			uuid:uuidV1()
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
  		console.log('Auth successful');
  		res.redirect('/');
  });

router.get('/logout',function(req,res){
	req.logout();
	req.flash('success','You have logged out');
	res.redirect('/users/login');
});


router.post('/itemBought',function(req,res){
	//Get form values
	passport.authenticate('local',{
		successRedirect: '/users/checkout'
	});
	
	res.render('checkout');
});

router.post('/rating',function(req,res){
	//Get form values
	var rating = parseInt(req.body.group1);
	res.redirect('/');
});


module.exports = router; 