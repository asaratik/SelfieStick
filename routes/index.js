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
		db.users.find( {_id: req.user._id}).sort({priority:1},function(err,returnvalue){
	if(err){
		return console.dir(err);
	}

	var followers = returnvalue[0].circle;
	console.log("My posts: "+JSON.stringify(returnvalue[0].posts));
	db.users.find( {uuid: { $in: followers} },function(err,returnvalu){
	if(err){
		return console.dir(err);
	}
	//res.render('index',{ user : req.user});
	res.render('index', { user : req.user, data : returnvalu});});

	//res.render('index',{ user : req.user});
	
	});
		

		

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