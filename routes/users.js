var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var db = mongojs('selfieStick1', ['users']);
var bcrypt = require('bcryptjs');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
const uuidV1 = require('uuid/v1');
var fileupload = require('fileupload').createFileUpload('public/img').middleware;
var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

//Login Page - Get
router.get('/login', function(req, res) {
   
    res.render('login');
});

//Register Page - Get
router.get('/register', function(req, res) {
    res.render('register');
});

//Register - POST
router.post('/register', function(req, res) {
    //Get form values
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    //Validation
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Please use a valid email').isEmail();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password2);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors,
            name: name,
            email: email,
            username: username,
            password: password,
            password2: password2
        });
    } else {
        var newUser = {
            name: name,
            email: email,
            username: username,
            password: password,
            uuid: uuidV1(),
            circle: []
        }

        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newUser.password, salt, function(err, hash) {
                newUser.password = hash;
                db.users.insert(newUser, function(err, doc) {
                    if (err) {
                        res.send(err);
                    } else {
                        console.log('user added...');

                        //Success message
                        req.flash('success', 'You are successfully registered, login to continue..');

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
    db.users.findOne({
        _id: mongojs.ObjectId(id)
    }, function(err, user) {
        done(err, user);
    });
});

passport.use(new localStrategy(
    function(username, password, done) {

        db.users.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username'
                });
            }

            bcrypt.compare(password, user.password, function(err, isMatch) {
                if (err) {
                    return done(err);
                }
                if (isMatch) {
                    passport.serializeUser(function(user, done) {
                        done(null, user._id);

                    });
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Incorrect password'
                    });
                }
            });
        });
    }
));


//Login - POST
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: 'Invalid Username or Password'
    }),
    function(req, res) {
        var output= '';
        for (var property in req.user){
            output+= property+ ':' + req[property]+ ';';

        }
        console.log("userssss"+ output);
        res.redirect('/');
    });

router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'You have logged out');
    res.redirect('/users/login');
});

router.get('/follow', function(req, res) {
    console.log("Following this uid: " + req.param('uuid'))
    db.users.update({
        _id: req.user._id
    }, {
        $addToSet: {
            circle: req.param('id')
        }
    });

    res.redirect('/users/peopleFollow');
});


router.post('/upload', fileupload, function(req, res) {
    var filePath = null;
    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '../uploads');


    form.on('field', function(field, value) {
        fileParser(value);
    });

    function fileParser(value) {

        form.on("file", function(field, file) {

            filePath = path.join(form.uploadDir, file.name);

            var randFilename = uuidV1() + "." + file.name.split(".")[1];

            fs.rename(file.path, path.join(form.uploadDir, randFilename));
            
            var finalPath = form.uploadDir + "/" + randFilename;

            cloudVision(value,finalPath,randFilename);
            
        });
    }


    function cloudVision(value,finalPath,randFilename){

        var vision = require('google-vision-api-client');
        var requtil = vision.requtil;

        //Prepare your service account from trust preview certificated project
        var jsonfile = './routes/GCloud_Vision.json';
        
        //Initialize the api
        vision.init(jsonfile);

        //Cloud vision call
        var d = requtil.createRequests().addRequest(
        requtil.createRequest(finalPath)
            .withFeature('LABEL_DETECTION', 2)
            .build());
 
        //Do query to the api server
        vision.query(d, function(e, r, d){
            if(e) console.log('ERROR:', e);
            postToDB(value, randFilename, d.responses);
        });
        
    }

    function postToDB(value, finalPath, cloudVisionOutput) {

        var comment = [];
        var likes = [];
        var tags = cloudVisionOutput;
        console.log("aifbcaibsciabsvcbaifv" + tags[0].labelAnnotations[0].description);

        var post = {
            user_name: req.user.name,
            user_id: req.user.uuid,
            post_id: uuidV1(),
            message: value,
            filepath: finalPath,
            comments: comment,
            likes: likes,
            tags: tags,
            dateTime: new Date("<YYYY-mm-ddTHH:MM:ss>")
        }

        db.posts.insert(post, function(err, doc) {
            if (err) {
                res.send(err);
            }
        });
    }


    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });


    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        req.flash('success', 'Message posted successfully');
        res.redirect('/');


    });

    // parse the incoming request containing the form data
    form.parse(req);

});


router.get('/likePost', function(req, res) {




    db.posts.update({
        post_id: req.param('postId')
    }, {
        $addToSet: {
            likes: req.param('userId')
        }
    }, function(err, returnvalue) {
        if (err) {
            return console.dir(err);
        } else {
            res.redirect('/');
        }

    });



});


router.get('/unfollow', function(req, res) {

    db.users.update({
        _id: req.user._id
    }, {
        $pull: {
            circle: req.param('id')
        }
    });


    res.redirect('/users/myFollowers');
});

router.get('/myFollowers', function(req, res) {

    db.users.find({
        _id: req.user._id
    }).sort({
        priority: 1
    }, function(err, returnvalue) {
        if (err) {
            return console.dir(err);
        }
        var followers = returnvalue[0].circle;
        var arr = [];

        db.users.find({
            uuid: {
                $in: followers
            }
        }, function(err, returnvalu) {
            if (err) {
                return console.dir(err);
            }
            console.log("Followers: " + JSON.stringify(returnvalu));
            res.render('myFollowers', {
                data: returnvalu
            });
        });
    });

});

router.get('/comment', function(req, res) {

    console.log("commenting with post Id " + req.param('postId') + " and comment is: " + req.param('comment'))
    var commentObj = {
        "message": req.param('comment'),
        "userName": req.param('userName')
    };
    db.posts.update({
        post_id: req.param('postId')
    }, {
        $addToSet: {
            comments: commentObj
        }
    }, function(err, returnvalue) {
        if (err) {
            return console.dir(err);
        } else {
            res.redirect('/');
        }

    });


});


router.get('/peopleFollow', function(req, res) {

    db.users.find({
        _id: req.user._id
    }).sort({
        priority: 1
    }, function(err, returnvalue) {
        if (err) {
            return console.dir(err);
        }
        var followers = returnvalue[0].circle;
        var arr = [];

        db.users.find({
            uuid: {
                $nin: followers
            }
        }, function(err, returnvalu) {
            if (err) {
                return console.dir(err);
            }
            console.log("Followers: " + JSON.stringify(returnvalu));
            res.render('peopleFollow', {
                data: returnvalu
            });
        });
    });




});

module.exports = router;