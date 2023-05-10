var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    nodemailer = require('nodemailer'),
    env = process.env.NODE_ENV || 'development';
    
var config = {
    development: {
        root: rootPath,
        app: {
            name: 'exchange-admin',
			// domain: 'http://54.213.231.141:3006',
			domain: "localhost:3006",
			userAuth: 'http://139.59.61.68:3005',
            fiatURL: 'http://139.59.61.68:3011',
            dataServiceURL: "http://139.59.61.68:3017",
            tradingEngine: "http://139.59.61.68:15672",
			desktopApi: 'v1',
			mobileApi: 'v1'
        },
        port: process.env.PORT || 3006,
        // db: 'mongodb://localhost:27017/exchange-admin',
        db: 'mongodb://bistox:bistox1@ds239055.mlab.com:39055/bistox-admin',
        user_auth: 'mongodb://bittoria:bittoria1@ds231739.mlab.com:31739/user-auth',
        redis: 'redis://redistogo:6f82928a4e749aac2fa3ecf83b7f6dac@dory.redistogo.com:10470/',
        awssdk: {
            secretAccessKey: 'PO1F74s0eDfFhsgj4xq4fvqEh5hWtbdsYi9nuY3d',
            accessKeyId: 'AKIAIRNKNKFZ7Z7CX2QQ',
            region: 'us-east-1',
            bucket: 'launcherc'
        },
        /**
        from: config.emailSender[opts.data.mailer].sender,
        //The email to contact
        to: opts.email,
        //Subject and text data
        subject: opts.subject,
        label: config.emailSender[opts.data.mailer].mailData.label,
        html: ops.content
        **/
        emailSender: {
			sender: 'support@exchange.com',
			mailgun: {
				apiKey: process.env.mailgunApiKey || 'key-0833f71939602fc006e87d6dad8dc845',
				domain: process.env.mailgunDomain || 'mailgun.dipenpradhan.com'
			}
		},
        smsSender: {
            plivo: {
				accountSid: process.env.plivoAccountSid || 'MAZDU1MZC1OGM5MGQ1OW',
				authToken: process.env.plivoAuthToken || 'OTBlNTY5NGVkNTE5NTc1MjE1OTNlMDQ4YWFhZDlk',
				number: "+14508772018"
			},
			msg91: {
				authkey: process.env.msg91Authkey || '112489AdY4qc8z0yxK5735c1cd'
			}
        },
        recaptcha: {
			isEnabled: true,
			site_key: '6LcQglYUAAAAABansPyA-awtD5KIbYhytxyJN9TW',
			secret_key: '6LcQglYUAAAAABxczfac36iFmRuozLAgJveQ84GE'
		},
        rabbitMQ: "amqp://localhost",
        fiatTokenSecret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        userAuthSecret: "superSecretUser"
    },
    test: {
        root: rootPath,
        app: {
            name: 'user-auth-tokenmonk-dev',
            domain: 'http://18.224.32.253:3005',
            desktopApi: 'v1',
            mobileApi: 'v1'
        },
        port: process.env.PORT || 3005,
        db: 'mongodb://bittoria:bittoria1@ds263791.mlab.com:63791/admin-module',//,//
        redis: '',
        smsSender: {
            plivo: {
                accountSid: process.env.plivoAccountSid || 'MAZDU1MZC1OGM5MGQ1OW',
                authToken: process.env.plivoAuthToken || 'OTBlNTY5NGVkNTE5NTc1MjE1OTNlMDQ4YWFhZDlk',
                number: "+14508772018"
            },
            msg91: {
                authkey: process.env.msg91Authkey || '112489AdY4qc8z0yxK5735c1cd'
            }
        },
        emailSender: {
            sender: 'support@tokenmonk.io',
            mailgun: {
                apiKey: process.env.mailgunApiKey || 'key-0833f71939602fc006e87d6dad8dc845',
                domain: process.env.mailgunDomain || 'mailgun.dipenpradhan.com'
            }
        },
        recaptcha: {
            isEnabled: true,
            site_key: '6LcQglYUAAAAABansPyA-awtD5KIbYhytxyJN9TW',
            secret_key: '6LcQglYUAAAAABxczfac36iFmRuozLAgJveQ84GE'
        },
        rabbitMQ: "amqp://localhost"
    },
    production: {
        root: rootPath,
        app: {
            name: 'user-auth-tokenmonk-dev',
            domain: 'http://18.224.32.253:3005',
            desktopApi: 'v1',
            mobileApi: 'v1'
        },
        port: process.env.PORT || 3005,
        db: 'mongodb://bittoria:bittoria1@ds263791.mlab.com:63791/admin-module',//,//
        redis: '',
        smsSender: {
            plivo: {
                accountSid: process.env.plivoAccountSid || 'MAZDU1MZC1OGM5MGQ1OW',
                authToken: process.env.plivoAuthToken || 'OTBlNTY5NGVkNTE5NTc1MjE1OTNlMDQ4YWFhZDlk',
                number: "+14508772018"
            },
            msg91: {
                authkey: process.env.msg91Authkey || '112489AdY4qc8z0yxK5735c1cd'
            }
        },
        emailSender: {
            sender: 'support@tokenmonk.io',
            mailgun: {
                apiKey: process.env.mailgunApiKey || 'key-0833f71939602fc006e87d6dad8dc845',
                domain: process.env.mailgunDomain || 'mailgun.dipenpradhan.com'
            }
        },
        recaptcha: {
            isEnabled: true,
            site_key: '6LcQglYUAAAAABansPyA-awtD5KIbYhytxyJN9TW',
            secret_key: '6LcQglYUAAAAABxczfac36iFmRuozLAgJveQ84GE'
        },
        rabbitMQ: "amqp://localhost"
    }
};
module.exports = config[env];