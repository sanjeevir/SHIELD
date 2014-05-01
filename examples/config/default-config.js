/*
This is an example config file for server which listens up on: 

	54.251.35.41:443, 127.0.0.01:443
*/

exports.options = {

};

/* 
The address in the 'bind' option will be listened upon. If not specified it defaults to:
	
	0.0.0.0
    
This config value is dummy in v0.0.0. Will be used in future relase versions. In v0.0.0 bind host will be set to 0.0.0.0.
*/
exports.bind = ["54.251.35.41", "127.0.0.1"];

/*
The port in the 'port' option will be listened upon. If not specified, it defaults to :

	443
*/
exports.port = 443;

/*
Path of the self signing private key and certificate files (relative to the server.js file/absolute path).
*/
exports.privatekeyfile = "../examples/certs/privatekey.pem";
exports.certificatefile = "../examples/certs/certificate.pem";

/* Log configurations. Log file path relative to the server.js file/absolute path. */
exports.log = {
    "logto": "../examples/logs/shield.log",
    "level": "debug",
    "maxLogSize": 20480,
    "backups": 10
};