var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var worker = io.of('/worker');
var admin = io.of('/admin');

router.use(express.static(path.join(__dirname, 'public')));
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    // console.log("listening at", addr.address + ":" + addr.port);
});

var config = {
    numDrones: 3,
    numPackages: 10,
    maxWeight: 10000,
    maxDistance: 10000,
    mutationRate: .15,
    tournamentSize: 5,
    populationSize: 10,
    maxGenerations: 20,
    maxX: 200,
    maxY: 200,
    homeLocation: {
        x: 100,
        y: 100,
        weight: 0,
    }
};

var parcelList = randomParcelList();
var startingPop = randomPop();
var bestRoute = [];

var generationalStats = [];

var done = false;

/*
TESTING
*/
setupWorkerSocket();

// distributePopForWork(startingPop, 0);



/*
RUNNER METHODS
*/

function doGeneration(pop, genNum) {
    //Reset WorkerManager
    workerMan.reported = 0;
    workerMan.nextPop = [];

    //Calculate the stats for the last generation
    generationalStats.push(getPopulationStats(pop));

    console.log('working on generation ' + genNum);

    if (genNum >= config.maxGenerations) {
        console.log('finished genetic algorithm');
        bestRoute = getFittest(pop).route;
        sendFinalResults();
        done = true;
        return;
    }

    //Evolve Population
    var newPop = evolvePopulation(pop);

    //Distribute Work to workers
    distributePopForWork(newPop, genNum + 1);
}

/*
ADMIN METHODS
*/

admin.on('connect', function(socket) {
    console.log('admin page connected');

    //check if done
    if (done) {
        sendFinalResults();
    }

    socket.once('admin:pass:details', function(workDetail) {
        //Write over values as it sees fit
        Object.assign(config, workDetail.config);

        //Set parcelList
        parcelList = workDetail.parcelList;

        //Start
        distributePopForWork(startingPop, 0);
    });
});

function sendFinalResults() {
    var str = JSON.stringify({
        parcelList: parcelList,
        config: config,
        bestRoute: bestRoute,
        genStats: generationalStats,
        numWorkers: Object.keys(worker.connected).length,
    }, null, 2);
    // console.log(str);
    admin.emit('server:pass:result', {
        parcelList: parcelList,
        config: config,
        bestRoute: bestRoute,
        genStats: generationalStats,
        numWorkers: Object.keys(worker.connected).length,
    })
}


/*
WORKER METHODS
*/

var workerMan = {
    reported: 0,
    nextPop: [],
    generation: 0,
    readyCount: 0,
};

//Called once config file is recieved
function setupWorkerSocket() {
    worker.on('connect', function(socket) {
        //Set socket name
        socket.name = makeID();
        socket.givenWork = [];

        console.log(socket.name + ' has connected');

        //Send details to worker
        var workDetail = {
            config: config,
            parcelList,
            parcelList
        }
        socket.emit('server:pass:details', workDetail);

        socket.emit('message', startingPop);


        socket.passWork = function(id, route) {
            var work = {
                id: id,
                route: route,
            }

            //Send work to worker
            socket.emit('server:pass:work', work);
        }

        socket.on('worker:pass:results', function(result) {
            // console.log(socket.name + ' has returned ', result);

            //Put calculations into currentPop
            workerMan.nextPop[result.id] = {
                distance: result.distance,
                fitness: 1 / result.distance,
                route: result.route
            }

            workerMan.reported++;

            //Check if all work is reported
            if (workerMan.reported === config.populationSize) {
                // console.log('all work is done');
                doGeneration(workerMan.nextPop, workerMan.generation);
            }
        });

        socket.on('worker:ready', function() {
            workerMan.readyCount++;
            console.log(socket.name + ' is ready! ', workerMan.readyCount);
        })

        socket.on('disconnect', function() {
            workerMan.readyCount--;

            //Check if worker had work left
            if (socket.givenWork.length > 0) {
                //TODO redistribute work
                console.log(socket.name + ' has disconnected before finishing work');
            }
            else {
                console.log(socket.name + ' has disconnected correctly');
            }
        })
    })
}

function distributePopForWork(pop, genNum) {
    var keys = Object.keys(worker.connected);
    var numConnected = keys.length;

    // console.log('server has ' + numConnected + ' workers');

    //if no workers...
    if (numConnected == 0) {
        console.log('--- waiting for a worker to connect...');

        //wait 2 seconds and try again
        setTimeout(function() {
            distributePopForWork(pop, genNum);
        }, 2000);

        return;
    }

    workerMan.generation = genNum;

    //distribute pop to workers
    //Loop through population
    var popIndex = 0;
    while (popIndex < pop.length) {

        //Loop thought workers
        for (var socketIndex = 0; socketIndex < numConnected; socketIndex++) {
            //get socket
            var socket = worker.connected[keys[socketIndex]];

            // pass work to individual socket
            socket.passWork(popIndex, pop[popIndex].route);

            //Increment popIndex
            popIndex++;

            //Check if pop is all sent off
            if (popIndex >= pop.length) {
                //it is so break, outerloop will also end
                break;
            }
        }
    }
}

/*
POPULATION METHODS
*/
function evolvePopulation(pop) {
    var newPop = [];

    // Keep our best individual if elitism is enabled
    var elitismOffset = 0;
    if (config.elitism) {
        newPop[0] = getFittest(pop);
        elitismOffset = 1;
    }

    // Crossover population
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

    return newPop;
}

function mutate(child) {
    // Loop through route
    for (var index1 = 0; index1 < config.routeSize; index1++) {
        // Apply mutation rate
        if (Math.random() < config.mutationRate) {
            // Get a second random position in the route
            var index2 = Math.floor(child.route.length * Math.random());

            // Get the parcelIndex at target position in route
            var parcelIndex1 = child.route[index1];
            var parcelIndex2 = child.route[index2];

            // Swap them around
            child.route[index2] = parcelIndex1;
            child.route[index1] = parcelIndex2;
        }
    }

    return child;
}

function crossover(parcel1, parcel2) {
    if (parcel1.fitness > parcel2.fitness) {
        return deepCopy(parcel1);
    }
    else {
        return deepCopy(parcel2);
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

function getPopulationStats(pop) {
    var maxIndex = 0;
    var minIndex = 0;
    var sum = pop[0].distance;

    // console.log(pop);
    var c = 0;

    //Loop through and find stat values
    for (var i = 1; i < pop.length; i++) {
        if (pop[maxIndex].distance < pop[i].distance) {
            maxIndex = i;
        }

        if (pop[minIndex].distance > pop[i].distance) {
            minIndex = i;
        }

        sum += pop[i].distance;


    }

    //Return stat values
    return {
        min: pop[minIndex].distance,
        max: pop[maxIndex].distance,
        mean: sum / pop.length
    }
}


/*
GENERATE RANDOM DATA
*/

function randomParcelList() {
    var arr = []
    for (var i = 0; i < config.numPackages; i++) {
        arr.push(randomParcel());
    }

    return arr;
}

function randomParcel() {
    var obj = {};
    obj.x = Math.floor(Math.random() * config.maxX);
    obj.y = Math.floor(Math.random() * config.maxY);
    obj.weight = Math.floor(Math.random() * 20) + 1;

    return obj;
}

function randomPop() {
    var arr = [];

    for (var i = 0; i < config.populationSize; i++) {
        arr.push(randomChild());
    }

    return arr;
}

function randomChild() {
    var obj = {};
    obj.route = [];
    obj.fitness = 0;
    obj.distance = Number.MAX_SAFE_INTEGER;

    for (var i = 0; i < config.numPackages; i++) {
        obj.route.push(i);
    }

    obj.route = shuffle(obj.route);

    return obj;
}

/*
HELPER METHODS
*/

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function makeID() {
    return '_' + Math.random().toString(36).substr(2, 9);
};

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}