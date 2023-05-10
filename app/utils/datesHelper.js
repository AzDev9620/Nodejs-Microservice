var moment = require('moment');

var format = {
    date: 'D/M/YYYY',
    timeStamp: 'D/M/YYYY hh:mm:ss',
    time: 'hh:mm:ss'
};


//Current Timestamp
var unixTimestamp = function () {
    return moment().unix();
};

//Convert date to timestamp
var dateToUnix = function (input) {
    return moment(input, format.timeStamp).unix();
};

//Convert to full date
var unixToFullDate = function (input) {
    return moment(moment.unix(input)).utcOffset("+05:30").format(format.timeStamp);
};

//Convert to date
var unixToDate = function (input) {
    return moment(moment.unix(input)).utcOffset("+05:30").format(format.date);
};

//Convert to time
var unixToTime = function (input) {
    return moment(moment.unix(input)).utcOffset("+05:30").format(format.time);
};

//Add minutes to timestamp
var addToTimestamp = function (input) {
    return unixTimestamp() + input * 60;
};

//Difference in sec
var diff = function (low, high) {
    return moment(high).diff(low);
};

var docPrefix = function () {
    return moment().format("YYYY_MMM_DD_");
};

module.exports = {
    unixTimestamp: unixTimestamp,
    dateToUnix: dateToUnix,
    unixToFullDate: unixToFullDate,
    unixToDate: unixToDate,
    unixToTime: unixToTime,
    addToTimestamp: addToTimestamp,
    diff: diff,
    docPrefix: docPrefix
};
