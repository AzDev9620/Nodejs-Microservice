/**
 * Created by prince on 19/03/18.
 */

var config = require('./config');
var validator = require('./app/utils/validator');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var express = require('express');
var path = require('path');
var app = express();
var http = require('http');
var server = http.createServer(app);
var mongoSanitize = require('mongo-express-sanitize');
var helmet = require('helmet');

const expressValidator = require('express-validator');
const requestIp = require('request-ip');
const passport  = require('passport'); //For authentication
const session   = require('express-session');
const MongoStore= require('connect-mongo')(session);
const cors      = require('cors');

mongoose.Promise = require('bluebird');

app.set("trust proxy", function(ip) { return true });
app.set("trust proxy", true);

require('./app/scripts/passport')(passport);

app.use(cors());
app.use(helmet());
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
app.use(requestIp.mw());
app.use(expressValidator(validator.customSanitizers));
app.use(validator.stringifyAndTrimBody);
app.use(mongoSanitize.default());

app.set('trust proxy', 1);

// required for passport
app.use(session({
    secret: 'thisisareallylongsupersecretfromalmoraauthproject',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
})); // session secret

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

var connection = mongoose.connection;
connection.on('error', function (error) {
    //console.error.bind(console, 'error connecting with mongodb database:')
    console.log('Mongodb Connection Error');
    console.log(error);
});

connection.once('open', function () {
    console.log('database connected event log');
});

connection.on('disconnected', function () {
    //Reconnect on timeout
    mongoose.connect(config.db, {
        server: {
            auto_reconnect: true,
            socketOptions: {
                keepAlive: 500,
                connectTimeoutMS: 90000,
                socketTimeoutMS: 90000
            }
        }
    });
}, function (err) {
    if (err)
        console.log(err);
    else {
        console.log('database connected after disconnect');
    }
    connection = mongoose.connection;
});

mongoose.connect(config.db, {
    server: {
        auto_reconnect: true,
        socketOptions: {
            keepAlive: 500,
            connectTimeoutMS: 90000,
            socketTimeoutMS: 90000
        },
        connectWithNoPrimary: true
    }
}, function (err) {
    if (err) {
        console.log('Mongodb connection error 1st');
        console.log(err);
    }
    else {
        console.log('database connected');
    }

});

require('./app/routes')(app, passport);

server.listen(config.port, function (err) {
    if (err)
        console.log(err);
    else
        console.log('server running at  ' + config.port);

});
