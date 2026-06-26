import React from 'react'
import { FiCheck } from 'react-icons/fi'
import { paymentMethods } from '../constants'
import { getMethodIcon } from '../utils/getMethodIcon'
import '../../../../styles/Payment.css'

export default function PaymentMethods({ selectedMethod, onMethodSelect, walletBalance, totalAmount, methods }) {
  // Sử dụng methods từ prop nếu có, nếu không thì dùng paymentMethods từ constants
  const availableMethods = methods || paymentMethods
  
  const isWalletSelected = selectedMethod === 'wallet'
  const hasEnoughBalance = walletBalance !== null && walletBalance >= (totalAmount || 0)

  return (
    <div className="payment-methods">
      <h3>Phương thức thanh toán</h3>
      
      {/* Wallet Balance Info */}
      {isWalletSelected && walletBalance !== null && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: hasEnoughBalance ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${hasEnoughBalance ? '#22c55e' : '#ef4444'}`,
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>Số dư ví:</span>
            <span style={{ 
              fontWeight: '700', 
              color: hasEnoughBalance ? '#22c55e' : '#ef4444',
              fontSize: '16px'
            }}>
              {walletBalance.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#6b7280' }}>Số tiền cần thanh toán:</span>
            <span style={{ fontWeight: '600', color: '#1f2937' }}>
              {(totalAmount || 0).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          {!hasEnoughBalance && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#fee2e2',
              borderRadius: '4px',
              color: '#dc2626',
              fontSize: '13px'
            }}>
              ⚠️ Số dư không đủ. Vui lòng nạp thêm {(totalAmount - walletBalance).toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>
      )}

      <div className="methods-grid">
        {availableMethods.map(method => (
          <div
            key={method.id}
            className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => onMethodSelect(method.id)}
          >
            <div className="method-radio">
              <div className="radio-outer">
                {selectedMethod === method.id && <div className="radio-inner" />}
              </div>
            </div>
            
            <div 
              className="method-icon"
              style={{ 
                background: method.id === 'cash' ? '#ffffff' : method.gradient,
                border: method.id === 'cash' ? '2px solid #e5e7eb' : 'none',
                boxShadow: method.id === 'cash' ? 'none' : undefined
              }}
            >
              {getMethodIcon(method)}
            </div>
            
            <div className="method-info">
              <h4>{method.name}</h4>
              <p>{method.description}</p>
            </div>

            {selectedMethod === method.id && (
              <div className="method-badge">
                <FiCheck size={16} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

