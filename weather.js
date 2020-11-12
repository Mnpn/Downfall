let endpoint = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json";
let forecast = null;

// location code from google web fundamentals
var locSuccess = function(position) {
	let longitude = roundPos(position.coords.longitude);
	let latitude = roundPos(position.coords.latitude);
	document.getElementById("long").innerHTML = "Long: " + longitude;
	document.getElementById("lat").innerHTML = "Lat: " + latitude;
	console.log("Lat: " + latitude);
	console.log("Long: " + longitude);

	getData(longitude, latitude);
};

var locError = function(error) {
	switch(error.code) {
		case error.TIMEOUT:
		break;
	}
};

function getPos() { navigator.geolocation.getCurrentPosition(locSuccess, locError); }

// SMHI's API supports up to 6 decimal point values, let's try to keep it below that.
// This is not the world's most accurate way to round, but it is sufficient here.
function roundPos(pos) { return Math.round((pos + Number.EPSILON) * 10000) / 10000 }

// Request data from SMHI
function getData(long, lat) {
	endpoint = endpoint.replace("{lat}", lat).replace("{lon}", long);
	$.getJSON(endpoint).done(function (data) {		
		forecast = data;
    	//callback(data); // err handle at some point
		document.getElementById("data").innerHTML = "Data: " + JSON.stringify(forecast);
	});
}