"use strict";

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var uuid     = require('uuid');

let user_login= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    name: { type: String, default: "", trim: true },
    referral_id: { type: String, default: "", trim: true },
    reffered_by_id: { type: String, default: "", trim: true },
    phone: {
        value: {type: String, default: "", trim: true},
        isVerified: {type: Boolean, default: false},
        otp: {type: String, trim: true}
    },
    email: {
        value: {type: String, unique: true, sparse: true, trim: true},
        user_secret_token : { type: String, default: "", trim: true },
        isVerified: {type: Boolean, default: false}
    },
    password: {type: String, trim: true, select: false},
    gAuth: {
        base32_value: {type: String, default: "", trim: true}
    },
    forget_password: {
        is_requested: {type: Boolean, default: false, select: false},
        user_secret_token : { type: String, default: "", select: false, trim: true },
    },
    login_otp: {type: String, trim: true, select: false},
    free_trade: {type: Boolean, default: false},
    is_active: {type: Boolean, default: true},
    date: { type: String, default: Math.round((new Date()).getTime() / 1000), trim: true }
});

var user_kyc = new mongoose.Schema({

    _id: { type: String, default: uuid.v4 },

    //Track
    createdAt: { type: Number, default: null },
    updatedAt: { type: Number, default: null },

    // personal details
    isActive: { type: Boolean, default: false },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phone: {
        code: { type: String, default: null },
        number: { type: String, default: null }
    },
    email: {
        value: { type: String, unique: true },
        isVerified: { type: Boolean, default: false }
    },
    loginData: {
        lastLogin: { type: String, default: null },
        count: { type: Number, default: 0 }
    },
    password: { type: String, trim: true, select: false },
    resetPswd: {
        isRequested: { type: Boolean, default: false, select: false },
        attempts: { type: Number, default: 0 },
    },
    kyc: {
        identity: {
            number: { type: String, default: null },
            picture: { type: String, default: null },
        },
        passport: {
            picture: { type: String, default: null },
            number: { type: String, default: null }
        },
        image: {
            picture: { type: String, default: null },
            number: { type: String, default: null }
        },
        isSaved: { type: Boolean, default: false },
    },
    kycStatus:{
        type:String,
        enum:["pending","processing","completed","rejected"],
        default:'pending'
    },
    kycVerifiedBy: { type: String, default: null, ref:"admin" },
    kycComment: { type: String, default: null },
    address: {
        address1: { type: String, default: null },
        address2: { type: String, default: null },
        postalcode: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        isSaved: { type: Boolean, default: false }
    },
    billingAddress: {
        address1: { type: String, default: null },
        address2: { type: String, default: null },
        postalcode: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        isSaved: { type: Boolean, default: false }
    },
    mailingAddress: {
        address1: { type: String, default: null },
        address2: { type: String, default: null },
        postalcode: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        isSaved: { type: Boolean, default: false }
    },
    dob: { type: String, default: null },
    nationality: { type: Boolean, default: false },
    consent: { type: Boolean, default: false }
});

user_kyc.pre(
    'save',
    function(next) {
        var model = this;
        if (!model.isModified('password')) return next();
        model.createdAt = dates.unixTimestamp();
        bcrypt.hash(model.password, null, null, function(err, hash) {
            if (err) return next();
            model.password = hash;
            next();
        });
    });
user_kyc.pre(
    'update',
    function(next) {
        var model = this;
        model.updatedAt = dates.unixTimestamp();
        next();
    });

/*  Method to compare password during login and password change */
user_kyc.methods.comparePassword = function(password) {
    try {
        var obj = this;
        var isCorrect = bcrypt.compareSync(password, obj.password);
        if (isCorrect === true) {
            obj.attempt = 1;
            obj.isBlocked = false;
            obj.loginAt = dates.unixTimestamp();
            obj.save(function() {});
            return true;
        } else {
            if (obj.attempt < presets.user.maxLoginAttempts) {
                obj.attempt++;
                obj.save(function() {});
                return false;
            } else {
                obj.isBlocked = true;
                obj.unblockAt = dates.addToTimestamp(presets.user.unblockTime);
                obj.save(function() {});
                return false;
            }
        }
    } catch (e) {
        return false;
    }

};

let adminLoginSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    name: { type: String, default: "", trim: true },
    phone: {type: String, default: "", trim: true},
    email: { type: String, default: "", trim: true },
    password: {type: String, trim: true, select: false},
    permissions: [String],
    role: {type: String, enum: ['superadmin', 'admin', 'supervisor'], required: true},
    status: {type: Boolean, default: true},
    created_at: { type: String, default: Math.round((new Date()).getTime() / 1000), trim: true }
});

let apiPermissionsSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    path: { type: String, default: "", trim: true },
    roles: [String],
    permissions: [String]
});

let adminAuditSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    admin_id: { type: String, default: "", trim: true },
    auditTrail: []
});

let userAuditSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    user_id: { type: String, default: "", trim: true },
    auditTrail: []
});

let countryAdvertisementSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    country: { type: String, default: "", trim: true },
    image_url: { type: String, default: "", trim: true },
});

let configSchema= new mongoose.Schema({
    _id: { type: String, default: uuid.v4, trim: true },
    ethFeesPercent: { type: String, default: "", trim: true },
    btcFeesPercent: { type: String, default: "", trim: true },
    xrpFeesPercent: { type: String, default: "", trim: true },
    erc20FeesPercent: { type: String, default: "", trim: true },
    ltcFeesPercent: { type: String, default: "", trim: true },
    nemFeesPercent: { type: String, default: "", trim: true },
    fiatFeesPercent: { type: String, default: "", trim: true }
});

// methods ======================
// generating a hash
adminLoginSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
adminLoginSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports= ( function() {
    let schemaObject= {
        loginModel                : mongoose.model('logins', adminLoginSchema),
        apiPermissionsModel       : mongoose.model('api_permissions', apiPermissionsSchema),
        adminAuditModel           : mongoose.model('admin_audit', adminAuditSchema),
        userAuditModel            : mongoose.model('user_audit', userAuditSchema),
        countryAdvertisementModel : mongoose.model('country_advertisement', countryAdvertisementSchema),
        user_login : user_login,
        user_kyc : user_kyc,
        configModel               : mongoose.model('config', configSchema)
    };

    return schemaObject;
})();