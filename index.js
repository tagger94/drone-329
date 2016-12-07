var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var worker = io.of('/worker');
var admin = io.of('/admin');

/********
Default Methods
*********/

router.use(express.static(path.join(__dirname, 'public')));
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
      var addr = server.address();
      console.log("Chat server listening at", addr.address + ":" + addr.port);
});

var packages = [];

for (var i = 0; i < 10; i++) {
    packages.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        weight: Math.round(Math.random() * 10) + 1,
    });
}

// console.log(packages);

var workDetail = {
    droneStats: {
        maxWeight: 30,
        maxDistance: 1200,
        numDrones:3,
        numPackages:3,
    },
    packages: packages
}

admin.on('connect', function(socket) {
    socket.on('admin:pass:details', function(wd) {
        workDetail = wd;
    })
})


worker.on('connect', function(socket) {
    //create unique Name
    socket.name = makeID();
    console.log(socket.name + ' connected');
    
    socket.on('worker:pass:distance', function(obj) {
        console.log(obj);
    })

    //Assign name
    socket.emit('server:set:name', socket.name);
    
    socket.emit('server:pass:detail', workDetail);
    
    socket.emit('server:pass:work', {
        id: 0,
        packageIndex: [0,1,2,3,4,5,6,7,8,9]
    });
    
    socket.emit('server:pass:work', {
        id: 1,
        packageIndex: [1,0,2,3,4,6,5,7,8,9]
    });
    
    socket.emit('server:pass:work', {
        id: 2,
        packageIndex: [0,1,2,3,4,5,6,7,9,8]
    });
})

function main() {
    
}

function makeID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};