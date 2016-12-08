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

    console.log('starting work on ', work);

    //Start Calculations
    var startIndex = 0;
    var endIndex = 0;
    var totalDistance = 0;

    while (startIndex < work.route.length) {
        //Set endIndex, but no more than route length
        endIndex = Math.min(startIndex + config.numPackages, work.route.length);

        var bucketDist = calcBucket(work.route.slice(startIndex, endIndex));

        if (bucketDist === Number.MAX_SAFE_INTEGER) {
            console.log(work.id + ' failed to ship!');
            sendResults(work, Number.MAX_SAFE_INTEGER);
        }

        totalDistance += bucketDist;

        //Set starting index for next pass
        startIndex = endIndex;
    }

    sendResults(work, totalDistance);

}

function calcBucket(bArr) {

    var totalWeight = 0;
    var totalDistance = 0;

    //Get leaving home distance
    var currentIndex = -1; // using config.homeLocation
    var nextIndex = bArr[0];

    //Sum totals for start
    totalDistance += distBetween(config.homeLocation, parcelList[nextIndex]);

    for (var i = 1; i < bArr.length; i++) {
        //Get next set
        currentIndex = nextIndex;
        nextIndex = bArr[i];

        //Sum totals
        totalDistance += distBetween(parcelList[currentIndex], parcelList[nextIndex]);
        totalWeight += parcelList[currentIndex].weight;
    }

    //get going home distance
    currentIndex = nextIndex;

    //Sum totals for end
    totalDistance += distBetween(parcelList[currentIndex], config.homeLocation);
    totalWeight += parcelList[currentIndex].weight;

    if (totalDistance > config.maxDistance || totalWeight > config.maxWeight) {
        return Number.MAX_SAFE_INTEGER;
    }
    else {
        return totalDistance;
    }
}

function distBetween(p1, p2) {
    return Math.sqrt((Math.pow((p1.x - p2.x), 2)) + (Math.pow((p1.y - p2.y), 2)));
}

function sendResults(work, totalDistance) {
    console.log('finished work on ' + work.id + ' ', totalDistance);
    var results = {
        id: work.id,
        route: work.route,
        distance: totalDistance,
    };

    socket.emit('worker:pass:results', results);
}

function recieveWorkDetail(details) {
    config = details.config;
    parcelList = details.parcelList;
}