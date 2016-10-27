"use strict";
let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('express-session');

let passport = require('passport');
let strategy = require('./passport-strategies/auth0-strategy');
let Auth0Config = require('./config').Auth0Config;
let BoxConfig = require('./config').BoxConfig;

let Box = require('box-node-sdk');
let BoxTools = require('./util/BoxTools');
let BoxRedis = require('./util/BoxRedis');

let routes = require('./routes/index');
let users = require('./routes/users');
let userToken = require('./routes/userToken');
let fileRoute = require('./routes/file');
let landingRoute = require('./routes/landing');
let overviewRoute = require('./routes/overview');
let submitRoute = require('./routes/submit');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: Auth0Config.sessionSecret,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Initialize a BoxClient for App Users
app.use(function (req, res, next) {
  let BoxSdk = new Box({
    clientID: BoxConfig.clientId,
    clientSecret: BoxConfig.clientSecret,
    appAuth: {
      keyID: BoxConfig.jwtPublicKeyId,
      privateKey: BoxConfig.jwtPrivateKey(),
      passphrase: BoxConfig.jwtPrivateKeyPassword
    }
  });
  app.locals.BoxSdk = BoxSdk;

  BoxTools.createEnterpriseToken(BoxRedis, BoxSdk)
    .then((boxAdminApiClient) => {
      app.locals.boxAdminApiClient = boxAdminApiClient;
      next();
    })
    .catch(() => {
      next();
    });
});

app.use('/', routes);
app.use('/user', users);
app.use('/token', userToken);
app.use('/files', fileRoute);
app.use('/landing', landingRoute);
app.use('/item', overviewRoute);
app.use('/submit', submitRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('pages/error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('pages/error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
