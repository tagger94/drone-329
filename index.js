var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

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

console.log(packages);

var workDetail = {
    droneStats: {
        maxWeight: 30,
        maxDistance: 120,
        numDrones:3,
        numPackages:3,
    },
    packages: packages
}


io.on('connect', function(socket) {
    io.emit('pass work detail', workDetail);
    
    io.emit('pass work', {
        id: 0,
        packageIndex: [-1,0,1,2,-1,3,4,5,-1,6,7,-1,8,9]
    })
})