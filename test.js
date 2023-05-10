const jwt = require("jsonwebtoken");
const common = require("./app/scripts/common");

const verifyJWT = (secret, token, cb) => {
    console.log(secret, token);
    // verifies secret and checks exp
    jwt.verify(token, secret, function(err, decoded) {
        console.log("decoded", decoded);
        if (err) {
            console.log("err=>" + err);
            return cb("Failed to authenticate token.", undefined);
        } else {
            // if everything is good, save to request for use in other routes
            return cb(false, decoded);
        }
    });
};
let enc =
    "eyJhbGaciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNWY1MDkwMS05MjIxLTRkODktOGI1Mi00MTYwYjJjM2Q2NmUiLCJleHBpcmUiOiIzNjVkIiwiaWF0IjoxNTI5NjY4MjcyfQ.sMk44toYEzskj_C_6pux2j2Izx5ofcbRGTeDWPtlCqg";
verifyJWT("p!RxWDptb@f7vBg", enc, err => {});
/* (() => {
        let enc= commonObject.getAccessToken("p!RxWDptb@f7vBg", {user_id: "abc"})
        
    })(); */

// make error test
var failure400 = () => ({
    status: false,
    code: 400,
    message: "Bad Request"
});
var failure40x = common.makeFailure(400, "Bad Request");

var f1 = JSON.stringify(failure400());
var f2 = JSON.stringify(failure40x());

console.log(f1 === f2);


console.log("hash", common.generateHash("lol"))