'use strict';

var user = require('./user.json');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var hasher = require('password-hash-and-salt');

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};
var https = require('https').createServer(options, app);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// hasher('/*password*/').hash(function(error, hash) {
//     if (error) {
//         console.log('Error: ' + error);
//     }
//     console.log(hash);
// });


app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(require('express-session')({
    secret: 'Top Secret!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,
        maxAge: 2 * 60 * 60 * 1000 //unit is ms (2 hours)
    }
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        hasher(password).verifyAgainst(user.password, function(error, verified) {
            if (error) {
                console.log('Error: ' + error);
                done(null, false);
            }
            if (username === user.username && verified) {
                done(null, user);
            } else {
                done(null, false);
            }
        });
    }
));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(id, cb) {
    //dummy, normally get from database, etc.
    cb(null, user);
});

app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout',
    function(req, res) {
        req.logout();
        res.redirect('/');
    });

app.use('/', require('connect-ensure-login').ensureLoggedIn(), express.static(__dirname + '/public'));

//remark the asterisk: with it, all requests will be answered with the SPA, without any redirect (see below with redirect)
app.get('/', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

//redirect all unknown urls to /
app.use(function(request, response) {
    response.redirect('/');
});

https.listen(56000, function() {
    console.log('listening on *:56000');
});
