var multer = require('multer');
var multerS3 = require('multer-s3')
var handler = require('./handler');
var HttpStatus = require('http-status-codes');
var path = require('path');
var aws = require('aws-sdk');

const Models    = require('./../v1/user_model');
const { userKYCModel }= Models;

aws.config.update({
    secretAccessKey: 'E0D4pja3csAXE7pf2Ic/tBoUmHQGtFSOPMNaxtQX',
    accessKeyId: 'AKIAITXWYYIRW3B7AZ7A',
    region: 'us-east-1'
});
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 2 MB

var s3 = new aws.S3();

var MAGIC_NUMBERS = {
    jpg: 'ffd8ffe0',
    jpg1: 'ffd8ffe1',
    png: '89504e47',
    gif: '47494638'
};

//for local storage
let storage= multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '/../../uploads/KYC'));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now()+"-"+file.originalname);
    }
  });

//for AWS S3 storage
let storageS3= multerS3({
    s3: s3,
    bucket: 'exchange-kyc',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
        console.log('timestamp - ' + Date.now().toString());
        cb(null, Date.now().toString())
    }
});

var upload = multer({
    limits: { fileSize: MAX_FILE_SIZE },
    storage: storage,
    fileFilter: function(req, file, cb) {
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
})

function checkMagicNumbers(magic) {
    if (magic == MAGIC_NUMBERS.jpg || magic == MAGIC_NUMBERS.jpg1 || magic == MAGIC_NUMBERS.png || magic == MAGIC_NUMBERS.gif) return true
}

var obj = {
    uploadKyc: function(req, res, next) {
        upload.single('kyc')(req, res, (err) => {
            if (err) {
                handler.sendErr(HttpStatus.BAD_REQUEST, err, res);
            } else {
                if (req.file) {
                    next();
                } else return handler.sendErr(HttpStatus.BAD_REQUEST, 'File not added', res);
            }
        })
    },
    fileExistanceCheck: function(req, res, next) {
        var docTypes = ["pan_card", "adhaar_card", "bank_details", "passport_size_picture"];

        if (~docTypes.indexOf(req.body.docType)) {  // imagine someone typed wrong query param name.
            console.log('not in array');
            return handler.sendErr(HttpStatus.FORBIDDEN, handler.INVALID_PARAMS, res);
        } else {
            userKYCModel.findOne({ "_id": req.body.userid }, {"kyc":1}).lean().exec(function(err, data) {
                if (err)
                    return handler.sendErr(HttpStatus.INTERNAL_SERVER_ERROR, err.message, res);
                else {
                    if (data && data[req.body.docType].picture) {
                        console.log('already in db');
                        console.log(data.kyc[req.body.docType]);
                        return handler.sendErr(HttpStatus.FORBIDDEN, handler.INVALID_ACTION, res);
                    } else {
                        console.log('success');
                        next();
                    }
                }
            });
        }
    }
}

module.exports = obj;