let endpoint = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json";
let forecast = null;
let nextRain, nextSnow = "Weather data not yet fetched.";

// location code from google web fundamentals
var locSuccess = function(position) {
	$("#topLabel").html("I want to see...");
	$("#posButton").css("display", "none");
	$(".furtheroptions").css("display", "block");
	$("#infocard").css("display", "flex");
	let longitude = roundPos(position.coords.longitude);
	let latitude = roundPos(position.coords.latitude);
	$("#loc").html("Your location: " + latitude + ", " + longitude);
	getData(longitude, latitude);
};

var locError = function(error) {
	switch(error.code) {
		case error.TIMEOUT:
			break;
		default:
			$("#topLabel").html("Location access denied");
			break;
	}
};

function getPos() { $("#topLabel").css("display", "block"); navigator.geolocation.getCurrentPosition(locSuccess, locError); }

// SMHI's API supports up to 6 decimal point values, let's try to keep it below that.
// This is not the world's most accurate way to round, but it is sufficient here.
function roundPos(pos) { return Math.round((pos + Number.EPSILON) * 10000) / 10000 }

function rainStatus(statusInt) { // TODO: Request a time, check time, return value.
	switch(statusInt) {
		case 0: return "No percipitation";
		case 1: return "Snow";
		case 2: return "Snow & Rain";
		case 3: return "Rain";
		case 4: return "Drizzle";
		case 5: return "Freezing rain";
		case 6: return "Freezing drizzle";
		default: "Unknown";
	}
}
/*
function Wsymb2(timeSeries) {
	statusInt = timeSeries.parameters[15].values[0]; // type (wsymb), value (int)
	switch(statusInt) {
		case 0: return "";
		case 1: return "";
		case 2: return "";
		case 3: return "";
		case 4: return "";
		case 5: return "";
		case 6: return "";
		default: "Unknown"
	}
}*/

// unsure if I want to use this over a switch in a func
let Wsymb2 = new Map([ // TODO: definitions.js
		[0, "Clear sky"],
		[1, "Nearly clear sky"],
		[2, "Variable cloudiness"],
		[3, "Halfclear sky"],
		[4, "Cloudy sky"],
		[5, "Overcast"],
		[6, "Fog"],
		[7, "Light rain showers"],
		[8, "Moderate rain showers"],
		[9, "Heavy rain showers"],
		[10, "Thunderstorm"],
		[11, "Light sleet showers"],
		[12, "Moderate sleet showers"],
		[13, "Heavy sleet showers"],
		[14, "Light snow showers"],
		[15, "Moderate snow showers"],
		[16, "Heavy snow showers"],
		[17, "Light rain"],
		[18, "Moderate rain"],
		[19, "Heavy rain"],
		[20, "Thunder"],
		[21, "Light sleet"],
		[22, "Moderate sleet"],
		[23, "Heavy sleet"],
		[24, "Light snowfall"],
		[25, "Moderate snowfall"],
		[26, "Heavy snowfall"]
	]);

// Request data from SMHI
function getData(long, lat) {
	endpoint = endpoint.replace("{lat}", lat).replace("{lon}", long);
	$.getJSON(endpoint).done(function (data) {		
		forecast = JSON.parse(JSON.stringify(data));
		displayData();
	});
}

function displayData() {
	foundFirstRain = false;
	foundFirstSnow = false;
	hoursRemainingRain = 0; // TODO: this doesn't really work. all updates are not hourly.
	hoursRemainingSnow = 0;
	for(day in forecast.timeSeries) {
		time = forecast.timeSeries[day];
		// After the 5th entry, the location of pcat in the array moves. We have to check by names, sigh.
		for(i=0; i<time.parameters.length; i++) {
			if(forecast.timeSeries[day].parameters[i].name == "pcat") {
				rainCond = rainStatus(time.parameters[i].values[0]);
				upcoming = "" + day + ": " + time.parameters[1].values[0] + " degrees, "
					+ rainCond + ", "
					+ Wsymb2.get(time.parameters[18].values[0]); // wsymb always 18
				tag = document.createElement("p");
				tag.appendChild(document.createTextNode(upcoming));

				if(rainCond == "Rain" && !foundFirstRain) {
					hoursRemainingRain = day;
					foundFirstRain = true;
				}
				if(rainCond == "Snow" && !foundFirstSnow) {
					hoursRemainingRain = day;
					foundFirstRain = true;
				}
			}
		}
	}
	if(foundFirstRain) {
		if(hoursRemainingRain == 0) { nextRain = "It's raining, so true dood."; } else {
			nextRain = "It's going to rain next in " + hoursRemainingRain + " hours.<br>That's on " + formatDate(forecast.timeSeries[hoursRemainingRain].validTime) + ".";
		}
	} else { nextRain = "Sunny days ahead."; } // no rain found

	if(foundFirstSnow) {
		if(hoursRemainingSnow == 0) { nextSnow = "It's snowing right now!"; } else {
			nextSnow = "You'll see some snow in " + hoursRemainingSnow + " hours.<br>That's on " + formatDate(forecast.timeSeries[hoursRemainingSnow].validTime) + ".";
		}
	} else { nextSnow = "No snow on the forecast!"; } // no snow found

	listUpdate();
}

function listUpdate() {
	if($("#snow").is(':checked')) {
		$("#statustext").html(nextSnow);
		return
	} else if($("#rain").is(':checked')) {
		$("#statustext").html(nextRain);
		return
	} else {
		$("#statustext").html("monkaHmm");
	}
}

function formatDate(date) {
	dateString = date.slice(0, -10) + " at " + date.slice(11, -4);
	return dateString;
}
