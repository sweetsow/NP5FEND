function Model() {

	var self = this;

	//Hardcoded list of locations
	self.locations = [
	{
		name: "SKS Hospital",
		lat: 11.670157,
		lng: 78.143357,
		venue_id: '9d1e8f8e5acaa35dfbd7eb85'
	},{
		name: "Kiruba Hospital",
		lat: 11.666987,
		lng: 78.155714,
		venue_id: '6722b252c11d2e49793b82c3'
	},{
		name: "St Mary Hospital",
		lat: 11.663511,
		lng: 78.144554,
		venue_id: '67fc4d3f964a520da9gr1fe3'
	},{
		name: "SPMM Hospital",
		lat: 11.661240,
		lng: 78.19201,
		venue_id: '78d2b4592d86aa09978322c0'
	},{
		name: "Dharan Hospital",
		lat: 11.624919,
		lng: 78.145683,
		venue_id: '4f0f2da566gfgfd0de447b3b'
	},{
		name: "Sri Gokulam Speciality Hospital",
		lat: 11.679071,
		lng: 78.127401,
		venue_id: 's240e4b0a9b8ghrgbc756c9d'
	}
	];

	//Set the home location coordinates to initialize the map here
	self.home = [11.664325,78.146011];

	//Create an empty array to store a list of map markers
	self.markers = [];

	self.infoWindows = [];


}

var model = new Model();

function ViewModel() {

    var self = this;

    //Variables to hold Foursquare API tokens
    var CLIENT_ID = "23ZBVKL12XL44XDMPUJZFHNY2ZHSQTNGCMOAFJ0HTHC1EG3S";
    var CLIENT_SECRET = "E3PEPIVQ4TAE00V5CGRGB3PEO2CS5TMH4YM14EKJN4L5BALN";

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
