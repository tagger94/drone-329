// var connection = io();
var socket = io('/worker');
var config;
var parcelList;
setupConnection();

function setupConnection() {
    socket.on('connect', function(msg) {
        console.log("Connected to server");
    });

    socket.on('disconnect', function(msg) {
        console.log("disconnect from server");
    });

    socket.on('server:pass:details', function(details) {
        console.log('server sent work details', details);
        recieveWorkDetail(details);

        socket.emit('worker:ready');
    });

    //Ready to recieve work
    socket.on('server:pass:work', function(work) {
        console.log('server sent work ', work);
        recieveWork(work);

    });

    socket.on('message', function(msg) {
        console.log('server sent ', msg);
    })
}


function recieveWork(work) {
    //Check if ready
    if ((parcelList && config) == false) {
        console.log('--- not ready to work yet, waiting 5 seconds...');
        setTimeout(function() {
            console.log('--- trying work again...');
            recieveWork(work);
        }, 5000);
        return;
    }

    console.log('starting work on ', work.id);
    //Start Calculations
    var realWork = organizeWork(parcelList, work);

    if (isWeightValid(config, realWork.packageIndex, 0)) {
        var dist = getTotalDistance(realWork.packageIndex, config);
        if (dist) {

            sendResults(dist, realWork.id);
        }
    }

    else
        sendResults(Number.MAX_SAFE_INTEGER, realWork.id);
}

function sendResults(totalDist, id) {

    console.log('finished work on ' + id + ' ',totalDist);
    var results = {
        distance: totalDist,
        id: id
    }
    socket.emit('worker:pass:distance', results);
}

function recieveWorkDetail(details) {
    config = details.config;
    parcelList = details.parcelList;
}

function getTotalDistance(arr, droneDetails) {
    var startP = createDistObj(100, 100);
    var firstLocation = createDistObj(arr[0].x, arr[0].y);
    var totalDistance = calculation(startP, firstLocation);
    var returnVariable;
    var checkdist = true;

    for (var i = 1; i < arr.length; i++) {
        var p1 = createDistObj(arr[i - 1].x, arr[i - 1].y);
        var p2 = createDistObj(arr[i].x, arr[i].y);
        //checkdist += totalDistance;
        if (i % 3 == 0) {
            // console.log(totalDistance);
            totalDistance += calculation(p1, startP);
            totalDistance += calculation(startP, p2);
            checkdist += totalDistance;
            if (checkdist > droneDetails.maxDistance) {
                console.log("should not print");
                console.log(checkdist, droneDetails.maxDistance);
                returnVariable = false;
                return returnVariable;
                break;
            }
            else checkdist = 0;
            i++;
            continue;
        }
        totalDistance += calculation(p1, p2);
    }
    var lastLocation = createDistObj(arr[i - 2].x, arr[i - 2].y);;
    totalDistance += calculation(lastLocation, startP);
    if (returnVariable) {
        returnVariable = totalDistance;
    }
    return returnVariable;
}

function calculation(p1, p2) {
    return Math.sqrt((Math.pow((p1.x - p2.x), 2)) + (Math.pow((p1.y - p2.y), 2)));
}

function isWeightValid(dConfig, array, index) {
    var i = index;
    var bucketWeight = 0;
    var stopIndex = dConfig.numPackages + i;
    if (stopIndex > array.length) {
        stopIndex = array.length;
    }
    for (i; i < stopIndex; i++) {
        if (array[i].weight) {
            bucketWeight += array[i].weight;
        }
        else return;
    }
    if (bucketWeight > dConfig.maxWeight)
        return false;
    else if (i < array.length) {
        return isWeightValid(dConfig, array, i);
    }
    return true;
}

function createDistObj(x, y) {
    var p = {};
    p.x = x;
    p.y = y;
    return p;
}

function organizeWork(mainArray, work) {
    console.log('configuring work for ' + work.id);
    var newArray = [];
    var workArray = work.route;
    for (var i = 0; i < workArray.length; i++) {
        newArray[i] = mainArray[workArray[i]];
    }
    work = {
        id: work.id,
        packageIndex: newArray
    }
    return work;
}