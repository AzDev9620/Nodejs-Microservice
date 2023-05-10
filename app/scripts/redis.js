var redis = require('redis');
var config= require('./../../config');
var client = redis.createClient(config.redis);

client.on("error", function (err) {
   console.log(err);
});

client.on('connect', function() {
   console.log('redis connected');

});


//promisify redis commands
// bluebird.promisifyAll(redis.RedisClient.prototype);
// bluebird.promisifyAll(redis.Multi.prototype);

module.exports = client;