var jsonwebtoken = require('jsonwebtoken'),
    Model = require('../v1/model'),
    config = require('./../../config'),
    status = require('http-status-codes'),
    handler = require('./handler'),
    moment = require('moment'),
    env = process.env.NODE_ENV || 'development',
    date = require('./datesHelper'),
    // preset = require('./../preset'),
    Mnemonic = require('bitcore-mnemonic'),
    crypto = require('crypto-js/aes'),
    CryptoJS = require("crypto-js"),
    Recaptcha = require('express-recaptcha'),
    recaptcha = new Recaptcha(config.recaptcha.site_key, config.recaptcha.secret_key),
    common = require('./../scripts/common');

const userSchema= Model.userLoginModel;
moment.locale('in');

var regex = {
    /* ToDo Identify phone numbers more precisely */
    phoneRegex: /^\+(?:[0-9]●?){6,14}[0-9]$/,
    emailRegex: /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/
};
var patt = '^[A-Z]{2}[0-9]{1,2}(?:[A-Z])?(?:[A-Z]*)?[0-9]{4}$';

var cryptoSettings = {
    password: process.env.secret || '=^U^8sE5=9TQXTXU'
};

var decide = function (model, decoded, req, res, next) {
    if (model) {
        if (model.isActive) {
            req.details = model;
            next();
        } else {
            handler.sendErr(handler.ACCOUNT_SUSPENDED, res);
        }
    } else {
        handler.sendErr(handler.TOKEN_EXPIRED, res);
    }
};

var obj = {
        sendErr: true,
        userTokenKey: process.env.jwtSecret || '8p!RxWDptb@f7vBg',
        accessTokenKey: process.env.accessSecret || '2$Z3cYqkswff^9CX',
        isPhone: function (phoneNumber) {
            return (regex.phoneRegex).test(phoneNumber);
        },
        isEmail: function (email) {
            return (regex.emailRegex).test(email);
        },
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        identifyUsername: function (username) {
            if (this.isEmail(username)) {
                return 'email';
            }
            else if (this.isNumber(username)) {
                return 'phone';
            }
            else {
                return 0;
            }
        },
        getDate: function () {
            return moment().format('DD-MM-YYYY');
        }
        ,
        getDay: function () {
            return moment().format('ddd');
        },
        encrypt: function (text) {
            return crypto.encrypt(text, cryptoSettings.password);
        },
        decrypt: function (cipher) {
            return crypto.decrypt(cipher.toString(), cryptoSettings.password);
        },
        createMnemonic: function (cb) {
            let code = new Mnemonic(Mnemonic.Words.ENGLISH);
            let key = (obj.encrypt(code.toHDPrivateKey().toString())).toString();
            return cb(null, {passphrase: code.toString(), passphraseKey: key});
        },
        verifyMnemonic: function (key, words, cb) {
            try {
                let toCheck = new Mnemonic(words).toHDPrivateKey().toString();
                let bytes = obj.decrypt(key);
                let savedKey = bytes.toString(CryptoJS.enc.Utf8);
                if (toCheck == savedKey)
                    return cb(null, true);
                else return cb(true);
            }
            catch (e) {
                console.log(e);
                return cb('INVALID PASSPHRASE');
            }
        },
        createCustomToken: function (data) {
            return jsonwebtoken.sign(data, obj.userTokenKey, {expiresIn: '20min'}); //expire in 2 minutes
        },
        decodeCustomToken: function (req, res, next) {
            console.log("token decoding");
            var token = req.params['code'];
            var key = obj.userTokenKey;
            jsonwebtoken.verify(token, key, function (err, decoded) {
                if (err) {
                    return handler.sendErr({code: 401, description : ""}, handler.NOT_AUTHORISED, res);
                }
                else {
                    console.log(decoded);
                    if(decoded.id) {
                        userSchema.findOne({_id: decoded.id}, function (err, model) {
                            if (model) {
                                if(model._id === decoded.id) {
                                    if (model.isActive) {
                                        console.log("@@@@@@@");
                                        console.log(model);
                                        req.details = model;
                                        req.details.access = true;
                                        next();
                                    } else {
                                        handler.sendErr({code: 401, description : ""}, handler.ACCOUNT_SUSPENDED, res);
                                    }
                                } else {
                                    handler.sendErr({code: 503, description: err.message}, handler.ERROR, res);
                                }
                            }
                            else handler.sendErr({code: 401, description : ""}, handler.USER_NOT_FOUND, res);
                        });
                    }
                    else {
                        req.body = decoded;
                        return next()
                    }
                }
            });
        },
        // createToken: function (model) {
        //     console.log(model);
        //     return jsonwebtoken.sign({
        //         _id: model._id,
        //         state: model.state,
        //         expire: date.addToTimestamp(preset.tokenExpiryTime * 6)
        //     }, obj.userTokenKey);
        // },
        createAccessToken: function (model) {
            return jsonwebtoken.sign({
                _id: model._id,
                state: model.state,
                expire: date.addToTimestamp(common.tokenExpiryTime * 6)
            }, obj.accessTokenKey);
        },
        verifyAccessToken: function (req, res, next) {
            var token = req.headers['x-access-token'] || req.body.token;
            var key = obj.accessTokenKey;
            jsonwebtoken.verify(token, key, function (err, decoded) {
                if (err) {
                    handler.sendErr({code: 401, description : ""}, handler.NOT_AUTHORISED, res);
                }
                else {
                    if (decoded._id) {
                        userSchema.findOne({_id: decoded._id}, function (err, model) {
                            if (model) {
                                if (model._id === decoded._id) {
                                    if (model.isActive) {
                                        req.details = model;
                                        req.details.access = true;
                                        next();
                                    } else {
                                        handler.sendErr({code: 401, description : ""}, handler.ACCOUNT_SUSPENDED, res);
                                    }
                                } else {
                                    handler.sendErr({code: 503, description: err.message}, handler.ERROR, res);
                                }
                            }
                            else handler.sendErr({code: 401, description : ""}, handler.USER_NOT_FOUND, res);
                        });
                    }
                    else {
                        req.body = decoded;
                        return next()
                    }
                }
            });
        },
        verifyIfToken: function (req, res, next) {
            var token = req.headers['x-access-token']  || req.body.token;
            if (!token) {
                return next();
            }
            else obj.verifyToken(req, res, next);
        },
        verifyToken: function (req, res, next) {
            console.log(req);

            var token = req.headers['x-access-token'] || req.body.token;

            if(!token){
                handler.sendErr({code: 401, description : ""}, handler.TOKEN_NOT_FOUND, res);
            }else{
                var key = obj.userTokenKey;
                jsonwebtoken.verify(token, key, function (err, decoded) {
                    if (err) {
                        obj.verifyAccessToken(req, res, next);
                    } else {
                        if (decoded._id) {
                            userSchema.findOne({_id: decoded._id}, function (err, model) {
                                if (model) {
                                    if (model._id === decoded._id) {
                                        decide(model, decoded, req, res, next);
                                    } else {
                                        handler.sendErr({code: 404, description: err}, handler.ERROR, res);
                                    }
                                }
                                else {
                                    handler.sendErr({code: 401, description : ""}, handler.USER_NOT_FOUND, res);
                                }
                            });
                        }
                        else {
                            req.body = decoded;
                            return next()
                        }

                    }
                });
            }

        },
        recaptcha: function (req, res, next) {
            if (!config.recaptcha.isEnabled) return next();
            recaptcha.verify(req, function (error, data) {
		if (!error)
                    next();
                else
                    return handler.sendErr(401, handler.CAPTCHA_FAILED, res);
            });
        },
    }
;

module.exports = obj;
