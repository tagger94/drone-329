// var connection = io();
var socket = io('/worker');
var name;
var droneStats;
var packages;
setupConnection();

function setupConnection() {
    socket.on('connect', function(msg) {
        console.log("Connected to server");
    });

    socket.on('disconnect', function(msg) {
        console.log("disconnect from server");
    });

    socket.on('server:set:name', function(name) {
        console.log('client said my name is ' + name);
        name = name;
    })


    //Setup Alert message
    socket.on('server:pass:work', recieveWork);
    socket.on('server:pass:detail', recieveWorkDetails);
}


function recieveWork(work) {
    // var packageIndexs = work.packages;
    var realWork = organizeWork(packages, work);
    if (packages) {
        if (isWeightValid(droneStats, realWork.packageIndex, 0)) {
            var dist = getTotalDistance(realWork.packageIndex, droneStats);
            if (dist) {
                
                returnTotalDist(dist, realWork.id);
            }
        }
    }
    else
        returnTotalDist(Number.MAX_SAFE_INTEGER, realWork.id);
}

function returnTotalDist(totalDist, id) {

    console.log(totalDist);
    var distanceObject = {
        distance: totalDist,
        id: id
    }
    socket.emit('worker:pass:distance', distanceObject);
}

function recieveWorkDetails(details) {
    // console.log("we have the dirty details");
    droneStats = details.droneStats;
    // console.log(details);
    packages = details.packages;

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
    if(returnVariable) {
        returnVariable = totalDistance;
    }
    return returnVariable;
}

function calculation(p1, p2) {
    return Math.sqrt((Math.pow((p1.x - p2.x), 2)) + (Math.pow((p1.y - p2.y), 2)));
}

function isWeightValid(droneDetails, array, index) {
    var i = index;
    var bucketWeight = 0;
    var stopIndex = droneDetails.numPackages + i;
    if (stopIndex > array.length) {
        stopIndex = array.length;
    }
    for (i; i < stopIndex; i++) {
        if (array[i].weight) {
            bucketWeight += array[i].weight;
        }
        else return;
    }
    if (bucketWeight > droneDetails.maxWeight)
        return false;
    else if (i < array.length) {
        return isWeightValid(droneDetails, array, i);
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
    var newArray = [];
    var workArray = work.packageIndex;
    for (var i = 0; i < workArray.length; i++) {
        newArray[i] = mainArray[workArray[i]];
    }
    work = {
        id: work.id,
        packageIndex: newArray
    }
    return work;
}