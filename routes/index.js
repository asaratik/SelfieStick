var express = require('express');
var router = express();

router.get('/',function(req,res){
  if(req.isAuthenticated()){
    res.render('index');
  }else{
  	res.render('index');
  }
});

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/users/login');
}

module.exports = router;