'use strict';
let passport = require('passport');
let Auth0Strategy = require('passport-auth0');
let Auth0Tools = require('../util/Auth0Tools');

let strategy = new Auth0Strategy({
    domain:       process.env.DOMAIN,
    clientID:     process.env.OAUTH2_CLIENT_ID,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET,
    callbackURL:  process.env.CALLBACK_URL
  }, (accessToken, refreshToken, extraParams, profile, done) => {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    profile = Auth0Tools.normalizeMetadata(profile);
    profile.id_token = extraParams.id_token;
    return done(null, profile);
  });

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = strategy;
