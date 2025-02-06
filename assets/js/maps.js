function initMap() {
    const location = { lat: 41.042165, lng: 29.009259 }; // Bahçeşehir University coordinates

    const map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 15,  // Adjust zoom level
        mapTypeId: "roadmap", // Use "hybrid", "satellite", "terrain", etc.
        styles: [
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#aadaff" }] // Custom blue water
            },
            {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [{ color: "#f0f0f0" }] // Light grey background
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }] // White roads
            }
        ]
    });

    new google.maps.Marker({
        position: location,
        map: map,
        title: "Bahçeşehir University"
    });
}
