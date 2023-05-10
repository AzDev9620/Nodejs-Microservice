"use strict";
//Required Packages
const jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
const cookie = require('cookie');

const profile   = require('./profile');
const admin     = require('./admin');
const handler   = require('./../utils/handler');
const csrf      = require('./../scripts/csrf');
const common    = require("./../scripts/common");
var upload      = require("./../utils/fileHandler");

module.exports= function(router, passport) {

    // process the login form
    router.post('/login', admin.checkSystemShutdown, (req, res, next) => {
        passport.authenticate('login', (err, user, info) => {
            if(err) console.log(err);
            if(!user) handler.sendErr("", 401, "Wrong Credentials", res);
            else {
                req.logIn(user, function(err) {
                    if(err) console.log(err);

                    let token = jwt.sign({data:user._doc._id+''}, '2a08c65sdTQUCPfnAdqgSqyzJ', {
                        expiresIn: common.loginJWTExpiry
                    });

                    delete user._doc.password;

                    res.setHeader('Set-Cookie', cookie.serialize(user._doc._id, csrf.token(), {
                        httpOnly: true,
                        maxAge: common.csrfMaxAge,
                        secure: true,
                        path: "/"
                    }));
                    // return the information including token as JSON
                    handler.sendRes(true, "SUCCESS", user._doc, {}, res, user._doc._id, token);
                });
            }
        })(req, res, next);
    });

    // LOGOUT ==============================
    router.get('/logout', admin.checkSystemShutdown, profile.logout);

    router.post('/add/user/audit', isLoggedIn, admin.checkSystemShutdown, admin.saveUserAudit);

    // route middleware to verify a token
    router.use(function(req, res, next) {

        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {
            console.log(token)
            // verifies secret and checks exp
            jwt.verify(token, '2a08c65sdTQUCPfnAdqgSqyzJ', function(err, decoded) {
                console.log(err,decoded);
            if (err) {
                return handler.sendErr(err, 403, "Failed to authenticate token.", res);

            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                next();
            }
            });

        } else {

            // if there is no token
            // return an error
            return handler.sendErr("", 403, "Missing Access token.", res);
        }
    });

    router.post('/superadmin/create/:entity', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkSuperadmin, profile.checkIfEntityExists, profile.makeEntity);

    router.put('/superadmin/update/entity', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkSuperadmin, profile.updateEntity);

    router.get('/admin/audit/trails', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkPermissions, admin.getAdminAuditTrails);

    router.get('/user/audit/trails', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkPermissions, admin.getUserAuditTrails);

    router.post('/superadmin/shutdownsystem', isLoggedIn, csrf.varifyToken, admin.checkSuperadmin, admin.systemShutdown);

    router.post('/superadmin/startsystem', isLoggedIn, csrf.varifyToken, admin.checkSuperadmin, admin.systemStart);

    router.post('/createMail', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkPermissions, admin.sendMail, admin.saveAudit);

    router.post('/superadmin/toggle/block/user', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkSuperadmin, admin.toggleBlockUser);
    ///new API
    router.get('/superadmin/check/block/user', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkSuperadmin, admin.checkBlockUser);

    router.post('/add/permission', isLoggedIn, csrf.varifyToken, admin.addPermission);

    ///integrated routes
    router.get('/superadmin/getSkippedKyc',isLoggedIn, admin.checkSuperadmin, profile.getSkippedKyc);

    router.get('/admin/getUserKyc', isLoggedIn, profile.getUserKyc);

    router.post('/admin/updateUserKyc',isLoggedIn, profile.updateUserKyc);

    router.get('/admin/getPrefs', isLoggedIn, profile.getPrefs);

    router.put('/admin/setPrefs', isLoggedIn, profile.setPrefs);

    router.post('/admin/saveKycDetails', isLoggedIn, upload.fileExistanceCheck, upload.uploadKyc, profile.saveKycDetails);

    ///end integrated eoutes
    router.get('/system/shutdown', admin.checkSystemShutdown);

    // check permissions of the user
    router.get('/getpermissions', admin.getPermissions);




    router.post('/checkpermission', admin.checkPermissions);

    router.post('/country/advertisement/create', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkPermissions, admin.createCountryAdvertisement, admin.saveAudit);

    router.put('/country/advertisement/update', isLoggedIn, admin.checkSystemShutdown, csrf.varifyToken, admin.checkPermissions, admin.updateCountryAdvertisement, admin.saveAudit);

    router.get('/country/advertisement', isLoggedIn, admin.checkSystemShutdown, admin.getCountryAdvertisement);

    router.get('/get/entity/:role', isLoggedIn, admin.checkSystemShutdown, admin.getadmins);

    router.get('/get/users', isLoggedIn, admin.checkSystemShutdown, admin.getUsers);

    router.get('/get/getMyRole', isLoggedIn, csrf.varifyToken, profile.getMyRole);

    router.post('/set/fees/config', isLoggedIn, admin.checkSystemShutdown, admin.checkPermissions, admin.setConfig);

    router.get('/get/fees/config', isLoggedIn, admin.checkSystemShutdown, admin.getConfig);

    router.get('/get/withdrawals', admin.checkPermissions, admin.getWithdrawals);

    router.get('/get/deposits', admin.checkPermissions, admin.getDeposits);

    router.post('/admin/cancelorder', admin.checkPermissions, admin.cancelOrder);

    router.post('/toggle/pair/restrict', admin.checkPermissions, admin.togglePairRestrict);

    router.get('/get/restricted/pairs', admin.checkPermissions, admin.getRestrictedPairs);
}

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    // if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    return handler.sendErr(500, "Please Request for Login", res);
}