var connection = io();
var droneStats;
var packages;
setupConnection();

function setupConnection() {
    connection.on('connect', function(msg) {
        console.log("Connected to server");
    });

    connection.on('disconnect', function(msg) {
        console.log("disconnect from server");
    });


    //Setup Alert message
    connection.on('pass work', recieveWork);
    connection.on('pass work detail', recieveWorkDetail);
}


function recieveWork(work) {
    console.log(work);
    console.log("Work Recived");
   // var packageIndexs = work.packages;
    var id = work.id;
}

function recieveWorkDetail(details) {
    var droneStats = details.droneStats;
    console.log(droneStats);
    var packages = details.packages;
    console.log(packages);
    calulation(packages);
}

function calulation(arr) {
    console.log("in the math");
    var totalDistance = 0;
     for(var i = 1; i < arr.length; i++) {
         var x1 = arr[i-1].x;
         var y1 = arr[i-1].y;
         var x2 = arr[i].x;
         var y2 = arr[i].y;
         totalDistance += Math.sqrt((Math.pow((x2-x1), 2)) + (Math.pow((x2-x1), 2)));
         console.log(totalDistance);
     }
}