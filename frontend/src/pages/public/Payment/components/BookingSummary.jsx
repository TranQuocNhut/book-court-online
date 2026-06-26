import React from 'react'
import { 
  FiMapPin, 
  FiCalendar, 
  FiClock, 
  FiActivity,
  FiShield
} from 'react-icons/fi'
import '../../../../styles/Payment.css'

export default function BookingSummary({ bookingData }) {
  return (
    <div className="payment-sidebar">
      <div className="booking-summary-card">
        <h3>Thông tin đặt sân</h3>
        
        <div className="summary-section">
          <div className="venue-header">
            <div className="venue-icon">
              <FiMapPin size={32} />
            </div>
            <div>
              <h4>{bookingData.venueName}</h4>
              <p className="sport-type">{bookingData.sport}</p>
            </div>
          </div>
        </div>

        <div className="summary-divider"></div>

        <div className="summary-section">
          <h4 className="price-title">Thông tin đặt chỗ</h4>
          
          {bookingData.courtNumber && (
            <div className="summary-row">
              <span className="label">
                <FiMapPin size={16} style={{ marginRight: '8px' }} />
                Sân:
              </span>
              <span className="value">{bookingData.courtNumber}</span>
            </div>
          )}

          {bookingData.fieldType && (
            <div className="summary-row">
              <span className="label">
                <FiActivity size={16} style={{ marginRight: '8px' }} />
                Loại sân:
              </span>
              <span className="value">{bookingData.fieldType}</span>
            </div>
          )}
          
          <div className="summary-row">
            <span className="label">
              <FiCalendar size={16} style={{ marginRight: '8px' }} />
              Ngày đặt:
            </span>
            <span className="value">{bookingData.date}</span>
          </div>
          
          {bookingData.slots && bookingData.slots.length > 0 && (
            <>
              {bookingData.slots.map((slot, index) => (
                <div 
                  key={index}
                  className="summary-row"
                  style={{ 
                    backgroundColor: '#f0f9ff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px'
                  }}
                >
                  <span className="label">
                    <FiClock size={16} style={{ marginRight: '8px', color: '#0ea5e9' }} />
                    {slot.time} - {slot.nextTime}:
                  </span>
                  <span className="value" style={{ fontWeight: '600', color: '#0ea5e9' }}>
                    {slot.price.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </>
          )}
          
          <div className="summary-row">
            <span className="label">⏱️ Thời lượng:</span>
            <span className="value">{bookingData.duration} giờ</span>
          </div>
        </div>

        <div className="summary-divider"></div>

        <div className="summary-section">
          <h4 className="price-title">Chi tiết giá</h4>
          <div className="summary-row">
            <span className="label">Giá thuê sân</span>
            <span className="value">
              {bookingData.pricePerHour.toLocaleString('vi-VN')} đ × {bookingData.duration}
            </span>
          </div>
          <div className="summary-row">
            <span className="label">Tạm tính</span>
            <span className="value">{bookingData.subtotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="summary-row">
            <span className="label">Phí dịch vụ</span>
            <span className="value">{bookingData.serviceFee.toLocaleString('vi-VN')} đ</span>
          </div>
          {bookingData.discount > 0 && (
            <div className="summary-row discount">
              <span className="label">Giảm giá</span>
              <span className="value">-{bookingData.discount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
        </div>

        <div className="summary-divider"></div>

        <div className="summary-total">
          <span className="label">Tổng cộng</span>
          <span className="value">{bookingData.total.toLocaleString('vi-VN')} đ</span>
        </div>

        <div className="security-badge">
          <FiShield className="badge-icon" size={24} />
          <div>
            <strong>Thanh toán an toàn</strong>
            <p>Thông tin được mã hóa SSL</p>
          </div>
        </div>
      </div>
    </div>
  )
}

