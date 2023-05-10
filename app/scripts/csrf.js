"use strict";

const Tokens= require('csrf');
const cookie = require('cookie');

const handler   = require('./../utils/handler');

module.exports= ( () => {

    let csrfObject= Object.create(null);

    let csrf= new Tokens();

    let secret= csrf.secretSync();

    csrfObject.token= () => csrf.create(secret);

    csrfObject.varifyToken= function varifyToken(req, res, next) {

        return next();
    }

    return csrfObject;
})();
