var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    url = require('url'),
    log4js = require("log4js"),
    command = require('new-command')({
        'config': 'config'
    });

"use strict()";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/* Our global variable to load configuration values and rules from the configuration file */
var global;

/* Our local namespace. I really hate polluting the global namespace and so henceforth all the methods and variables used for this server from this point on will be under this namespace.*/
var shield = {};

/* Do you seriously expect me to say what this variable is for? */
var log = {};

shield.startReverseProxyServer = function () {
    https.createServer(httpsServerOptions, function (request, response) {

    }).listen(global.port, global.bind);
};

//var pk, pc, httpsServerOptions;

/* Read self signing private key and certificate file from path given in config file */
shield.readCerts = function () {
    try {
        shield.certs = {};
        shield.certs.pk = fs.readFileSync(global.privatekeyfile);
        shield.certs.pc = fs.readFileSync(global.certificatefile);
        httpsServerOptions = {
            cert: shield.certs.pc,
            key: shield.certs.pk
        };

        /* Start the reverse proxy server on successfully reading the certificate files. */
        shield.startReverseProxyServer();
    } catch (e) {
        console.log(e);
        console.error('Error reading self signing certificate file(s) / file(s) not found. ');
        process.exit(1);
    }
};

/* After reading the config file, set defaults. */
shield.loadDefaults = function () {
    //TODO bind host is set to 0.0.0.0 in v0.0.0. Change it in future release to bind to said hosts.
    global.bind = '0.0.0.0';
    global.port = global.port || 443;

    /* Read certificates on successful loading of defaults. */
    shield.readCerts();
};

/* Initialize the logging module. */
shield.initializeLogging = function () {
    console.info('Attempting to initialize logger...');
    try {
        /* Just a check to notify the user that logging configuration values are not found in config.js file and so things default to default. */
        if (!global.log) {
            console.info("No logging configurations found. Setting logging to default values.");
        }

        log4js.loadAppender('file');
        log4js.addAppender(log4js.appenders.file((global.log && global.log.logto) || '../examples/logs/shield.log'), 'shield');
        //log4js.maxLogSize(global.log.macLogSize || 20480);
        //log4js.backups(global.log.backups || 5);

        log = log4js.getLogger();

        log.setLevel((global.log && global.log.level) || 'debug');

        console.info('Logging successfully initialized. From here on logs will be found @ ' + ((global.log && global.log.logto) || '../examples/logs/shield.log'));

        /* Call load defaults function to load default values after successfully reading the config file. */
        shield.loadDefaults();
    } catch (e) {
        console.error('Error when attempting to load logger. Check the log configuration values in the config file.');
        console.error(e);
    }
};

/* Load rules from the configuration file, aborting if not found. */
shield.loadConfigFile = function (filename) {
    try {
        if (fs.existsSync(filename)) {
            console.info('Found server config file @ : ' + filename);
            global = require(filename);

            /* Call initiallize logging function and prepare the logger to be used from this point on. */
            shield.initializeLogging();
        } else {
            console.error("Configuration file not found - " + filename);
            process.exit(1);
        }
    } catch (e) {
        console.error('Error reading configuration file / configuration file not found - ' + filename);
        console.log(e);
    }
};

/* Call load config file function and load server configurations. */
if (command.config) {
    shield.loadConfigFile(command.config);
} else {
    console.error('Missing --config parameter. You have to pass value to --config parameter with a valid config file path.');
    console.error('Parameters currently found : ');
    console.error('');
    console.error(command);
    process.exit(1);
}