import React from 'react';
import useMobile from '../../hook/use-mobile';
import './MapDisplay.css';

const MapDisplay = ({ venueData }) => {
  const isMobile = useMobile(768);
  const isSmallMobile = useMobile(480);
  
  // Function to generate Google Maps embed URL
  const getGoogleMapsEmbedUrl = (address) => {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);
    // Return Google Maps embed URL using simple iframe method
    return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  if (!venueData || !venueData.address) {
    return (
      <div className="map-display-simple">
        <div className="map-placeholder">
          <p>Không có thông tin địa chỉ</p>
        </div>
      </div>
    );
  }

  const mapHeight = isSmallMobile ? 160 : isMobile ? 180 : 300;

  return (
    <div className="map-display-simple">
      <iframe
        src={getGoogleMapsEmbedUrl(venueData.address)}
        width="100%"
        height={mapHeight}
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Bản đồ ${venueData.name}`}
      />
    </div>
  );
};

export default MapDisplay;
