"use strict";

//Required Files
const common = require("./../scripts/common");
const Models = require('../v1/model');
const handler = require('./../utils/handler');
const redis = require("./../utils/eventManager");
const mailer = require("./../utils/mailer");
const request = require('request');
const jwt    = require('jsonwebtoken');

const config = require("./../../config");

const requestPromise = require('request-promise');
const uuid = require('uuid');

const { adminAuditModel, userAuditModel, apiPermissionsModel, loginModel, countryAdvertisementModel, configModel } = Models;

module.exports = (() => {
    let adminObject = Object.create(null);

    adminObject.getAdminAuditTrails = function getAdminAuditTrails(req, res) {
        let admin_id = req.query.admin_id;
        adminAuditModel.findOne({ admin_id }).lean()
            .then(audits => {
                return handler.sendRes(true, "SUCCESS", audits || {}, {}, res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.getUserAuditTrails = function getUserAuditTrails(req, res) {
        let user_id = req.query.user_id;
        userAuditModel.findOne({ user_id }).lean()
            .then(audits => {
                return handler.sendRes(true, "SUCCESS", audits || {}, {}, res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.systemShutdown = function systemShutdown(req, res) {
        redis.set('system-shutdown', "true");
        return handler.sendRes(true, "SUCCESS", {}, {}, res);
    }

    adminObject.systemStart = function systemStart(req, res) {
        redis.set('system-shutdown', "false");
        return handler.sendRes(true, "SUCCESS", {}, {}, res);
    }

    adminObject.saveAudit = function saveAudit(req, res) {
        let query = {
            admin_id: req.decoded.data
        };
        let update = {
            "$setOnInsert": {
                _id: uuid.v4(),
                admin_id: req.decoded.data
            },
            "$push": { auditTrail: req.audit }
        }
        adminAuditModel.findOneAndUpdate(query, update, { upsert: true }, err => {
            if (err) return handler.sendErr(err, 501, "Something went wrong", res);
            else return handler.sendRes(true, "SUCCESS", {}, {}, res);
        });
    }

    adminObject.saveUserAudit = function saveUserAudit(req, res) {

        req.decoded= jwt.decode(req.headers['x-access-token']);
        let query = {
            user_id: req.decoded.data.user_id
        };
        let update = {
            "$setOnInsert": {
                _id: uuid.v4(),
                user_id: req.decoded.data.user_id
            },
            "$push": { auditTrail: req.body.audit }
        };
        userAuditModel.findOneAndUpdate(query, update, { upsert: true }, err => {
            if (err) return handler.sendErr(err, 501, "Something went wrong", res);
            else return handler.sendRes(true, "SUCCESS", {}, {}, res);
        });
    }

    adminObject.sendMail = function sendMail(req, res, next) {
        let { content = '', emailids = '', subject= "Bittoria Notification" } = req.body;

        let opts = {
            emails: emailids,
            content: content,
            data:{
                mailer:0
            },
            subject: subject
        };

        mailer.send(opts)
            .then(result => {
                req.audit = {
                    created_at: (Date.now() / 1000).toFixed(0),
                    action: subject,
                    sent_to: emailids
                };
                return next();
            })
            .catch(err => {
                console.log(err)
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.toggleBlockUser = function blockUser(req, res) {
        let { user_id = '', isBlocked = undefined } = req.body;

        if (user_id && isBlocked != undefined) {
            var options = {
                method: 'POST',
                uri: config.app.userAuth + "/v1/toggle/block/user",
                formData: {},
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-access-token': common.getAccessToken("2a08c65sdTQUCPfnAdqgSqyzJ", { user_id, isBlocked })
                }
            };
            requestPromise(options)
                .then(body => {
                    body = JSON.parse(body);
                    if (body.success) return handler.sendRes(true, "SUCCESS", {}, {}, res);
                    else return handler.sendErr("", 422, "request to toggle block user failed", res);
                })
                .catch(function(err) {
                    return handler.sendErr(err, 501, "Something went wrong", res);
                });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    ////check the user is blocked or not
    adminObject.checkBlockUser = function (req, res) {
        let { user_id = '', isBlocked = undefined } = req.body;

        if (user_id && isBlocked != undefined) {
            var options = {
                method: 'GET',
                uri: config.app.userAuth + "/v1/check/block/user",
                formData: {},
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-access-token': common.getAccessToken("2a08c65sdTQUCPfnAdqgSqyzJ", { user_id, isBlocked })
                }
            };
            requestPromise(options)
                .then(body => {
                    body = JSON.parse(body);
                    console.log("body is",body);
                    if (body.success) return handler.sendRes(true, "SUCCESS", {}, {}, res);
                    else return handler.sendErr("", 422, "request to toggle block user failed", res);
                })
                .catch(function(err) {
                    return handler.sendErr(err, 501, "Something went wrong", res);
                });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    adminObject.addPermission = function addPermission(req, res) {
        let { path = '', roles = [], permissions = [] } = req.body;

        if (path && roles && permissions) {
            req.body.roles = req.body.roles.split(',');
            req.body.permissions = req.body.permissions.split(',');
            let apiPermissionsRef = apiPermissionsModel(req.body);
            apiPermissionsRef.save(err => {
                if (err) return handler.sendErr(err, 501, "Something went wrong", res);
                else return handler.sendRes(true, "SUCCESS", {}, {}, res);
            });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }


    adminObject.getPermissions = function getPermissions(req, res){
    	loginModel.findOne({ _id: req.decoded.data }).lean()
            .then(user => {
                if (user) {
                	return handler.sendRes(true, "SUCCESS", user.permissions, {}, res);
                }else{
                	return handler.sendErr(err, 422, "no permissions found", res);
                }
	            }).catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }


    // this is for internal user only
    adminObject.checkPermissions = function checkPermissions(req, res, next) {
        let path = req.body.path || req.path;

        loginModel.findOne({ _id: req.decoded.data }).lean()
            .then(user => {
                if (user) {

                    if (user.role === "superadmin") {
                        if(req.path === "/checkpermission") return handler.sendRes(true, "SUCCESS", {}, {}, res);
                        else return next();
                    }

                    if (!user.permissions.length) return handler.sendErr("", 401, "not authorised to use this service", res);

                    let query = { path, roles: user.role };
                    apiPermissionsModel.findOne(query).lean()
                        .then(apiPermissions => {
                            if (apiPermissions && apiPermissions._id) {
                                let hasPermission = apiPermissions.permissions.every(permission => user.permissions.includes(permission));
                                if(hasPermission && req.path==="/checkpermission") return handler.sendRes(true, "SUCCESS", {}, {}, res);
                                else if(hasPermission) return next();
                                else return handler.sendErr("", 403, "not authorised to use this service", res);
                            }
                            else return handler.sendErr("", 403, "not authorised to use this service", res);
                        })
                        .catch(err => {
                            return handler.sendErr(err, 501, "Something went wrong", res);
                        });
                } else return handler.sendErr("", 401, "user not found", res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.checkSuperadmin = function checkSuperadmin(req, res, next) {
        loginModel.findOne({ _id: req.decoded.data }).lean()
            .then(user => {
                if (user && user.role === "superadmin") return next();
                else return handler.sendErr("", 401, "not authorised to use this service", res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.checkSystemShutdown = function checkSystemShutdown(req, res, next) {
        redis.get("system-shutdown")
            .then(result => {
                console.log("result", result);
                if (result == "true") return handler.sendErr("", 401, "system is in shutdown state", res);
                else {
                    if (req.path === "/system/shutdown") return handler.sendRes(true, "SUCCESS", { "status": result }, {}, res);
                    else return next();
                }
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.getWithdrawals= function getWithdrawals(req, res) {
        let options = {
            uri: config.app.dataServiceURL + "/v1/get/withdrawals/by/admin",
            headers: {
                'x-access-token': common.getAccessToken(config.userAuthSecret, {})
            },
            qs: req.query,
            json: true
        };
        requestPromise(options)
            .then(body => {
                if (body.message) return handler.sendRes(true, "SUCCESS", body.data, {}, res);
                else return handler.sendErr("", 422, "request to toggle block user failed", res);
            })
            .catch(function(err) {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.togglePairRestrict= function togglePairRestrict(req, res) {
        if(!req.body.pair || !req.body.restrict) return handler.sendErr("", 422, "required fields missing", res);

        var options = {
            uri: config.app.tradingEngine + "/api/v1/exchange/toggle/pair/restrict",
            qs: req.body,
            headers: {
                'x-access-token': req.headers['x-access-token']
            },
            json: true
        };
        requestPromise(options)
            .then(body => {
                if (body.message) return handler.sendRes(true, "SUCCESS", {}, {}, res);
                else return handler.sendErr("", 422, "request to toggle pair restriction failed", res);
            })
            .catch(function(err) {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.getDeposits= function getDeposits(req, res) {
        let options = {
            uri: config.app.dataServiceURL + "/v1/get/deposits/by/admin",
            headers: {
                'x-access-token': common.getAccessToken(config.userAuthSecret, {})
            },
            qs: req.query,
            json: true
        };
        requestPromise(options)
            .then(body => {
                if (body.message) return handler.sendRes(true, "SUCCESS", body.data, {}, res);
                else return handler.sendErr("", 422, "request to toggle block user failed", res);
            })
            .catch(function(err) {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.cancelOrder= function cancelOrder(req, res) {
        var options = {
            method: 'POST',
            uri: config.app.tradingEngine + "/api/v1/exchange/cancelOrder",
            headers: {
                'x-access-token': common.getAccessToken(config.userAuthSecret, req.body.user_id)
            },
            form: req.body,
            json: true
        };
        requestPromise(options)
        .then(body => {
            if (body.message) return handler.sendRes(true, "SUCCESS", body.data, {}, res);
            else return handler.sendErr("", 501, "Something went wrong", res);
        })
        .catch(function(err) {
            return handler.sendErr(err, 501, "Something went wrong", res);
        });
    }

    adminObject.getRestrictedPairs= function getRestrictedPairs(req, res) {
        var options = {
            uri: config.app.tradingEngine + "/api/v1/exchange/get/restricted/pairs",
            headers: {
                'x-access-token': req.headers['x-access-token']
            },
            json: true
        };
        requestPromise(options)
            .then(body => {
                if (body.message) return handler.sendRes(true, "SUCCESS", body.data, {}, res);
                else return handler.sendErr("", 501, "Something went wrong", res);
            })
            .catch(function(err) {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.createCountryAdvertisement = function createCountryAdvertisement(req, res, next) {
        if (req.body.country && req.body.image_url) {
            countryAdvertisementModel.findOne({ country: req.body.country }).lean()
                .then(countryAdvertisement => {
                    if (countryAdvertisement && countryAdvertisement._id) return handler.sendErr("", 422, "Already Exists", res);
                    else {
                        let countryAdvertisementRef = countryAdvertisementModel(req.body);

                        countryAdvertisementRef.save(err => {
                            if (err) return handler.sendErr(err, 501, "Something went wrong", res);
                            else {
                                req.audit = {
                                    created_at: (Date.now() / 1000).toFixed(0),
                                    action: "CREATE_COUNTY_ADVERTISEMENT",
                                    body: req.body
                                };
                                return next();
                            }
                        });
                    }
                })
                .catch(err => {
                    return handler.sendErr(err, 501, "Something went wrong", res);
                });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    adminObject.updateCountryAdvertisement = function updateCountryAdvertisement(req, res, next) {
        if (req.body.doc_id) {
            countryAdvertisementModel.findOneAndUpdate({ _id: req.body.doc_id }, { "$set": req.body }, (err, result) => {
                if (err) return handler.sendErr(err, 501, "Something went wrong", res);
                else {
                    delete req.body.doc_id;
                    req.audit = {
                        created_at: (Date.now() / 1000).toFixed(0),
                        action: "UPDATE_COUNTY_ADVERTISEMENT",
                        from: result,
                        to: req.body
                    };
                    return next();
                }
            });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    adminObject.getCountryAdvertisement = function getCountryAdvertisement(req, res) {
        let query = {};
        if (req.query.country) query.country = req.query.country;
        
        countryAdvertisementModel.find(query).lean()
            .then(countryAdvertisements => {
                return handler.sendRes(true, "SUCCESS", countryAdvertisements, {}, res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            })
    }

    adminObject.getadmins = function getadmins(req, res) {
        let { fieldname = '', search = '' } = req.query;
        let query = { role: req.params.role };
        if (fieldname && search) {
            if (fieldname == "status") query[fieldname] = search === "true";
            else query[fieldname] = { $regex: search, $options: 'im' };
        }
        loginModel.find(query, { password: 0 }).lean()
            .then(loginUsers => {
                return handler.sendRes(true, "SUCCESS", loginUsers, {}, res);
            })
            .catch(err => {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.getUsers = function getUsers(req, res) {
        var opts = {
            method: 'GET',
            uri: config.app.userAuth + "/v1/all/users/details",
            qs: req.query,
            headers: {
                'x-access-token': common.getAccessToken("2a08c65sdTQUCPfnAdqgSqyzJ", {}),
            },
            json: true
        };

        requestPromise(opts)
            .then(function(result) {
                return handler.sendRes(true, "SUCCESS", result, {}, res);
            })
            .catch(function(err) {
                return handler.sendErr(err, 501, "Something went wrong", res);
            });
    }

    adminObject.setConfig= function setConfig(req, res) {
        let {ethFeesPercent= "", btcFeesPercent= "", xrpFeesPercent= "", erc20FeesPercent= "", fiatFeesPercent= "", ltcFeesPercent= "", nemFeesPercent= ""}= req.body;

        if(!ethFeesPercent && !btcFeesPercent && !xrpFeesPercent && !erc20FeesPercent && !fiatFeesPercent) return handler.sendErr("", 422, "atleast one field text is required", res);

        let object= {};
        if(ethFeesPercent) object.ethFeesPercent= ethFeesPercent;
        if(btcFeesPercent) object.btcFeesPercent= btcFeesPercent;
        if(xrpFeesPercent) object.xrpFeesPercent= xrpFeesPercent;
        if(erc20FeesPercent) object.erc20FeesPercent= erc20FeesPercent;
        if(fiatFeesPercent) object.fiatFeesPercent= fiatFeesPercent;
        if(ltcFeesPercent) object.ltcFeesPercent= ltcFeesPercent;
        if(nemFeesPercent) object.nemFeesPercent= nemFeesPercent;

        let update= {
            "$set": object
        };
        configModel.findOneAndUpdate({}, update, {upsert: true, new: true}).lean()
        .then(result => {
            if(result) return handler.sendRes(true, "SUCCESS", result, {}, res);
            else return handler.sendErr("", 422, "record already present", res);
        })
        .catch(function(err) {
            return handler.sendErr(err, 501, "Something went wrong", res);
        });
    }

    adminObject.getConfig= function getConfig(req, res) {
        let {configId= ""}= req.query;
        let query= {};
        if(configId) query._id= configId;
        configModel.findOne(query).lean()
        .then(result => handler.sendRes(true, "SUCCESS", result, {}, res))
        .catch(err => handler.sendErr(err, 501, "Something went wrong", res));
    }

    return adminObject;
})();