"use strict";

const Models    = require('./../v1/model');
const common    = require("./common");
const redis     = require("./../utils/eventManager");

const { loginModel }= Models;

(function makeAdmin() {
    loginModel.findOne({'email': "superadmin@admin.com", "role": "superadmin"}).lean()
    .then(result => {
        if(!result) {
            loginModel({
                "email":"superadmin@admin.com",
                "account_varify_otp": "",
                "password": common.generateHash("admin123"),
                "role": "superadmin"
            }).save(err => {
                if(err) console.error(err);
            })
        }
    });
}());

(function setSystemShutdownInRedis() {
    redis.get('system-shutdown')
    .then(result => {
        if(!result) redis.set('system-shutdown', "false");
    });
}());