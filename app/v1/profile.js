"use strict";

//Required Files
const common = require("./../scripts/common");
const Models = require('../v1/model');
const mailer = require("./../utils/mailer");
const handler = require('./../utils/handler');
const redis = require("./../utils/eventManager");
var date = require("./../utils/datesHelper");
const jwt = require('jsonwebtoken');

const { loginModel, apiPermissionsModel } = Models;
var config = require("../../config");
var Redis = require("redis");
var redisClient = Redis.createClient(config.redis);
console.log(config.redis,"redisClient")

var userFunc;
require("./user_model").then(function(response){
    userFunc = response.user_kyc_model;
    console.log(userFunc,"userFunc");
})



module.exports = (() => {
    let profileObject = Object.create(null);

    profileObject.logout = (req, res) => {
        req.logout();
        return handler.sendRes(true, "SUCCESS", {}, {}, res);
    }

    profileObject.checkIfEntityExists = function checkIfEntityExists(req, res, next) {
        let { email = '' } = req.body;
        if (email) {
            loginModel.findOne({ email, role: req.params.entity }).lean()
                .then(user => {
                    if (user) return handler.sendErr("", 422, "User Already Exists", res);
                    else next();
                })
                .catch(err => {
                    return handler.sendErr(err, 501, "Something went wrong", res);
                });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    profileObject.makeEntity = function makeEntity(req, res) {
        let { email = '', mobile_num = '', password = '', name = '', permissions = [] } = req.body;

        permissions = permissions.split(',');

        if(permissions.includes("Auditor") && permissions.includes("Accountant")) return handler.sendErr("", 422, "Invalid Permissions", res);

        if (email && password) {
            let loginRef = new loginModel();
            loginRef.phone = mobile_num;
            loginRef.email = email;
            loginRef.password = loginRef.generateHash(password);
            loginRef.role = req.params.entity;
            loginRef.name = name;
            loginRef.permissions = permissions;

            loginRef.save((err, result) => {
                if (err) {
                    handler.sendErr(err, 501, "Something went wrong", res);
                } else return handler.sendRes(true, "SUCCESS", {}, {}, res);
            });
        } else return handler.sendErr("", 422, "required fields missing", res);
    }

    profileObject.updateEntity = function updateEntity(req, res) {
        let { user_id = '', email = '', mobile_num = '', password = '', name = '', permissions = '', role = '' } = req.body;

        if (user_id) {
            permissions = permissions.split(',');
            if(permissions.includes("Auditor") && permissions.includes("Accountant")) return handler.sendErr("", 422, "Invalid Permissions", res);

            let query = { "_id": user_id };
            let update = {
                "$set": {}
            };
            if (email) update["$set"]["email"] = email;
            if (mobile_num) update["$set"]["phone"] = mobile_num;
            if (name) update["$set"]["name"] = name;
            if (role) update["$set"]["role"] = role;
            if (permissions) update["$set"]["permissions"] = permissions;
            if (password) update["$set"].password = common.generateHash(password);

            loginModel.updateOne(query, update).lean()
                .then(loginUser => {
                    if(loginUser.n) return handler.sendRes(true, "SUCCESS", {}, {}, res);
                    else return handler.sendErr("", 422, "Record not found", res);
                })
                .catch(err => {
                    return handler.sendErr(err, 501, "Something went wrong", res);
                });
        } else return handler.sendErr(err, 422, "required fields missing", res);
    }

    profileObject.getSkippedKyc = function (req, res) {
        const id = common.getId(req)
        redisClient.get(id, function (err, user_kyc) { // Checking if admin is already present in REDIS LIST
            if(err) return handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
            if (!user_kyc) {
                console.log("Admin not in admin_list");
                redisClient.lpop('kyc_list_skipped', function (err, kyc) {
                    if (!kyc) {
                        console.log("no data in kyc_list_skipped");
                       return handler.sendRes(true, "Users Fetched Successfully",  [], {}, res);
                    } else {
                        redisClient.set(id, JSON.parse(kyc).kyc_id); // Mapping user_kyc with Admin in redis ...
                        console.log('POPPED KYC_LIST - KYC_id - ' + JSON.parse(kyc).kyc_id);
                        serveKyc(JSON.parse(kyc).kyc_id);
                    }
                });
            } else {
                console.log(user_kyc); // Serving usr_kyc associated with the admin present in the REDIS LIST
                serveKyc(user_kyc);
            }
        });

        function serveKyc(user_kyc) { // serving kyc function ..
            userFunc.find({
                "_id": user_kyc,
                "kycStatus": "skipped"
            }, "", "", function (err, data) {
                if (err)
                   {console.log(err);if(err) return handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);}
                else {
                    {console.log(data);return handler.sendRes(true, "Users Fetched Successfully",  data,{}, res);}
                }
            });
        }
    }

    profileObject.getPrefs = function (req, res) {
        var query = req.query;
        if(!query.id){
           return res.status(401).send({message:"INVALID_PARAMS"})
        }
        console.log("queri.id",query.id)
        userFunc.findOne({
            "_id": query.id
        }, "kycStatus firstName lastName email.value kyc kycComment address billingAddress mailingAddress dob nationality", "", function (err, data) {
            if (err) {
               handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
            } else {
                if (!data || data == null)
                   handler.sendErr(err, 404, "Not found", res);
                else
                {
                    handler.sendRes(true, "SUCCESS", {}, data, res);
                }
            }
        });
    };

    profileObject.setPrefs = function (req, res) {
        var query = req.query;
        var data = req.body.data;///reading the data field
        delete req.body.data.__v;
        console.log(data,typeof data);
        console.log("checking for setPrefs",data);
        if(!query.id){
           return res.status(401).send({message:"INVALID_PARAMS"})
        }
        console.log("queri.id",query.id)
        userFunc.findOneAndUpdate({
            "_id": query.id
        }, data, function (err, kyc) {
            if (err) {
               handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
            } else {
                if (kyc.kycStatus == 'processing') {
                    redisClient.rpush('kyc_list', JSON.stringify({
                        "kyc_id": kyc._id,
                        "status": kyc.kycStatus
                    }));
                    handler.sendRes(true, "User info updated successfully", "", {}, res);

                }else{
                    handler.sendRes(true, "User info updated successfully", "", {}, res);
                }
            }
        });
    };

    profileObject.saveKycDetails = function (req, res) {
        var doctype = req.query.docType;
        var query = req.query;
        var queryStringPicture = `kyc.${doctype}.picture`;
        var queryStringNumber = `kyc.${doctype}.number`;

        userFunc.findOneAndUpdate({
            "_id": query.userId
        }, {
            [queryStringPicture]: req.file.location,
            [queryStringNumber]: query.number
        }, function (err, data) {
            if (err) {
               handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
            } else {
               handler.sendRes(true, "Doc Uploaded successfully", "", {}, res);
            }
        });
    };

    profileObject.getUserKyc = function (req, res) {
        console.log("running");
        console.log("runnning get uyser kyc")
        var admin = {};
        admin._id = common.getId(req);
        console.log( common.getId(req),"****************");
        redisClient.get(admin._id, function (err, user_kyc) { // Checking if admin is already present in REDIS LIST
            if(err) return handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
            if (!user_kyc) {
                console.log("Admin not in admin_list");
                redisClient.lpop('kyc_list', function (err, kyc) {
                    if (!kyc) {
                        console.log("no data in kyc_list");
                        handler.sendRes(true, "Users Fetched Successfully", [],{}, res);
                    } else {
                        redisClient.set(admin._id, JSON.parse(kyc).kyc_id); // Mapping user_kyc with Admin in redis ...
                        console.log('POPPED KYC_LIST - KYC_id - ' + JSON.parse(kyc).kyc_id);
                        serveKyc(JSON.parse(kyc).kyc_id);
                    }
                });
            } else {
                console.log(user_kyc); // Serving usr_kyc associated with the admin present in the REDIS LIST
                serveKyc(user_kyc);
            }
        });

        function serveKyc(user_kyc) { // serving kyc function ..
            console.log("as")
            userFunc.find({
                "_id": user_kyc,
                "kycStatus": "processing"
            }, "", "", function (err, data) {
                console.log(err,data)
                if (err)
                   return handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
                else {
                  return  handler.sendRes(true, "Users Fetched Successfully", data,data, res);
                }
            });
        }
    };

    profileObject.updateUserKyc = function (req, res) {
        var body = req.body;
       var admin = {};
       admin._id = common.getId(req);
        var obj = {
            "kycStatus": body.action,
            "kycVerifiedBy": admin._id,
            "kycComment": body.comment,
            "verifiedOn": date.unixTimestamp()
        };
        userFunc.findOneAndUpdate({
            "_id": body.id
        }, obj, function (err, data) {
            if (err)
                {
                    console.log(err);
                    return handler.sendErr(err, 500, "INTERNAL_SERVER_ERROR", res);
                }
            else {
                redisClient.DEL(admin._id);
                if (data.kycStatus == 'skipped') {
                    redisClient.rpush('kyc_list_skipped', JSON.stringify({
                        "kyc_id": data._id,
                        "status": data.kycStatus
                    }));
                  return  handler.sendRes(true,"", "Kyc updated...", "", res);
                } else if (data.kycStatus == 'completed') {
                    var opts1 = {
                        email: data.email.value,
                        subject: 'Bittoria KYC Verification',
                        type: 'kyc-success',
                        data: {
                            name: data.name,
                            company: config.emailSender[0].mailData.company,
                            support: config.emailSender[0].mailData.support,
                            mailer: 0
                        }
                    }
                    mailer.send(opts1);
                    return  handler.sendRes(true, "","Kyc updated...", "", res);
                } else if (data.kycStatus == 'rejected') {
                    console.log('........')
                    var opts1 = {
                        email: data.email.value,
                        type: 'kyc-reject',
                        subject: 'Bittoria KYC Rejected',
                        data: {
                            name: data.name,
                            reasons: data.kycComment,
                            company: config.emailSender[0].mailData.company,
                            support: config.emailSender[0].mailData.support,
                            mailer: 0
                        }
                    }
                    userFunc.findOneAndUpdate({
                        "_id": body.id
                    }, {
                        "kyc": {}
                    }, function (e, r) {
                        if (r) {
                            mailer.send(opts1);
                            return  handler.sendRes(true,"","Kyc updated...", "", res);
                        }
                    });
                }
            }
        });
    };


    profileObject.getMyRole = function getMyRole(req, res) {
        const id = common.getId(req) // retrive user id from token to find the role
        loginModel.findOne({ "_id": id }).lean()
        .then((user) => {
            if (user) {
                handler.sendRes(true, "SUCCESS", {
                    role: (user && user.role.toUpperCase()) || "" // converting to uppercase due to frontend dep
                }, {}, res);
            } else {
                handler.sendErr("invalid token", 404, "x-access-token invalid", res);
            }
        });
    }

    return profileObject;
})();