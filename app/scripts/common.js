"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt-nodejs");

const logzioLogger = require("logzio-nodejs").createLogger({
    token: "kBwgtFSYFHKbCDZNoDsomAqhKClFZJOS"
});

module.exports = (() => {
    let commonObject = Object.create(null);

    commonObject.tokenExpiryTime = 10000;
    commonObject.accessTokenDays = 15;

    commonObject.getId = req => jwt.decode(req.headers["x-access-token"]).data;

    commonObject.successMessage = (message, data = []) => ({
        status: true,
        code: 200,
        message,
        data
    });

    /*
        @description : meta function to make errors
        @example : commonObject.failurexxx = commonObject.makeFailure(400, "Bad Request")
    */
    commonObject.makeFailure = (code, msg) => usermsg => ({
        status: false,
        code: code,
        message: msg || usermsg
    });

    commonObject.failure400 = () => ({
        status: false,
        code: 400,
        message: "Bad Request"
    });

    commonObject.generateHash = password =>{
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }

    commonObject.failure422UnprocessableEntity = message => ({
        status: false,
        code: 422,
        message
    });

    commonObject.failure403Forbidden = message => ({
        status: false,
        code: 403,
        message
    });

    commonObject.failure404NotFound = message => ({
        status: false,
        code: 404,
        message
    });

    commonObject.failure401Unauthorised = message => ({
        status: false,
        code: 401,
        message
    });

    commonObject.failure500 = message => ({
        status: false,
        code: 500,
        message
    });

    commonObject.failure501 = () => ({
        status: false,
        code: 501,
        message: "Something went wrong"
    });

    commonObject.failure = (code, message) => ({
        status: false,
        code,
        message
    });

    commonObject.verifyJWT = (secret, token, cb) => {
        // verifies secret and checks exp
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                console.log("err=>" + err);
                return cb("Failed to authenticate token.", undefined);
            } else {
                // if everything is good, save to request for use in other routes
                return cb(false, decoded);
            }
        });
    };

    commonObject.error = (err, res) => {
        console.error("err=>", err);

        //write send sms on any error code here
        return res.json(commonObject.failure(501, "Something went wrong"));
    };

    commonObject.resetPasswordMilSec = 24 * 60 * 60 * 1000; // 24 hrs.

    commonObject.wrongPasswordMilSec = 24 * 60 * 60 * 1000; // 24 hrs.accessTokenDays

    commonObject.superSecretSignupToken = 3;

    commonObject["2a08c65sdTQUCPfnAdqgSqyzJ"] = 3;

    commonObject.forgetPasswordAccessToken = 3;

    commonObject.superSecretChangeEmailToken = 3;

    commonObject.newIPAccessToken = 3;

    commonObject.other = 3;

    commonObject.csrfMaxAge = 60 * 60 * 24; // 1 day

    commonObject.loginJWTExpiry = 24 * 60 * 60 * 365; // expires in 1 year

    commonObject.getAccessToken = (secret, data) =>
        jwt.sign({ data }, secret, {
            expiresIn:
                24 * 60 * 60 * (commonObject[secret] || commonObject["other"]) // expires in 1 day * commonObject[secret]
        });

    commonObject.logzeo = (functionName, msg, type) => {
        var obj = {
            message: msg,
            functionName: functionName,
            type: type,
            appName: "bitcoin-wallet",
            time: new Date().toISOString()
        };

        logzioLogger.log(obj);
    };

    commonObject.frontEndURL = "http://localhost:4200";

    return commonObject;
})();
