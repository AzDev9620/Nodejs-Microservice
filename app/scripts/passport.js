"use strict";
// load all the things we need
const LocalStrategy = require('passport-local').Strategy;

// load up the user model
const Models= require('../v1/model');

const { loginModel }= Models;

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        loginModel.findById(id, function(err, user) {
            done(err, user);
        });
    });


    /*============================
        STRATEGIES START
    ============================*/

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    /* passport.use('signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) {
        //userModel will not fire unless data is sent back
        process.nextTick(function() {
            loginModel.findOne({"email.value": email}, function(err, user) {
                if(err) return done(err);

                if(user) return done(null, false);
                else {
                    let { email= '', password= '' }= req.body;
                    let userLoginRef = loginModel();

                    //setup user's local credentials
                    userLoginRef.email.value        = email;
                    userLoginRef.password           = password;
                    userLoginRef.user_secret_token  = getSecretToken();

                    //save the user
                    userLoginRef.save(function(err, data) {
                        if(err) throw err;

                        sendEmailVarificationMail(data);

                        return done(null, data);
                    });
                }
            });
        });
    })); */

    passport.use('login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        var query= {"email": email};

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        loginModel.findOne(query, "+password", (err, user) => {
            // if there are any errors, return the error before anything else
            if (err) return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false); // create the loginMessage and save it to session as flashdata

            else return done(null, user);
        });
    }));

    /*============================
        STRATEGIES END
    ============================*/
};