var randomizer = require('random-number');
var request = require('request-promise');
var config = require('./../../config');
// fetch credentials from config
var p = require('plivo');
plivo = new p.Client(config.smsSender.plivo.accountSid, config.smsSender.plivo.authToken);

const options = {
    min: 100000,
    max: 999999,
    integer: true
};

var generateOtp = function () {
    return randomizer(options);
};

var sendOtp = function (number, content, cb) {
    if (!cb) cb = konsole;

    //Adding plus if it does not come in request
    if (number.charAt(0) != '+')
        number = '+' + number;

    if (number.substring(0, 3) == '+91')
        return sendViaMsg91(number, content, cb);
    else return sendViaTwilio(number, content, cb);

};


var sendViaMsg91 = function (number, content, cb) {

    console.log('Sending OTP via Msg91:' + number);

    /*mobile should be along with country code*/
    const options = {
        method: 'GET',
        uri: 'https://control.msg91.com/api/sendhttp.php?' +
        'authkey=' + config.smsSender.msg91.authkey + '&mobiles=' + number +
        '&message=' + content + '&sender=tokenmonk&route=4&country=0'
    };
    console.log(options);
    request(options)
        .then(function (message) {
            cb(null, message);
        })
        .catch(function (err) {
            return cb(err);
        });
};

var sendViaTwilio = function (number, content, cb) {

    console.log('Sending OTP via twilio:' + number);

    twilio.messages.create({
        to: number,
        from: config.smsSender.twilio.number,
        body: content
    }, function (err, message) {
        if (err) return cb(err);
        cb(null, message);
    });
};

var konsole = function (err, data) {
    if (err)
        console.log('err: ' + err);
    else console.log('data: ' + data);
};

module.exports = {
    generate: generateOtp,
    send: sendOtp
};
