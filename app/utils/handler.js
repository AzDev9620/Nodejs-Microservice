"use strict";
var httpStatus = require('http-status-codes');
// const EthCrypto = require('eth-crypto');
var hybrid = require('hybrid-crypto-js');
var rsa=  new hybrid.RSA();
var crypt = new hybrid.Crypt();

const Models    = require('../v1/model');
const { keysModel }= Models;
var handler = {

        /*GENERAL*/
        NOT_AUTHORISED: "Not Authorised",
        INVALID_ACCESS: "No Access",
        WRONG_PSWD: "Wrong password",
        WRONG_PARAMS: "Invalid Username or Password",
        ARG_MISSING: "Arguments Missing",
        ARG_WRONG: "Arguments Wrong",
        INVALID_PHONE: "Invalid Phone Number",
        INVALID_USERNAME: "Invalid Username",
        INVALID_EMAIL: "Invalid Email Address",
        EMAIL_SENT: "Email sent successfully",
        EMAIL_NOTSET: "Email Not Set",
        EMAIL_NOTVERIFIED: "Email Not Verified",
        EMAIL_VERIFIED : "Email Verified",
        PHONE_NOTSET: "Phone Not Set",
        PHONE_NOTVERIFIED: "Phone Not Verified",
        ACCOUNT_SUSPENDED: "Account Suspended",
        ACCOUNT_INACTIVE: "Account Inactive",
        BLOCKED: "Account Blocked",
        SIGNUP_INCMP: "Signup Incomplete",
        BAD_REQUEST : "Bad Request",

        PSWD_EXISTS: "Password Already Set",
        PSWD_SET: "Password Set Successfully",

        /*  UPDATE, CREATE, EXISTING  */
        EXISTING: " Already Exists",
        CREATION_FAILED: "Record Creation Failed",
        UPDATE_FAILED: "Record Updation Failed",
        ERROR: "Something went wrong",

        /*USER*/
        USER_NOT_FOUND: "User Not Found",
        WRONG_USER_CREDENTIAL: "Invalid User Credentials",
        ALREADY_EXISTS: "User Already Exists",

        /*  TOKEN  */
        TOKEN_EXPIRED: "Token Expired",
        TOKEN_NOT_FOUND: "Token Not Found",

        /* VERIFY */
        OTP_NOTVERIFIED: "Code Wrong Or Expired",

        /* MPIN */
        INVALID_MPIN: "Invalid MPIN entered",
        MPIN_SET: "MPIN set successfully",
        MPIN_ALREADYSET: "MPIN already set",
        MPIN_NOTSET: "MPIN not set",

        /* PASSPHRASE */
        INVALID_PASSPHRASE: "Invalid Passphrase entered",
        PASSPHRASE_SET: "Passphrase set successfully",
        PASSPHRASE_ALREADYSET: "Passphrase already set",
        PASSPHRASE_NOTSET: "Passphrase not set",

        VERIFICATION_SENT: "Verification OTP Sent",
        VERIFICATION_EMAIL_SENT : "Verification Email Sent",
        OTP_ERROR : "Error while sending OTP",

        CAPTCHA_FAILED: "Captcha Failed",
        CAPTCHA_MISSING: "Captcha Missing",

        GAUTH_SET_FOR_V: "GAuth set for verification",
        GAUTH_SET: "GAuth set for user",
        GAUTH_ALREADYSET: "GAuth already set for user",
        GAUTH_NOTSET: "GAuth not set for user",
        GAUTH_FAILED: "Failed to set GAuth",
        GAUTH_INVALID: "GAuth code invalid",

        FCM_SET: "FCM Token Set",
        FCM_ALREADYSET: "FCM Token Already Set",

        WALLET_ADDED: "Wallet Added",
        WALLET_REMOVED: "Wallet Removed",
        WALLET_EXISTS: "Wallet already exists",
        WALLET_EMPTY: "No Wallet found",



        sendErr: sendErr,

        sendRes: function (success, msg, data, statusObj, res, user_id= "", token= "") {

            if(user_id) {
                if(token) data.token= token;
                return res.status(httpStatus.OK).send({success: success, message: msg.toLowerCase(), status : statusObj, data: data});
            }
            else {
                return res.status(httpStatus.OK).send({success: success, message: msg.toLowerCase(), status : statusObj, data: data});
            }
        },
    };

// function
function sendErr(err, status, msg, res, external_code= "") {
    console.log(err);
    let errObj= {code : status, description : ""};
    var obj = {
        success: false,
        data: {},
        status: errObj || {},
        msg : msg || ""
    };
    res.status(external_code || status).send({success: obj.success, message: obj.msg.toLowerCase(), status : obj.status, data: obj.data});
}

module.exports = handler;

