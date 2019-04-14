// minimal node.js server that returns 2 Json file
// - http://localhost:8080/valid.json
// - http://localhost:8080/valid-with-prefx.json

var express = require('express')
var http = require('http');

var app = express();
var server = http.createServer(app);

server.listen(8080, function() {
    console.log("listening to: http://localhost:8080");
    console.log("curl http://localhost:8080/valid");
    console.log("curl http://localhost:8080/valid-with-prefix");
});

// routing
app.get('/valid', function (req, res) {
    res.sendFile(__dirname + '/valid.json');
});

app.get('/valid-with-prefix', function (req, res) {
    res.sendFile(__dirname + '/valid-with-prefix.json');
});
