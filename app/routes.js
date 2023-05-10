"use strict";

const express = require('express');

require('./scripts/eefeToSetupEnvironment');

module.exports= function routes(app, passport) {

    const router_v1= express.Router();

    require('./v1/index')(router_v1, passport);

    app.use('/v1', router_v1);
}