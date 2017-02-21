var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('4Millenials', ['products']);

router.get('/',function(req,res){
	var returnValue;
	const collection = db.collection('products');

		if(req.isAuthenticated())
		{	
			var returnvalue = collection.find({}).sort({ priority: -1 });
			db.products.find().sort({priority:1},function(err,returnvalue){
			if(err){
				return console.dir(err);
			}
			console.log(returnvalue);
			res.render('index',{
				data: returnvalue
			});
		});
		}else{
			var returnvalue = collection.find({}).sort({ avgrating: -1 });
			db.products.find().sort({avgrating:1},function(err,returnvalue){
			if(err){
				return console.dir(err);
			}
			console.log(returnvalue);
			res.render('index',{
				data: returnvalue
			});
		});
		}

	});


function ensureAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/users/login');
}

module.exports = router;