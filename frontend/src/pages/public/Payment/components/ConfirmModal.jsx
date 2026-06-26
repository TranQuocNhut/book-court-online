import React from 'react'
import { FiX, FiInfo } from 'react-icons/fi'
import { paymentMethods } from '../constants'
import { getMethodIcon } from '../utils/getMethodIcon'
import '../../../../styles/Payment.css'

export default function ConfirmModal({
  show,
  selectedMethod,
  bookingData,
  isProcessing,
  onClose,
  onConfirm
}) {
  if (!show) return null

  const method = paymentMethods.find(m => m.id === selectedMethod)

  return (
    <div 
      className="modal-overlay" 
      onClick={() => !isProcessing && onClose()}
    >
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Xác nhận thanh toán</h3>
          <button 
            className="close-btn"
            onClick={onClose}
            disabled={isProcessing}
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="confirm-icon">
            {method && getMethodIcon(method)}
          </div>
          <h4>{method?.name}</h4>
          
          <div className="confirm-details">
            <div className="confirm-row">
              <span>Sân:</span>
              <strong>{bookingData.venueName}</strong>
            </div>
            <div className="confirm-row">
              <span>Ngày giờ:</span>
              <strong>{bookingData.date} - {bookingData.time}</strong>
            </div>
            <div className="confirm-row total-row">
              <span>Tổng tiền:</span>
              <strong className="total-price">
                {bookingData.total.toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </div>

          {selectedMethod === 'cash' && (
            <div className="cash-reminder">
              <FiInfo size={20} />
              <p>
                Bạn sẽ thanh toán <strong>
                  {bookingData.total.toLocaleString('vi-VN')} đ
                </strong> trực tiếp tại sân
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Hủy
          </button>
          <button 
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Đang xử lý...
              </>
            ) : (
              'Xác nhận'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

