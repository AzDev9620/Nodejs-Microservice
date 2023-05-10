const nodemailer = require('nodemailer');
var path = require("path");
var EmailTemplate = require('email-templates').EmailTemplate;
var config = require('./../../config');
var bluebird = require("bluebird");

var sendMail = function(opts) {
    return new bluebird.Promise(function(resolve,reject){
        // var templateDir = path.join(__dirname, '../mailerTemplates', opts.type);
        // var template = new EmailTemplate(templateDir);
        if(!opts) return reject("NO Object Defined")

        // template.render(opts)
        //     .then(function(results) {

                var MailData = {
                    //Specify email data
                    from: config.emailSender[opts.data.mailer].sender || 'mukulblock123@gmail.com',
                    //The email to contact
                    to: opts.email,
                    //Subject and text data
                    subject: opts.subject,
                    label: config.emailSender[opts.data.mailer].mailData.label || 'bittoria',
                    html: opts.content
                };

                config.emailSender[opts.data.mailer].transporter.sendMail(MailData, (error, info) => {
                    if (error)
                        return reject(error);
                   
                    else return resolve(info);
                });
    })
    
};

var konsole = function(err, data) {
    if (err)
        console.log('err: ' + err);
    else console.log('data: ' + data);
};

module.exports = {
    send: sendMail
};