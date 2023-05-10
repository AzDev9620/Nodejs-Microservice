var date = require('../utils/datesHelper'),
    _ = require('lodash');
    function UserModel() {
    }
require('./user_model').then(function(model){
model = model.user_kyc;
        
        UserModel.prototype.find = function (params, selector, query, cb) {
            model.find(params, function (err, list) {
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
            console.log(model)
            model.findOne(params, function (err, data) {
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
            new model(obj).save(function (err, data) {
                if (!err) {
                    cb(false, data);
                } else {
                    cb(err, false);
                }
            });
        };

        UserModel.prototype.count = function (params, cb) {
            model.count(params, function (err, count) {
                if (!err) {
                    cb(false, count);
                } else {
                    cb(err, false);
                }
            });
        };

        UserModel.prototype.findOneAndUpdate = function (query, params, cb) {
            model.findOneAndUpdate(query, params, {new: true, upsert: true}, function (err, data) {
                if (!err) {
                    cb(false, data);
                } else {
                    cb(err, false);
                }
            });
        };

        UserModel.prototype.update = function (query, params, cb) {
            model.update(query, { $setOnInsert : params }, function (err, data) {
                if (!err) {
                    cb(false, data);
                } else {
                    cb(err, false);
                }
            });
        };

        module.exports = new UserModel();

    }).catch(function(error){
        console.log(error)
    })
 