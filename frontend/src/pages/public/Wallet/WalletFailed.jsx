import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiXCircle, FiArrowLeft } from 'react-icons/fi'
import './Wallet.css'

export default function WalletFailed() {
  const navigate = useNavigate()

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
          }}>
            <FiXCircle size={48} color="white" />
          </div>

          <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#1f2937' }}>
            Nạp tiền thất bại
          </h1>

          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
            Giao dịch nạp tiền không thành công. Vui lòng thử lại.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/wallet')}
              style={{
                padding: '12px 24px',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiArrowLeft size={20} />
              Thử lại
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

