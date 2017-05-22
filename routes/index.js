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
	                db.users.find({
                    _id: req.user._id
                }).sort({
                    priority: 1
                }, function(err, returnvalue) {
                    if (err) {
                        return console.dir(err);
                    }
                    var followers = returnvalue[0].circle;
                    
                    //for(follower in followers){
                    //  console.log(followers[follower]);
                    //  abc = "ObjectId('"+followers[follower]+"')";
                    //  arr.push("ObjectId('"+followers[follower]+"')");    
                    //  //var obj= {"$oid": followers[follower]};
                    //  //arr.push(obj);
                    //}
                    //console.log("FOlooooooooooooooooo---- "+ JSON.stringify(arr));
                    //console.log("Cooooooooooo---"+ JSON.stringify(returnvalue[0].circle));
                    //db.users.find( { _id: { $nin: returnvalue[0].circle } } )
                    //db.users.find({_id: req.user._id}).sort({priority:1}
                    db.posts.find( {user_id: {$in : followers}},function(err,returnvalu){
				if(err){
					return console.dir(err);
				}
				console.log("My posts: "+JSON.stringify(returnvalu));
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