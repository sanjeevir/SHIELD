var http = require("http"),
    https = require("https"),
    fs = require("fs"),
    url = require('url'),
    host_ip = process.argv[2];

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
