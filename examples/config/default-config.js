/*
This is an example config file for server which listens up on: 

	54.251.35.41:443, 127.0.0.01:443
*/

exports.options = {

};

/* 
The address in the 'bind' option will be listened upon. If not specified it defaults to:
	
	0.0.0.0
*/
exports.bind = new Array("54.251.35.41", "127.0.0.1");

/*
The port in the 'port' option will be listened upon. If not specified, it defaults to :

	443
*/
exports.port = 443;

/*
Path of the self signing private key and certificate files [relative to the server.js file].
*/
exports.private-key-file = "../examples/certs/privatekey.pem";
exports.certificate-file = "../examples/certs/certificate.pem";
