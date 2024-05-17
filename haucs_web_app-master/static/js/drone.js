// import { GMap } from './gmap.js'; // not work now, when we can solve this problem, just remove the class GMap below
var gmap;

var arming = true;
var gcs_counter = 3;

function formattedTime(seconds){
    let mins = Math.floor(seconds / 60);
    let secs = seconds - mins * 60;
    let smins = mins.toString();
    let ssecs = secs.toString();
    if (mins < 10)
        smins = "0" + smins;
    if (secs < 10)
        ssecs = "0" + ssecs;
    return smins + ":" + ssecs;
}
function GCSColor(element, previous, current){
    if (previous == current)
        gcs_counter += 1;
    else
        gcs_counter = 0;

    if (gcs_counter > 3){
        element.textContent= "GCS DISCONNECTED";
        element.style.color='red';
    }
    else{
        element.textContent = "GCS CONNECTED";
        element.style.color='green';
    }
}
function batteryColor(element){
    if (element.textContent < 14.7)
        element.style.color = 'red';
    else
        element.style.color = 'black';
}
function doColor(element){
    if (element.textContent < 1)
        element.style.color = 'red';
    else
        element.style.color = 'black';
}
function msgColor(element){
    if (element.value <= 2)
        element.style.color = 'red';
    else if (element.value <= 4)
        element.style.color = 'orange';
    else
        element.style.color = 'black';
}
function timerColor(element){
    if (element.value > 5)
        element.style.color = 'red';
    else
        element.style.color = 'black';
}

function updateData() {
    fetch('/data/LH_Farm drone ' + drone_id)
        .then(response => response.json())
        .then(json => {
        if (json) {
            for (var key in json.data){
                if (key.split('_').pop() == "time"){
                    document.getElementById(key).textContent = formattedTime(json.data[key]);
                }
                else if (key == 'msg_severity'){
                    document.getElementById('msg').value = json.data[key];
                }
                else if (key != "timers") {
                    document.getElementById(key).textContent = json.data[key];
                }
            }
            //handle timers
            var oldGCS = document.getElementById('GCS_HBEAT').value;
            document.getElementById('GCS_HBEAT').value = json.data.timers.GCS_HBEAT;
            document.getElementById('GLOBAL_POSITION_INT').textContent = 'Position';
            document.getElementById('GLOBAL_POSITION_INT').value = json.data.timers.GLOBAL_POSITION_INT;
            document.getElementById('BATTERY_STATUS').textContent = 'Battery';
            document.getElementById('BATTERY_STATUS').value = json.data.timers.BATTERY_STATUS;
            document.getElementById('NAMED_VALUE_FLOAT').textContent = 'Payload';
            document.getElementById('NAMED_VALUE_FLOAT').value = json.data.timers.NAMED_VALUE_FLOAT;
            timerColor(document.getElementById('GLOBAL_POSITION_INT'));
            timerColor(document.getElementById('BATTERY_STATUS'));
            timerColor(document.getElementById('NAMED_VALUE_FLOAT'));
            // HANDLE COLOR CHANGES
            
            GCSColor(document.getElementById('GCS_HBEAT'), oldGCS, json.data.timers.GCS_HBEAT);
            batteryColor(document.getElementById('voltage'));
            doColor(document.getElementById('p_DO'));
            msgColor(document.getElementById('msg'));

            if (gmap){
                // HANDLE MISSION CHANGES
                gmap.setMissions(json.mission);
                // HANDLE DRONE POSITION
                gmap.add_list_pos(json.data.lat, json.data.lon);
                // UPDATE MAP WITH NEW MISSION & POS
                gmap.updatemap();
            }
        }
        })
        .catch(function(){
            document.getElementById('GCS_HBEAT').textContent = "NO INTERNET";
            document.getElementById('GCS_HBEAT').style.color='red';
        })
}

function btnResetPath_click() {
    if (gmap)
        gmap.reset_list_pose();
}
function btnToggleView_click(id) {
    var button = document.getElementById(id);
    if (button.textContent === "Not Centered"){
        gmap.setDroneCenter(true);
        button.textContent = "Centered";
    }
    else{
        gmap.setDroneCenter(false);
        button.textContent = "Not Centered";
    }
}

function btnSave_click(event) {
    gmap.save_list_pos();
}

function btnLoad_click() {
    document.getElementById('fileInput').click(); // Trigger the hidden file input
}
function loadPositions(event) {
    const file = event.target.files[0];
    gmap.load_list_pos(file);
}

class GMap{
    // private parameters
    #centerX = [27.535378, 37.7045823];
    #centerY = [-80.351586, -89.4585105];
    #solidLine;
    #droneLine;
    #map;
    #drone;
    #infoWindow;
    #makemap;
    
    // public parameters
    mapid;
    droneCenter;
    drone_pos;
    droneSize = 44;
    zoomMap = 19;
    list_pos = [];
    cur_i = -1;
    missions = [];
    #max_list_pos = -1;

    constructor(id = 0, makemap=false){
        this.mapid = id;
        this.#makemap = makemap;
        this.#initialize();
    }

    #initialize(){
        this.droneCenter = true;
        this.drone_pos = new google.maps.LatLng(this.#centerX[this.mapid], this.#centerY[this.mapid]);
        var mapProp = {
            center: new google.maps.LatLng(this.#centerX[this.mapid], this.#centerY[this.mapid]),
            zoom: this.zoomMap,
            mapTypeId: 'satellite',
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: false,
            tilt: 0,
        };
        this.#map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

        this.#droneLine = new google.maps.Polyline({
            path: this.list_pos,  // This is your array of google.maps.LatLng objects
            geodesic: true,  // If you want the shortest path over the earth's surface
            strokeColor: '#FF5500',  // Any color you want for the line
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: this.#map,
        });
        this.#drone = new google.maps.Marker({
            position: mapProp.center,
            icon: {
                url: "/static/images/drone.svg",
                scaledSize: new google.maps.Size(this.droneSize, this.droneSize),
                anchor: new google.maps.Point(this.droneSize / 2, this.droneSize / 2)
            }
        });
        this.#drone.setMap(this.#map);

        var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };
        this.#solidLine = new google.maps.Polyline({
            path: this.missions,  // This is your array of google.maps.LatLng objects
            geodesic: true,  // If you want the shortest path over the earth's surface
            strokeColor: '#FFFF00',  // Any color you want for the line
            strokeOpacity: 1.0,
            strokeWeight: 2,
            icons: [{
                icon: lineSymbol,
                offset: '100%',  // Position at the end of the line
                repeat: '100px'  // Change this value to control the spacing of arrows
            }],
            map: this.#map
        });

        // Create the initial InfoWindow.
        this.#infoWindow = new google.maps.InfoWindow({
            content: "Move the map at the path to get Lat/Lng!",
            position: mapProp.center,
        });
        this.#map.addListener('mousemove', (event) =>  {
            var mouse_latlon = event.latLng;
            var levelZoom = 20 - this.#map.getZoom();
            levelZoom = Math.pow(2, levelZoom);
            var i, shortest = Number.MAX_VALUE, si = -1;
            for (i = 0; i < this.list_pos.length; i++) {
                var dist = this.calculateDistance(mouse_latlon, this.list_pos[i]);
                if (dist < shortest && dist < levelZoom) {
                    shortest = dist;
                    si = i;
                }
            }
            if (si >= 0 && this.cur_i !== si) {
                if (this.cur_i >= 0) {
                    this.#infoWindow.close();
                }
                this.#infoWindow = new google.maps.InfoWindow({
                    position: this.list_pos[si],
                    content: JSON.stringify(this.list_pos[si].toJSON(), null, 2)
                });
                this.#infoWindow.open(this.#map);
                this.cur_i = si;
            } else if (si < 0 && this.cur_i >= 0) {
                this.#infoWindow.close();
                this.cur_i = -1;
            }
        });

        if (this.#makemap){
            this.#map.addListener('click', (event) => {
                var mouse_latlon = event.latLng;
                this.list_pos.push(mouse_latlon);
    
                this.#drone.setPosition(mouse_latlon);
                this.#droneLine.setPath(this.list_pos);
                this.#map.setCenter(mouse_latlon);
            });
        }
    }

    arePositionsEqual(pos1, pos2) {
        if (pos1 && pos2)
          return pos1.lat() === pos2.lat() && pos1.lng() === pos2.lng();
        return false;
    }

    calculateDistance(pos1, pos2) {
        function toRadians(degrees) {
            return degrees * Math.PI / 180;
        }
    
        var R = 6371; // Radius of the Earth in kilometers
        var dLat = toRadians(pos2.lat() - pos1.lat());
        var dLon = toRadians(pos2.lng() - pos1.lng());
        var a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(pos1.lat())) * Math.cos(toRadians(pos2.lat())) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = R * c; // Distance in kilometers
        return distance * 1000; // Convert distance to meters
    }

    updatemap(){
        this.#solidLine.setPath(this.missions);
        this.#drone.setPosition(this.drone_pos);
        
        if (this.list_pos.length > 0){
            this.#droneLine.setPath(this.list_pos);
        }
        
        if (this.#map){
            if (this.droneCenter == true)
                this.#map.setCenter(this.drone_pos);
        }
    }

    setMissions(landmarks) {
        this.missions = [];
        
        for (var i = 0; i < landmarks.length; i++) {
            var lat = landmarks[i][0];
            var lon = landmarks[i][1];
            var mission = new google.maps.LatLng(lat,lon);
            this.missions.push(mission);
        }
    }

    add_list_pos(lat, lon) {
        var dp = new google.maps.LatLng(lat, lon);
        if (!this.arePositionsEqual(this.drone_pos, dp)){
            this.drone_pos = dp;
            this.list_pos.push(this.drone_pos);
            if (this.#max_list_pos > 0 && this.list_pos.length > this.#max_list_pos){
                this.list_pos.shift();
            }
        }
    }

    reset_list_pose(){
        this.list_pos = [];
        this.#droneLine.setPath(this.list_pos);
    }

    setDroneCenter(isCenter){
        this.droneCenter = isCenter;
        if (this.#map && this.droneCenter){
            this.#map.setCenter(this.drone_pos);
        }
    }

    save_list_pos() {
        // Convert list_pos into a simple array of objects with latitude and longitude before saving
        const data = JSON.stringify(this.list_pos.map(pos => ({ lat: pos.lat(), lng: pos.lng() }))); // Assuming gmap is your class instance
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'list_positions.json'; // Specify the file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    load_list_pos(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {  // Changed to arrow function
                const positions = JSON.parse(e.target.result);
                this.list_pos = positions.map(pos => new google.maps.LatLng(pos.lat, pos.lng));
                this.updatemap();  // Now 'this' correctly refers to the GMap instance
            };
            reader.readAsText(file);
        }
    }    

    static loadMap() {
        window.myMapWithId = function() {
            gmap = new GMap();
        };
        var script = document.createElement('script');
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCQZZk_BUDTJwYN2TCsPwVJGLxkiMiSzPg&callback=myMapWithId";
        document.body.appendChild(script);
    }
}