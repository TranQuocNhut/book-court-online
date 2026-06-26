import React from 'react'
import { FiCheck, FiCreditCard } from 'react-icons/fi'
import { walletPaymentMethods } from '../constants'
import '../Wallet.css'

export default function PaymentMethods({ selectedMethod, onMethodSelect }) {
  const getMethodIcon = (method) => {
    if (method.iconType === 'image') {
      return (
        <img 
          src={method.iconSrc} 
          alt={method.iconAlt} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )
    } else if (method.iconComponent === 'FiCreditCard') {
      return <FiCreditCard size={method.iconSize || 28} color={method.iconColor || '#6366f1'} />
    }
    return null
  }

  return (
    <div className="payment-methods">
      <h3>Phương thức thanh toán</h3>
      <div className="methods-grid">
        {walletPaymentMethods.map(method => (
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
                background: method.gradient,
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

