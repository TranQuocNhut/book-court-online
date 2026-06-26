import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiArrowLeft } from 'react-icons/fi'
import { walletApi } from '../../../api/walletApi'
import './Wallet.css'

export default function WalletSuccess() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const result = await walletApi.getBalance()
      if (result.success) {
        setBalance(result.data.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, #10b981, #059669)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}>
            <FiCheckCircle size={48} color="white" />
          </div>

          <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#1f2937' }}>
            Nạp tiền thành công!
          </h1>

          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
            Tiền đã được nạp vào ví của bạn
          </p>

          {!loading && balance !== null && (
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Số dư hiện tại
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#0ea5e9', margin: 0 }}>
                {formatCurrency(balance)}
              </p>
            </div>
          )}

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
              Nạp thêm tiền
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

