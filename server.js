var util = require('util');
var express  = require('express');

var config = require('./config');
var gcal = require('google-calendar');



//Config Express and Passport
var app = express();
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//config
app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'somerandomsecretkey!@#$' }));
  app.use(passport.initialize());
});


//port
app.listen(8000);

passport.use(new GoogleStrategy({
    clientID: config.consumer_key,
    clientSecret: config.consumer_secret,
    callbackURL: "http://localhost:8000/auth/callback",
    scope: [
      'openid',
       'email', 
       'https://www.googleapis.com/auth/calendar.readonly' 
       ] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });



//config Google Calendar 


app.get('/', function(req, res){
  if(!req.session.access_token) return res.redirect('/auth');
  
  
  var accessToken = req.session.access_token;

  gcal(accessToken).calendarList.list(function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data.items);
    
  });

});

app.get('/:calendarId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  
  gcal(accessToken).events.list(calendarId, {maxResults:50}, function(err, data) {
    if(err) return res.send(500,err);
    console.log(data.items);
    return res.send(data);
    
  });
});


app.get('/:calendarId/:eventId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  
  gcal(accessToken).events.get(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});