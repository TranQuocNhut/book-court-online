import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { walletApi } from '../../../api/walletApi'
import { MIN_AMOUNT } from './constants'
import AmountSelector from './components/AmountSelector'
import TransactionHistory from './components/TransactionHistory'
import './Wallet.css'

export default function Wallet() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState(0)
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (amount < MIN_AMOUNT) {
      toast.error(`Số tiền tối thiểu là ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(MIN_AMOUNT)}`)
      return
    }

    try {
      setIsProcessing(true)
      
      // Gọi API để tạo payment link với PayOS
      const result = await walletApi.initTopUp({
        amount,
        method: 'payos' // Chỉ dùng PayOS
      })

      if (result.success && result.data.paymentUrl) {
        // Redirect đến trang thanh toán
        window.location.href = result.data.paymentUrl
      } else {
        toast.error(result.message || 'Không thể tạo link thanh toán')
      }
    } catch (error) {
      console.error('Error initiating top-up:', error)
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi nạp tiền. Vui lòng thử lại.'
      
      if (error.status === 0) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.'
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <div className="wallet-header">
          <h1>Nạp tiền vào ví</h1>
          <p>Nạp tiền vào ví để thanh toán nhanh chóng và tiện lợi</p>
        </div>

        <div className="wallet-wrapper">
          {/* Main Content */}
          <div className="wallet-main">
            {/* Top-up Form */}
            <form onSubmit={handleSubmit} className="top-up-form">
              <div className="form-section">
                <h3>Nạp tiền vào ví</h3>
                <p className="form-description">Thanh toán qua PayOS - An toàn và nhanh chóng</p>
              </div>

              {/* Amount Selector */}
              <AmountSelector
                amount={amount}
                onAmountChange={setAmount}
                customAmount={customAmount}
                onCustomAmountChange={setCustomAmount}
              />

              {/* Submit Button */}
              <div className="wallet-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isProcessing || amount < MIN_AMOUNT}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Nạp tiền qua PayOS'}
                </button>
              </div>
            </form>

            {/* Transaction History */}
            <TransactionHistory />
          </div>

          {/* Sidebar */}
          <div className="wallet-sidebar">
            {/* Info Card */}
            <div className="info-card">
              <h3>Thông tin nạp tiền</h3>
              <ul>
                <li>Số tiền nạp tối thiểu: 10,000 VNĐ</li>
                <li>Số tiền nạp tối đa: 10,000,000 VNĐ</li>
                <li>Thanh toán qua PayOS - An toàn và bảo mật</li>
                <li>Tiền nạp vào ví sẽ được cộng ngay sau khi thanh toán thành công</li>
                <li>Bạn có thể sử dụng số dư ví để thanh toán các đơn đặt sân</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

