function Model() {

	var self = this;

	//Hardcoded list of locations
	self.locations = [
	{
		name: "Statue of Liberty",
		lat: 40.68992717640107,
		lng: -74.04469741780797,
		icon: '',
		venue_id: '42893400f964a52054231fe3'
	},{
		name: "The White House",
		lat: 38.89767437003112,
		lng: -77.03602958173147,
		venue_id: '3fd66200f964a520d6f01ee3'

	},{
		name: "Disneyland Park",
		lat: 33.81053563825492,
		lng: -117.91897596728407,
		venue_id: '40f86c00f964a520bd0a1fe3'
	},{
		name: "Presidential Trail",
		lat: 43.87731746980997,
		lng: -103.45632766436881,
		venue_id: '4fb91b6ee4b0e2f7bc7bc307'
	},{
		name: "Navy Pier",
		lat: 41.89144796204029,
		lng: -87.6086071019105,
		venue_id: '45840abff964a520913f1fe3'
	},{
		name: "The French Quarter",
		lat: 29.95699746778187,
		lng: -90.06561922445354,
		venue_id: '4ad4c04ef964a520c0f320e3'
	}
	];

	//Set the home location coordinates to initialize the map here
	self.home = [38.897,-77.036];

	//Create an empty array to store a list of map markers
	self.markers = [];

	self.infoWindows = [];


}

var model = new Model();

function ViewModel() {

    var self = this;

    //Variables to hold Foursquare API tokens
    var CLIENT_ID = "3R13COVEW5M0POCTKOZLGAHVBH352A34CN2YFUMZ353JUQ2R";
    var CLIENT_SECRET = "BJV501L5JTBU0SMMEVFVFBQ2ELXNRQR1PH2CDBRBW4I3BNCT";

    //Set variable to track which map marker is currently selected
	var markerBouncing = null;

	//Set variable to track which infowindow is currently open
	var openInfoWindow = null;

	//Declare array for storing map marker content strings from FourSquare data
	var HTMLcontentString = '';
	self.contentStrings = [];

    /* Define observables here */

    //Observable for the search term
    self.searchTerm = ko.observable("");

    //Observable to show an error message if Foursquare resources fail to load. Sets the CSS class to hidden by default.
    self.showErrorMessage = ko.observable("hidden");

    //Take in the locations data object, put names into an array, push the names array into an observable array
    self.initResults = function(locations) {
	    self.initResultsList = [];
	    self.searchList = [];
	    for (i = 0; i < locations.length; i++) {
	    	var item = locations[i].name;
	    	self.initResultsList.push(item);
	    	//Create lower case version for case insensitive search
	    	self.searchList.push(item.toLowerCase());
	    }

	    //Create observable array to populate locations list view
	    self.results = ko.observableArray(self.initResultsList.slice(0));
	};

	//Initialize the list with hard-coded locations
	self.initResults(model.locations);


	//Checks search query against all locations and filters the list and map markers if query is contained in any of the results
	self.updateListAndMap = function() {
		//Empties the results and adds the result that matches the query
		self.results.removeAll();
		//Loop through markers, hides the locations filtered out and sets the matched location marker to visible.
		for (var i = 0; i < model.markers.length; i++) {
			model.markers[i].setVisible(false);
		}
		self.searchList.forEach(function (item, index, array) {
			if (item.indexOf(self.searchTerm().toLowerCase()) > -1) {
				self.results.push(self.initResultsList[index]);

				model.markers[index].setVisible(true);
			}
		});

			//If the filter input is empty, resets all locations to be visible
			if (self.searchTerm() === '') {
				self.results(self.initResultsList.slice(0));
				model.markers.forEach(function (item, index, array) {
					if (!item.getVisible()) {
						item.setVisible(true);
					}
				});
			}

	}.bind(this);

	//Function to reset the search filter input box, list view, and markers
	self.clearSearch = function() {
		self.searchTerm('');
		if (openInfoWindow) openInfoWindow.close();
		if (markerBouncing) markerBouncing.setAnimation(null);
		self.updateListAndMap();
		self.map.panTo(self.homelatlng);
		self.map.setZoom(15);
	};

    /* Define and use Google Map objects here */

    // This function takes in coordinates, converts coordinates to a google map lat and long object, sets the map options,
    // creates a map object, sets the bounds of the map, and displays the map in a div on the page.
	function showMap(latlng) {
	  var googleLatAndLong = latlng;
	  var bounds = new google.maps.LatLngBounds();
	  var latLngBounds = bounds.extend(googleLatAndLong);

	  var mapOptions = {
	    zoom: 15,
	    center: googleLatAndLong,
	    mapTypeId: google.maps.MapTypeId.ROADMAP,
	    disableDefaultUI: true
	  };

	  var mapDiv = document.getElementById("mapDiv");
	  var map = new google.maps.Map(mapDiv, mapOptions);
	  map.fitBounds(latLngBounds);

	  //Fix zoom after fitBounds
	  var listener = google.maps.event.addListener(map, "idle", function() {
  		if (map.getZoom() > 15) map.setZoom(15);
  		google.maps.event.removeListener(listener);
	  });

	  return map;
	}

	//Set the starting coordinates to the home location in the data model
    self.homelatlng = new google.maps.LatLng(model.home[0],model.home[1]);

	//Intialize the map using the home location Google maps latlan object
	self.map = showMap(self.homelatlng);

	//This function is used to create new map markers
	function addMarker(map, latlong, title, content, icon) {
	  var markerOptions = {
	    position: latlong,
	    map: map,
	    title: title,
	    animation: google.maps.Animation.DROP,
	    clickable: true,
	    icon: icon
	  };

	  var marker = new google.maps.Marker(markerOptions);
	  marker.addListener('click', toggleBounce);

	  var infoWindowOptions = {
	    content: content,
	    position: latlong
	  };

	  var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
	  model.infoWindows.push(infoWindow);

	  google.maps.event.addListener(marker, "click", function() {
	    if (openInfoWindow) openInfoWindow.close();
	    openInfoWindow = infoWindow;
	    infoWindow.open(map, marker);
	  });

	  google.maps.event.addListener(infoWindow, "closeclick", toggleBounce);

		 //Function to toggle the bounce anitmation of marker on click

		function toggleBounce() {
		  if (markerBouncing) {
		    markerBouncing.setAnimation(null);
		  }
		  if (markerBouncing != marker) {
		  	marker.setAnimation(google.maps.Animation.BOUNCE);
		  	markerBouncing = marker;
		  } else {
		    markerBouncing = null;
		  }
		}

	  return marker;
	}

	//Find the marker that is currently selected in the model list of markers and toggles the infowindow
	self.selectMarkerFromList = function(currentlySelected) {
		for (var i = 0; i < model.markers.length; i++) {
			if (currentlySelected == model.markers[i].title) {
				toggleInfoWindow(i);
			}
		}
	}.bind(this);

	//Function to the toggle the infowindow of a specific marker
	function toggleInfoWindow(id) {
		google.maps.event.trigger(model.markers[id], 'click');
	}

    /* Create other functions to communicate with Model, Observables, and APIs */


	self.initMap = function(data) {
	  for (var i = 0; i < data.length; i++) {
	    var location = data[i];
	    var googleLatAndLong = new google.maps.LatLng(location.lat,location.lng);
	    var windowContent = location.name;
	    //Create and add markers to map
	    var marker = addMarker(self.map, googleLatAndLong, location.name, windowContent, location.icon);
	    //Add marker to data model
	    model.markers.push(marker);
	  }
	};

	//Set timer to show error message if FourSquare resources don't load after 8 seconds.
	self.timer = setTimeout(function() {
		self.showErrorMessage("");
	}, 8000);

	//Make request to FourSquare API using JSONP.
	self.getLocationData = function(locations) {
	  for (var i=0; i<locations.length; i++) {
		  var url = "https://api.foursquare.com/v2/venues/"+
		  			locations[i].venue_id+
		  			"?client_id="+
		  			CLIENT_ID+
		  			"&client_secret="+
		  			CLIENT_SECRET+
		  			"&v=20150909&callback=ViewModel.callback";
		  var newScriptElement = document.createElement("script");
		  newScriptElement.setAttribute("src", url);
		  newScriptElement.setAttribute("id", "jsonp");
		  //Set onload attribute to check if resource loads. If onload fires, clear the timer
		  newScriptElement.setAttribute("onload", "clearTimeout(ViewModel.timer)");
		  var oldScriptElement = document.getElementById("jsonp");
		  var head = document.getElementsByTagName("head")[0];
		  if (oldScriptElement === null) {
		    head.appendChild(newScriptElement);
		  } else {
		    head.replaceChild(newScriptElement, oldScriptElement);
		  }
	  }
	};

	//Takes in the JSON response from the FourSquare API, constructs an HTML string, and sets it to the content of the relevant infoWindow
	self.callback = function(data) {
	  	model.infoWindows.forEach(function (item, index, array) {
	  		if (item.content == data.response.venue.name) {
	  			HTMLcontentString = "<p><strong><a class='place-name' href='"+
	  								data.response.venue.canonicalUrl+"'>"+
	  								data.response.venue.name+
	  								"</a></strong></p>"+
	  								"<p>"+data.response.venue.location.address+
	  								"</p><p><span class='place-rating'><strong>"+
	  								data.response.venue.rating+
	  								"</strong><sup> / 10</sup></span>"+
	  								"<span class='place-category'>"+
	  								data.response.venue.categories[0].name+
	  								"</p><p>"+data.response.venue.hereNow.count+
	  								" people checked-in now</p>"+
	  								"<img src='"+data.response.venue.photos.groups[0].items[0].prefix+
	  								"80x80"+
	  								data.response.venue.photos.groups[0].items[0].suffix+
	  								"'</img>";
	  			item.setContent(HTMLcontentString);
	  		}
	  	});

	};

	//Make request to get FourSquare data
	self.getLocationData(model.locations);

	//Initialize the map with a list of locations hardcoded in data model and foursquare data for marker window content
	self.initMap(model.locations);


}

var ViewModel = new ViewModel();

ko.applyBindings(ViewModel);
