<!doctype html>
<html>

<head>
    <title>Web Worker</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
</head>

<body>
    <h1>Spoof Consumer</h1>
    <div>
        <input type="submit" value="Connect" onClick="get_pData()">
    </div><br>
    <hr id="lbreak" size="30" color="#0099ff"> currently following...
    <h2 id='roomid'>Patients: </h2>
    <div style='width=100%' id="patientDash">


    </div>

    <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
    <script src="https://code.jquery.com/jquery-1.11.1.js"></script>
    <script>
        //var socket = io();
        //var roomAlex = io('/alex');
        var room = io('/consumer');
        setupRoom();

        function setupRoom() {
            room.on('connect', function(msg) {
                console.log("Connected room to server");
            });

            room.on('disconnect', function(msg) {
                console.log("disconnect from server");
            });


            //Setup Alert message
            room.on('update', recieveUpdate);
            room.on('patient data', recievePatientData);
        }

        function get_pData() {
            var pid = document.getElementById("pid").value;
            $("#pid").val("");
            if (!pid || (isNaN(pid))) {
                console.log("Not a patient id");
                return;
            }
            requestPatientData(pid);

        }

        function requestPatientData(pid) {
            //$('#patientStatus').text("Status: ")
            console.log("requesting data");
            //TODO --> remove spoof
            room.emit("subscribe to patient", pid);
        }

        function recieveUpdate(message) {
            console.log('Update Recived for ' + message.pid);
            var s = "Heart Rate : " + message.update;
            $('#patientHeartRate' + message.pid).text(s);
        }

        function addCloseButton(pid) {

            var closeButton = document.createElement("input");
            closeButton.type = "submit";
            closeButton.value = "close";
            closeButton.id = "close" + pid;
            closeButton.className = "close";
            closeButton.src = "https://grants.hrsa.gov/2010/WebEPSExternal//platform/include/skins/EHB/images/close_1.png";
            closeButton.type = "image";
            closeButton.onclick = function() {
                this.parentNode.parentNode.removeChild(this.parentNode);
                console.log('Unsubscribing from ' + pid);
                room.emit('unsubscribe', pid);

                return false;
            }

            return closeButton;
        }

        function recievePatientData(data) {
            console.log(data);

            var patientDash = document.getElementById("patientDash");
            var patientDiv = document.createElement("div");
            patientDiv.appendChild(addCloseButton(data.pid));

            patientDiv.id = data.pid;
            patientDiv.className = "patient";

            var patientName = document.createElement("p")
            var patientHeight = document.createElement("p")
            var patientWeight = document.createElement("p")
            var patientGender = document.createElement("p")
            var heartRate = document.createElement("p");

            var patientNameText = document.createTextNode("Name: " + data.Name);
            var patientHeightText = document.createTextNode("Height: " + data.Height);
            var patientWeightText = document.createTextNode("Weight: " + data.Weight);
            var patientGenderText = document.createTextNode("Gender: " + data.Gender);
            var patientStatusText = document.createTextNode("Heart Rate: ");

            heartRate.id = "patientHeartRate" + data.pid;

            patientName.appendChild(patientNameText);
            patientHeight.appendChild(patientHeightText);
            patientWeight.appendChild(patientWeightText);
            patientGender.appendChild(patientGenderText);
            heartRate.appendChild(patientStatusText);

            patientDiv.appendChild(patientName);
            patientDiv.appendChild(patientHeight);
            patientDiv.appendChild(patientWeight);
            patientDiv.appendChild(patientGender);
            patientDiv.appendChild(heartRate);

            patientDash.appendChild(patientDiv);
            
            //Populate starting value
            recieveUpdate({
                pid: data.pid,
                update: data.Last_Sensor_Value
            });

        }
    </script>
</body>

</html>