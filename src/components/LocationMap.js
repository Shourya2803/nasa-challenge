import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#ff6b35"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `),
  iconUrl: 'data:image/svg+xml;base64=' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#ff6b35"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `),
  shadowUrl: null,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AnimatedMarker = ({ position }) => {
  const markerRef = useRef();
  const map = useMap();

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      const newLatLng = L.latLng(position[0], position[1]);
      
      // Animate marker movement
      const currentLatLng = marker.getLatLng();
      const steps = 30;
      const latStep = (newLatLng.lat - currentLatLng.lat) / steps;
      const lngStep = (newLatLng.lng - currentLatLng.lng) / steps;
      
      let step = 0;
      const animate = () => {
        if (step < steps) {
          const lat = currentLatLng.lat + (latStep * step);
          const lng = currentLatLng.lng + (lngStep * step);
          marker.setLatLng([lat, lng]);
          step++;
          requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      // Pan map to new location
      map.panTo(newLatLng, { duration: 1 });
    }
  }, [position, map]);

  return <Marker ref={markerRef} position={position} />;
};

const LocationMap = ({ lat, lon, onLocationSelect }) => {
  const position = [parseFloat(lat), parseFloat(lon)];

  return (
    <div style={{
      width: '100%',
      height: '300px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid rgba(255, 107, 53, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <MapContainer 
        center={position} 
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <AnimatedMarker position={position} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
