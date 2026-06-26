import React from 'react'
import { suggestedAmounts, MIN_AMOUNT, MAX_AMOUNT } from '../constants'
import '../Wallet.css'

export default function AmountSelector({ amount, onAmountChange, customAmount, onCustomAmountChange }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Chỉ cho phép số
    if (value === '') {
      onCustomAmountChange('')
      return
    }
    const numValue = parseInt(value)
    if (numValue >= MIN_AMOUNT && numValue <= MAX_AMOUNT) {
      onCustomAmountChange(value)
      onAmountChange(numValue)
    } else if (numValue < MIN_AMOUNT) {
      onCustomAmountChange(value)
    }
  }

  return (
    <div className="amount-selector">
      <h3>Chọn số tiền nạp</h3>
      
      {/* Các mức tiền đề xuất */}
      <div className="suggested-amounts">
        {suggestedAmounts.map((suggestedAmount) => (
          <button
            key={suggestedAmount}
            type="button"
            className={`amount-btn ${amount === suggestedAmount ? 'active' : ''}`}
            onClick={() => {
              onAmountChange(suggestedAmount)
              onCustomAmountChange('')
            }}
          >
            {formatCurrency(suggestedAmount)}
          </button>
        ))}
      </div>

      {/* Nhập số tiền tùy chỉnh */}
      <div className="custom-amount">
        <label htmlFor="customAmount">Hoặc nhập số tiền khác</label>
        <div className="custom-amount-input-wrapper">
          <input
            id="customAmount"
            type="text"
            placeholder="Nhập số tiền (tối thiểu 10,000 VNĐ)"
            value={customAmount}
            onChange={handleCustomAmountChange}
            className="custom-amount-input"
          />
          <span className="currency-label">VNĐ</span>
        </div>
        {customAmount && parseInt(customAmount) < MIN_AMOUNT && (
          <p className="error-message">
            Số tiền tối thiểu là {formatCurrency(MIN_AMOUNT)}
          </p>
        )}
        {customAmount && parseInt(customAmount) > MAX_AMOUNT && (
          <p className="error-message">
            Số tiền tối đa là {formatCurrency(MAX_AMOUNT)}
          </p>
        )}
      </div>

      {/* Hiển thị số tiền đã chọn */}
      {amount > 0 && (
        <div className="selected-amount-display">
          <span className="label">Số tiền nạp:</span>
          <span className="amount">{formatCurrency(amount)}</span>
        </div>
      )}
    </div>
  )
}

