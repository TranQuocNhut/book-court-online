import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import './ChatButton.css';

const CourtCard = ({ court, userLocation = null }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (court.facility?.id) {
      navigate(`/booking?venue=${court.facility.id}&court=${court.id}`);
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
  if (userLocation && court.facility?.location) {
    distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      court.facility.location.lat,
      court.facility.location.lng
    );
  }

  return (
    <div className="chat-facility-card" onClick={handleClick}>
      <div className="chat-facility-content">
        <h4 className="chat-facility-name">{court.name}</h4>
        {court.type && (
          <div className="chat-facility-types">
            <span className="chat-facility-type-tag">{court.type}</span>
          </div>
        )}
        {court.facility?.name && (
          <div className="chat-facility-info">
            <FiMapPin size={14} />
            <span>{court.facility.name}</span>
          </div>
        )}
        {court.facility?.address && (
          <div className="chat-facility-info" style={{ fontSize: '12px', color: '#6b7280' }}>
            <span>{court.facility.address}</span>
          </div>
        )}
        <div className="chat-facility-footer">
          {court.price && (
            <div className="chat-facility-price">
              <span>{court.price.toLocaleString('vi-VN')} VND/giờ</span>
            </div>
          )}
          {distance && (
            <div className="chat-facility-distance">
              <span>{distance}</span>
            </div>
          )}
        </div>
        {court.capacity && (
          <div className="chat-facility-info" style={{ fontSize: '12px', color: '#6b7280' }}>
            <span>Sức chứa: {court.capacity} người</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtCard;

