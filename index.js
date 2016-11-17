var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');


/********
Default Methods
*********/

app.use(express.static(path.join(__dirname, 'public')));

var child = [];

for (var i = 0; i < 10; i++) {
    child.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        weight: Math.round(Math.random() * 10) + 1,
    });
}

console.log(child);



io.on('connect', function(socket) {
    io.emit('')
    io.emit('pass work', {
        id: 0,
        packages: child
    })
})