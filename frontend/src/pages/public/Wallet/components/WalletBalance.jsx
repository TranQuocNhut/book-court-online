import React, { useEffect, useState } from 'react'
import { walletApi } from '../../../../api/walletApi'
import { FiCreditCard } from 'react-icons/fi'
import '../Wallet.css'

export default function WalletBalance() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      setLoading(true)
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
    <div className="wallet-balance-card">
      <div className="balance-icon">
        <FiCreditCard size={32} />
      </div>
      <div className="balance-info">
        <h3>Số dư ví</h3>
        {loading ? (
          <p className="balance-amount loading">Đang tải...</p>
        ) : (
          <p className="balance-amount">{formatCurrency(balance)}</p>
        )}
      </div>
    </div>
  )
}

