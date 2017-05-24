var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('selfieStick1', ['posts']);

router.get('/',function(req,res){
	var returnValue;

	//const collection = db.collection('posts');
		var output= '';
		for (var property in req.user){
			output+= property+ ':' + req[property]+ ';';

		}

		console.log("user "+ output);
		if(req.isAuthenticated())
		{	
			db.users.find({
                    _id: req.user._id
                }).sort({
                    priority: 1
                }, function(err, returnvalue) {
                    if (err) {
                        return console.dir(err);
                    }
                    var followers = returnvalue[0].circle;
                    
                       db.posts.find( {user_id: {$in : followers}},function(err,returnvalu){
				if(err){
					return console.dir(err);
				}
				//console.log("My posts: "+JSON.stringify(returnvalu));
					res.render('index', { user : req.user, data : returnvalu});});
	//var followers = returnvalue[0].circle;
                });

	
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