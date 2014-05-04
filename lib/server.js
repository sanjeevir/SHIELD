var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    url = require('url'),
    log4js = require("log4js"),
    shieldUtil = require("./util.js"),
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
    log.info('Starting reverse proxy server SHIELD @ ' + global.bind + ':' + global.port);
    try {
        https.createServer(shield.httpsServerOptions, function (request, response) {
            var internalRequestHeaders = request.headers;
            delete internalRequestHeaders['host'];
            var internalRequestOptions = {
                host: 'www.yammer.com',
                path: request.url,
                port: '443',
                headers: internalRequestHeaders,
                method: request.method,

            };
            var requestBody = '';
            request.on('data', function (chunk) {
                requestBody += chunk;
            });

            request.on('end', function () {
                log.debug('Requesting URL - ' + internalRequestOptions.path);
                requestBody = requestBody.replaceAll("hello", "BAZINGA");
                var internalRequest = https.request(internalRequestOptions, function (internalResponse) {
                    log.debug(JSON.stringify(internalResponse.headers));
                    if (internalResponse.headers["location"] && (internalResponse.headers["location"].indexOf("www.yammer.com") != -1)) {
                        internalResponse.headers["location"] = internalResponse.headers["location"].replaceAll("www.yammer.com", "localhost");
                    }
                    //log.debug("####content type match case" + (internalResponse.headers["content-type"].split(';')[0].split(';')[0] == 'text/html'));
                    log.debug("####response status 304 : " + (internalResponse.headers["status"] == "304 Not Modified"));
                    if (!internalResponse.headers["status"] == "304 Not Modified") {
                        //if (internalResponse.headers["content-type"].split(';')[0] == 'text/html' || internalResponse.headers["content-type"].split(';')[0] == 'text/javascript' || internalResponse.headers["content-type"].split(';')[0] == 'application/javascript' || internalResponse.headers["content-type"].split(';')[0] == 'text/plain' || internalResponse.headers["content-type"].split(';')[0] == 'application/json') {
                        log.debug('##### inside https response for : ' + request.url + " ...got response content type : " + internalResponse.headers['content-type']);
                        var str = '';
                        internalResponse.on('data', function (chunk) {
                            str += chunk;
                        });
                        internalResponse.on('end', function () {
                            log.debug('Got response from URL - ' + internalRequestOptions.path);
                            response.writeHead(internalResponse.statusCode, "so how's it goin?", internalResponse.headers);


                            /*for (var property in internalResponse.headers) {
                                    console.log("Response header: " + property + ", value: " + internalResponse.headers[property]);
                                }*/
                            /*
                                if(request.url == '/cognizant.com/')
                                {
                                        response.writeHead(301, {
                                                location: 'localhost'
                                        });
                                }
                                */
                            log.debug('Replacing all www.yammer.com to EC2 elastic IP and all BAZINGAs in response body to RESPONSE-BAZINGA')
                            str = str.replaceAll("www.yammer.com", "localhost");
                            str = str.replaceAll("www.yammer.com/cognizant.com" + /i/g, "localhost/cognizant.com");
                            str = str.replaceAll("BAZINGA", "RESPONSE-BAZINGA");
                            response.write(str, "utf8");
                            response.end();
                            //console.log("Response Body: " + str);

                        });
                        /*} else {
            log.debug('Piping response from : ' + request.url + ' with response content type : ' + internalResponse.headers["content-type"].split(';')[0]);
response.writeHead(internalResponse.statusCode, "so how's it goin?", internalResponse.headers);
internalResponse.pipe(response);
} */
                    } else {
                        log.debug('Piping response from : ' + request.url + ' as reponse status is 304...');
                        response.writeHead(internalResponse.statusCode, "so how's it goin?", internalResponse.headers);
                        internalResponse.pipe(response);
                    }
                });

                if (requestBody != "") {
                    internalRequest.write(requestBody, "utf8");
                    //console.log("Request Body: " + requestBody);
                }
                internalRequest.end();
                log.debug('Successfully proxied reqest to URL - ' + internalRequestOptions.path);
            });
        }).listen(global.port, global.bind);
        log.info('Successfully started reverse proxy server SHIELD...listening to : ' + global.bind + ':' + global.port)
    } catch (e) {
        log.error('##### FATAL ERROR STARTING REVERSE PROXY SERVER SHIELD....');
        log.error('Aborting process...');
        process.exit(1);
    }
};

//var pk, pc, httpsServerOptions;

/* Read self signing private key and certificate file from path given in config file */
shield.readCerts = function () {
    log.info('Attempting to read self signing certificates from - ' + global.privatekeyfile + ' and ' + global.certificatefile);
    try {
        shield.certs = {};
        shield.certs.pk = fs.readFileSync(global.privatekeyfile);
        shield.certs.pc = fs.readFileSync(global.certificatefile);
        shield.httpsServerOptions = {
            cert: shield.certs.pc,
            key: shield.certs.pk
        };

        log.info('Successfully obtained signing certificates. Proceeding to create reverse proxy server SHIELD.')
        /* Start the reverse proxy server on successfully reading the certificate files. */
        shield.startReverseProxyServer();
    } catch (e) {
        log.error('Error reading self signing certificate file(s) / file(s) not found. ');
        log.error('Aborting process...');
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
        log4js.addAppender(log4js.appenders.file((global.log && global.log.logto) || '../examples/logs/shield.log'), 'SHIELD');
        //log4js.maxLogSize(global.log.macLogSize || 20480);
        //log4js.backups(global.log.backups || 5);

        log = log4js.getLogger('SHIELD');

        log.setLevel((global.log && global.log.level) || 'debug');

        console.info('Logging successfully initialized. From here on logs will be found @ ' + ((global.log && global.log.logto) || '../examples/logs/shield.log'));
    } catch (e) {
        console.error('Error when attempting to load logger. Check the log configuration values in the config file.');
        console.error(e);
        console.error('It is unwise to continue any further as you will have no track of whats happening in the server. Eventhough the server will continue to run, it is highly recommended to fix the problems with your logging configurations at this point.');
    }

    /* Call load defaults function to load default values after successfully reading the config file. */
    shield.loadDefaults();
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
            console.error('Aborting with error...');
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
    console.error('Aborting with error...');
    process.exit(1);
}