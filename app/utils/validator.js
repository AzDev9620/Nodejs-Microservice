const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
var handler = require('./handler');

var obj = {
        customSanitizers: {
            toString: value => value.toString(),
            toLowCase: value => value.toLowerCase()
        },
        checkSignup: function (req, res, next) {
            req.checkBody("phone", "Invalid Phone Number")
                .notEmpty()
                .isMobilePhone('any')
                .isNumeric();
            //
            // req.checkBody("_id", 'Invalid id')
            //     .optional({checkFalsy: true})
            //     .notEmpty()
            //     .isAscii();
            //
            // req.checkBody("email", "Invalid Email")
            //     .optional({checkFalsy: true})
            //     .notEmpty()
            //     .isEmail();
            //
            // req.checkBody("password", "Invalid Password")
            //     .optional({checkFalsy: true})
            //     .notEmpty()
            //     /* between 8 and 24 chars, at least one of each type among lowercase, special,uppercase, and numbers */
            //     .matches('^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9]).{8,24}$');
            //
            // req.checkBody("name", 'Invalid Name')
            //     .optional({checkFalsy: true})
            //     .notEmpty()
            //     .isAscii();


            var error = req.validationErrors();
            if (error) {
                handler.sendErr({code : 401, description: ""}, error[0].msg, res);
            }
            else {
                next();
            }

        },
        checkSendOtp: function (req, res, next) {
            req.checkBody("username", 'Invalid username')
                .notEmpty()
                .isAscii();
            var error = req.validationErrors();
            if (error) {
                handler.sendErr({code : 401, description: ""}, error[0].msg, res);
            }
            else {
                next();
            }
        },
        checkMpin: function (req, res, next) {
            req.checkBody("mpin", 'Invalid MPIN')
                .notEmpty()
                .isInt()
                .isLength({min: 4, max: 4});
            var error = req.validationErrors();
            if (error) {
                handler.sendErr({code : 401, description: ""}, error[0].msg, res);
            }
            else {
                req.sanitize('mpin').trim();
                req.sanitize('mpin').escape();
                next();
            }
        }
        ,
        checkPassphrase: function (req, res, next) {
            req.checkBody("passphrase", 'Invalid Passphrase')
                .notEmpty()
                .isAscii();
            var error = req.validationErrors();
            if (error) {
                handler.sendRes(false, error[0].msg, {}, {}, res);
            }
            else {
                req.sanitize('passphrase').trim();
                req.sanitize('passphrase').escape();
                next();
            }
        }
        ,
        checkFcmToken: function (req, res, next) {
            req.checkBody("fcmToken", "Invalid Input")
                .notEmpty();
            var error = req.validationErrors();
            if (error) {
                handler.sendRes(false, error[0].msg, {}, {}, res);
            }
            else next();
        }
        ,
        checkWallet: function (req, res, next) {
            req.checkBody("wallet", "Invalid Input")
                .notEmpty()
                .isAscii();
            var error = req.validationErrors();
            if (error) {
                handler.sendRes(false, error[0].msg, {}, {}, res);
            }
            else {
                req.sanitize('wallet').trim();
                req.sanitize('wallet').escape();
                next();
            }
        }
        ,
        checkpassword: function (req, res, next) {
            req.checkBody("password", "Invalid Input")
                .notEmpty()
                .matches('^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9]).{8,24}$');

            var error = req.validationErrors();
            if (error) {
                handler.sendErr({code : 401, description: ""}, error[0].msg, res);
            }
            else {
                req.sanitize('password').trim();
                req.sanitize('password').escape();
                next();
            }
        }
        ,
        checkLogin: function (req, res, next) {
            req.checkBody("username", "Invalid Username")
                .notEmpty();

            req.checkBody("password", "Invalid Password")
                .notEmpty()
                /* between 8 and 24 chars, at least one of each type among lowercase, special,uppercase, and numbers */
                .matches('^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9]).{8,24}$');
            var error = req.validationErrors();
            if (error) {
                handler.sendErr({code : 401, description: ""}, error[0].msg, res);
            }
            else {
                req.sanitizeBody("username")
                    .trim();
                // ToDo Crashes here if not present
                req.sanitizeBody("password")
                    .toString()
                    .trim();
                next();
            }

        },

        stringifyAndTrimBody: function stringifyAndTrimBody(req, res, next) {
            if(req.body) {
                for(let key in req.body) {
                    req.body[key]= req.body[key]+"";
                    if(key.match(/email/ig)) req.body[key]= req.body[key].replace("$", "");
                    if(req.body[key]) req.body[key]= req.body[key].trim();
                }
            }
            return next();
        }
    }
;

module.exports = obj;
