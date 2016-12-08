var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var worker = io.of('/worker');
var admin = io.of('/admin');

// var GA = require('./genetic-dispersal.js');

var gaConfig = {
    mutationRate: 0.015,
    tournamentSize: 5,
    populationSize: 20,
    routeSize: 20,
    elitsm: true,
}

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
        numDrones: 3,
        numPackages: 3,
    },
    packages: packages
}

admin.on('connect', function(socket) {
    socket.on('admin:pass:details', function(wd) {
        workDetail = wd;
        console.log(wd);
        startGA();
    });
})


worker.on('connect', function(socket) {
    //create unique Name
    socket.name = makeID();
    console.log(socket.name + ' connected');

    socket.on('worker:pass:distance', function(obj) {
        console.log(obj);
    });

    //Assign name
    socket.emit('server:set:name', socket.name);

    socket.emit('server:pass:detail', workDetail);

    // socket.emit('server:pass:work', {
    //     id: 0,
    //     packageIndex: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    // });

    // socket.emit('server:pass:work', {
    //     id: 1,
    //     packageIndex: [1, 0, 2, 3, 4, 6, 5, 7, 8, 9]
    // });

    // socket.emit('server:pass:work', {
    //     id: 2,
    //     packageIndex: [0, 1, 2, 3, 4, 5, 6, 7, 9, 8]
    // });
})

function main() {

}

function startGA(workDetail) {

    gaConfig = {
        mutationRate: 0.015,
        tournamentSize: 5,
        populationSize: 20,
        routeSize: 20,
        elitsm: true,
        totalGenerations: 100
    }

    var defaultDetail = {
        droneStats: {
            maxWeight: 30,
            maxDistance: 1200,
            numDrones: 3,
            numPackages: 3,
        },
        packages: packages
    }
    
    if(workDetail) {
        gaConfig.routeSize = workDetail.numPackages;
    }
    
    setup(gaConfig);

}
var counter = 0;
var genNumber = 0;

function nextGeneration(pop, gaConfig, workDetail) {
    var newPop = evolvePopulation(pop);
    
    if(n < gaConfig.totalGenerations) {
        // nextGeneration(newPop, n+1, gaConfig);
        return;
    } else {
        workDetail.stats = stats;
        workDetail.finalRoute;
        // admin.emit('server:final:result', GA.stats);
        admin.emit('server:pass:details', workDetail);
        return;
    }
    
    
}



function makeID() {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};

///////////////////////

function setup(config) {
    if (config) {
        config = config;
    }
}

var config = {
        mutationRate: 0.015,
        tournamentSize: 5,
        populationSize: 20,
        routeSize: 20,
        elitsm: true,
        totalGenerations: 100
    }


var stats = [];

function evolvePopulation(pop) {
    var newPop = [];
    // Keep our best individual if elitism is enabled
    var elitismOffset = 0;
    if (config.elitism) {
        newPop[0] = getFittest(pop);
        elitismOffset = 1;
    }

    // Crossover population
    // Loop over the new population's size and create individuals from
    // Current population
    for (var i = elitismOffset; i < config.populationSize; i++) {
        // Select parents
        var parent1 = tournamentSelection(pop);
        var parent2 = tournamentSelection(pop);
        // Crossover parents
        var child = crossover(parent1, parent2);
        // Add child to new population
        newPop.push(child);
    }

    // Mutate the new population a bit to add some new genetic material
    for (var i = elitismOffset; i < config.populationSize; i++) {
        pop[i] = mutate(pop[i]);
    }
    
    stats.push(calcStats(pop));

    return newPop;
}

function calcStats(pop) {
    var stat = {};
    
    
    
    return stat;
}

function mutate(child) {
    // Loop through tour cities
    for (var index1 = 0; index1 < config.routeSize; index1++) {
        // Apply mutation rate
        if (Math.random() < config.mutationRate) {
            // Get a second random position in the tour
            var index2 = Math.floor(child.route.length * Math.random());

            // Get the cities at target position in tour
            var parcel1 = child.route[index1];
            var parcel2 = child.route[index2];

            // Swap them around
            child.route[index2] = parcel1;
            child.route[index1] = parcel2;
        }
    }

    return child;
}

function crossover(parcel1, parcel2) {
    if (parcel1.fitness > parcel2.fitness) {
        return JSON.parse(JSON.stringify(parcel1));
    }
    else {
        return JSON.parse(JSON.stringify(parcel2));
    }
}

function tournamentSelection(pop) {
    // Create a tournament population
    var tourn = [];
    // For each place in the tournament get a random candidate tour and
    // add it
    for (var i = 0; i < config.tournamentSize; i++) {
        var randomId = Math.floor(Math.random() * pop.length);
        tourn.push(pop[randomId]);
    }
    // Get the fittest of tourn
    return getFittest(tourn);
}

function getFittest(pop) {
    var best = 0;
    for (var i = 1; i < pop.length; i++) {
        if (pop[i].fitness > pop[best].fitness) {
            best = i;
        }
    }

    return pop[best];
}
