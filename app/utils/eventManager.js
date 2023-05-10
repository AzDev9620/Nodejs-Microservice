var Redis = require('ioredis');
var config = require('../../config');
var redis = new Redis(config.redis);

redis.on('message', function (channel, message) {
    // Receive message Hello world! from channel news
    // Receive message Hello again! from channel music
    console.log('Receive message %s from channel %s', message, channel);
});


var watch = function (user, msg) {
    // watch for 5 minute
    redis.set(user, msg, 'ex', 300)

};

var check = function (user, msg, cb) {
    redis.get(user).then(function (result) {
        return cb(result == msg)
    });
};

var get = function (key) {
    return redis.get(key);
};

var set = function (key, value) {
    // watch for 5 minute
    redis.set(key, value)

};

module.exports = {
    watch: watch,
    check: check,
    get: get,
    set: set
};
