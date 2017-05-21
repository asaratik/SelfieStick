var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('selfieStick', ['posts']);

router.get('/',function(req,res){
	var returnValue;

	//const collection = db.collection('posts');

		if(req.isAuthenticated())
		{	
			
			/*
			var returnvalue = collection.find({}).sort({ priority: -1 });
			db.posts.find().sort({priority:1},function(err,returnvalue){
			if(err){
				return console.dir(err);
			}
			console.log(returnvalue);
			res.render('index',{
				data: returnvalue
			});
		});*/
	var myPosts;		
		db.posts.find( {user_id: req.user.uuid}).sort({priority:1},function(err,returnvalue){
	if(err){
		return console.dir(err);
	}
	console.log("My posts: "+JSON.stringify(returnvalue));
	res.render('index', { user : req.user, data : returnvalue});});
	//var followers = returnvalue[0].circle;
	

		}else{
			  res.redirect('/users/login');
		}
	});



function ensureAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/users/login');
}

module.exports = router;