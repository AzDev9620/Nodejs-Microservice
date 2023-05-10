const mongoose  = require('mongoose');
const requestPromise = require('request-promise');
var bluebird = require("bluebird");
var config = require("../../config");

mongoose.Promise = require('bluebird');
var options = {promiseLibrary: require('bluebird'), useMongoClient: true, server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }};
var promise = mongoose.createConnection(config.user_auth, options);

var model = require("./model")
var user_model = model.user_login;
var user_kyc = model.user_kyc;

function UserModel(){
    var self = this;
}

var doConnect = function(){
    return new bluebird.Promise(function(resolve,reject){
        promise.then(function(db){
            console.log("user auth model connected");
            try{
                if(db.model('user_logins')) {
                    user_model = db.model('user_logins');

                }
            }catch(e) {
                user_model     = db.model('user_logins',user_model);

            }

            try{
                if(db.model('user_kyc')) {
                    user_kyc = db.model('user_kyc');

                }
            }catch(e) {
                user_kyc     = db.model('user_kyc',user_kyc);

            }

            UserModel.prototype.find = function (params, selector, query, cb) {
                user_kyc.find(params, function (err, list) {
                    if (!err) {
                        cb(false, list);
                    } else {
                        cb(err, false);
                    }
                })
                    .select(selector || '')
                    .populate(query || '')
                    .sort({"createdAt":-1})
            };

            UserModel.prototype.findOne = function (params, selector, query, cb) {
                user_kyc.findOne(params, function (err, data) {
                    if (!err) {
                        cb(false, data);
                    } else {
                        cb(err, false);
                    }
                })
                    .select(selector)
                    .populate(query);
            };

            UserModel.prototype.create = function (obj, cb) {
                obj = _.omit(obj, ['_id', 'loginAt', 'updatedAt', 'isBlocked', 'unblockAt', 'isActive']);
                obj.createdAt = date.unixTimestamp();
                new user_kyc(obj).save(function (err, data) {
                    if (!err) {
                        cb(false, data);
                    } else {
                        cb(err, false);
                    }
                });
            };

            UserModel.prototype.count = function (params, cb) {
                user_kyc.count(params, function (err, count) {
                    if (!err) {
                        cb(false, count);
                    } else {
                        cb(err, false);
                    }
                });
            };

            UserModel.prototype.findOneAndUpdate = function (query, params, cb) {
                params.updatedAt= parseInt(Date.now()/1000);
                params= {
                    "$set": params,
                    "$setOnInsert": {
                        "createdAt": parseInt(Date.now()/1000)
                    }
                };
                user_kyc.findOneAndUpdate(query, params, {new: true, upsert: true}, function (err, data) {
                    if (!err) {
                        cb(false, data);
                    } else {
                        cb(err, false);
                    }
                });
            };

            UserModel.prototype.update = function (query, params, cb) {
                user_kyc.update(query, { $setOnInsert : params }, function (err, data) {
                    if (!err) {
                        cb(false, data);
                    } else {
                        cb(err, false);
                    }
                });
            };
            var usermodel = new UserModel();
            return resolve({user_kyc:user_kyc,user_model:user_model,user_kyc_model:usermodel})
        }).catch(function(error){

            console.log("error in connecting user auth");

        })



    })
}


module.exports = doConnect();
