'use strict';

let os = require('os');
let ifaces = os.networkInterfaces();

module.exports= new Promise((resolve, reject) => {

  Object.keys(ifaces).forEach((ifname) => {    
    ifaces[ifname].forEach((iface) => {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return true;
      }
      resolve(iface.address);
    });
  });
});