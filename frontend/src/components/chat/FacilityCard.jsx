import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone } from 'react-icons/fi';
import './ChatButton.css';

const FacilityCard = ({ facility, userLocation = null }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (facility.id) {
      navigate(`/booking?venue=${facility.id}`);
    }
  };

  // Calculate distance if both locations available
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  let distance = null;
  if (userLocation && facility.location) {
    distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      facility.location.lat,
      facility.location.lng
    );
  }

  return (
    <div className="chat-facility-card" onClick={handleClick}>
      {facility.images && facility.images.length > 0 && (
        <div className="chat-facility-image">
          <img src={facility.images[0].url} alt={facility.name} />
        </div>
      )}
      <div className="chat-facility-content">
        <h4 className="chat-facility-name">{facility.name}</h4>
        {facility.address && (
          <div className="chat-facility-info">
            <FiMapPin size={14} />
            <span>{facility.address}</span>
          </div>
        )}
        {facility.types && facility.types.length > 0 && (
          <div className="chat-facility-types">
            {facility.types.slice(0, 3).map((type, idx) => (
              <span key={idx} className="chat-facility-type-tag">
                {type}
              </span>
            ))}
          </div>
        )}
        <div className="chat-facility-footer">
          {facility.pricePerHour && (
            <div className="chat-facility-price">
              <span>{facility.pricePerHour.toLocaleString('vi-VN')} VND/giờ</span>
            </div>
          )}
          {distance && (
            <div className="chat-facility-distance">
              <span>{distance}</span>
            </div>
          )}
        </div>
        {facility.phoneNumber && (
          <div className="chat-facility-phone">
            <FiPhone size={12} />
            <span>{facility.phoneNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityCard;

