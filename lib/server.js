var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    url = require('url'),
    command = require('new-command')({
        'config': 'config'
    });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/* Our global variable to load configuration values and rules from the configuration file */
var global;

/* Load rules from the configuration file, aborting if not found. */
function loadConfigFile(filename) {
    if (fs.existsSync(filename)) {
        global = require(filename);
    } else {
        console.log("Configuration file not found - " + filename);
        process.exit(1);
    }
}

/* After reading the config file, set defaults. */
function loadDefaults() {
    //TODO bind host is set to 0.0.0.0 in v0.0.0. Change it in future release to bind to said hosts.
    global.bind = '0.0.0.0';
    global.port = global.port || 443;
}

/* Call load config file function and load server configurations. */
loadConfigFile(command.config);

/* Call load defaults function to load default values. */
loadDefaults();


/* Read self signing private key and certificate file from path given in config file */
var pk = fs.readFileSync(global.privatekeyfile);
var pc = fs.readFileSync(global.certificatefile);

var httpsServerOptions = {
    cert: pc,
    key: pk
};

https.createServer(httpsServerOptions, function (request, response) {

}).listen(global.port);