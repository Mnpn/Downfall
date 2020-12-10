let endpoint = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json";
let forecast = null;
let nextRain, nextSnow, nextFog = "Weather data not yet fetched.";

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

function getPos() {
	$("#topLabel").css("display", "block");
	navigator.geolocation.getCurrentPosition(locSuccess, locError);
}

// SMHI's API supports up to 6 decimal point values, let's try to keep it below that.
// This is not the world's most accurate way to round, but it is sufficient here.
function roundPos(pos) { return Math.round((pos + Number.EPSILON) * 10000) / 10000 }

function percipStatus(statusInt) { // Format SMHI's options as text
	switch(statusInt) {
		case 0: return "be no percipitation";
		case 1: return "snow";
		case 2: return "snow & rain";
		case 3: return "rain";
		case 4: return "drizzle";
		case 5: return "be freezing rain";
		case 6: return "be freezing drizzle";
		default: "Unknown";
	}
}

function rainStatus(statusInt) {
	switch(statusInt) {
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			return true;
		default: false;
	}
}

function snowStatus(statusInt) {
	switch(statusInt) {
		case 1:
		case 2:
			return true;
		default: false;
	}
}

// unsure if I want to use this over a switch in a func
let Wsymb2 = new Map([ // TODO: definitions.js
		[1, "Clear sky"],
		[2, "Nearly clear sky"],
		[3, "Variable cloudiness"],
		[4, "Halfclear sky"],
		[5, "Cloudy sky"],
		[6, "Overcast"],
		[7, "Fog"],
		[8, "Light rain showers"],
		[9, "Moderate rain showers"],
		[10, "Heavy rain showers"],
		[11, "Thunderstorm"],
		[12, "Light sleet showers"],
		[13, "Moderate sleet showers"],
		[14, "Heavy sleet showers"],
		[15, "Light snow showers"],
		[16, "Moderate snow showers"],
		[17, "Heavy snow showers"],
		[18, "Light rain"],
		[19, "Moderate rain"],
		[20, "Heavy rain"],
		[21, "Thunder"],
		[22, "Light sleet"],
		[23, "Moderate sleet"],
		[24, "Heavy sleet"],
		[25, "Light snowfall"],
		[26, "Moderate snowfall"],
		[27, "Heavy snowfall"]
	]);

// Request data from SMHI
function getData(long, lat) {
	endpoint = endpoint.replace("{lat}", lat).replace("{lon}", long);
	$.getJSON(endpoint).done(function (data) {		
		forecast = JSON.parse(JSON.stringify(data));
		displayData();
	});
}

function displayData() { // TODO: better, non-repetitive code
	let foundFirstRain, foundFirstSnow, foundFirstFog = false;
	let hoursRemainingRain, hoursRemainingSnow, hoursRemainingFog = 0; // TODO: this doesn't really work. all updates are not hourly.
	let percipCond = -1; // this can never occur with SMHI data
	for(day in forecast.timeSeries) {
		time = forecast.timeSeries[day];
		// After the 5th entry, the location of pcat in the array moves. We have to check by names, sigh.
		for(i=0; i<time.parameters.length; i++) {
			if(time.parameters[i].name == "pcat") {
				percipCond = time.parameters[i].values[0];

				if(rainStatus(percipCond) && !foundFirstRain) {
					hoursRemainingRain = day;
					foundFirstRain = true;
				}
				if(snowStatus(percipCond) && !foundFirstSnow) {
					hoursRemainingSnow = day;
					foundFirstSnow = true;
				}
				/*if(time.parameters[18].values[0] == 6+1 && !foundFirstFog) { // wsymb always 18, 6 = fog
					hoursRemainingFog = day;
					foundFirstFog = true;
				}*/
			}
		}
	}
	if(foundFirstRain) {
		if(hoursRemainingRain == 0) { nextRain = "It's raining, bring an umbrella!"; } else {
			nextRain = "It's going to " + percipStatus(percipCond) + " next in " + hoursRemainingRain + " hours.";
			nextRain += "<br>That's on " + formatDate(forecast.timeSeries[hoursRemainingRain].validTime) + ".";
		}
	} else { nextRain = "Sunny days ahead."; } // no rain found

	if(foundFirstSnow) {
		if(hoursRemainingSnow == 0) { nextSnow = "It's snowing right now!"; } else {
			nextSnow = "You'll see some snow in " + hoursRemainingSnow + " hours.";
			nextSnow += "<br>That's on " + formatDate(forecast.timeSeries[hoursRemainingSnow].validTime) + ".";
		}
	} else { nextSnow = "No snow on the forecast!"; } // no snow found

	/*if(foundFirstFog) {
		if(hoursRemainingFog == 0) { nextFog = "It's foggy, be careful!"; } else {
			nextFog = "It's going to be foggy next in " + hoursRemainingFog + " hours.";
			nextFog += "<br>That's on " + formatDate(forecast.timeSeries[hoursRemainingFog].validTime) + ".";
		}
	} else { nextFog = "Clear days ahead."; } // no fog found*/

	listUpdate();
}

function listUpdate() {
	if($("#snow").is(':checked')) {
		$("#statustext").html(nextSnow);
		return
	} else if($("#rain").is(':checked')) {
		$("#statustext").html(nextRain);
		return
	/*} else if($("#fog").is(":checked")) {
		$("#statustext").html(nextFog);
		return*/
	} else if($("#wsymb2").is(":checked")) {
		$("#statustext").html(Wsymb2.get(forecast.timeSeries[0].parameters[18].values[0])
			+ " & " + forecast.timeSeries[0].parameters[11].values[0] + "&#8451;");
			// now, wsymb2; now, temp
	} else {
		$("#statustext").html("Invalid option selected.");
	}
}

function formatDate(date) {
	dateString = date.slice(0, -10) + " at " + date.slice(11, -4);
	return dateString;
}
