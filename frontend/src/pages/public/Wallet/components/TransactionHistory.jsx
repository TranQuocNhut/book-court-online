import React, { useEffect, useState } from 'react'
import { walletApi } from '../../../../api/walletApi'
import { FiArrowDownCircle, FiArrowUpCircle, FiRefreshCw, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import '../Wallet.css'

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTransactions()
  }, [page])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const result = await walletApi.getHistory({
        page,
        limit: 10
      })
      
      console.log('Transaction History API Response:', result)
      
      if (result.success) {
        // Kiểm tra cấu trúc data
        if (result.data && result.data.transactions) {
          setTransactions(result.data.transactions || [])
          setTotalPages(result.data.pagination?.pages || 1)
        } else if (Array.isArray(result.data)) {
          // Fallback: nếu data là array trực tiếp
          setTransactions(result.data || [])
          setTotalPages(1)
        } else {
          console.warn('Unexpected data structure:', result.data)
          setTransactions([])
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
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

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type, status) => {
    if (status === 'failed') {
      return <FiXCircle size={20} color="#ef4444" />
    }
    if (status === 'pending') {
      return <FiClock size={20} color="#f59e0b" />
    }
    if (type === 'top-up' || type === 'refund') {
      return <FiArrowDownCircle size={20} color="#10b981" />
    }
    return <FiArrowUpCircle size={20} color="#3b82f6" />
  }

  const getTransactionLabel = (type) => {
    const labels = {
      'top-up': 'Nạp tiền',
      'payment': 'Thanh toán',
      'refund': 'Hoàn tiền',
      'adjustment': 'Điều chỉnh'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status) => {
    const badges = {
      'success': { text: 'Thành công', color: '#10b981', bg: '#d1fae5' },
      'pending': { text: 'Đang xử lý', color: '#f59e0b', bg: '#fef3c7' },
      'failed': { text: 'Thất bại', color: '#ef4444', bg: '#fee2e2' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: badge.color,
        background: badge.bg
      }}>
        {badge.text}
      </span>
    )
  }

  return (
    <div className="transaction-history">
      <div className="transaction-history-header">
        <h3>Lịch sử giao dịch</h3>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="refresh-btn"
          title="Làm mới"
        >
          <FiRefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="transaction-loading">
          <p>Đang tải...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="transaction-empty">
          <p>Chưa có giao dịch nào</p>
        </div>
      ) : (
        <>
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <div key={transaction._id || transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  {getTransactionIcon(transaction.type, transaction.status)}
                </div>
                <div className="transaction-info">
                  <div className="transaction-main">
                    <span className="transaction-type">{getTransactionLabel(transaction.type)}</span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <div className="transaction-meta">
                    <span className="transaction-date">{formatDate(transaction.createdAt)}</span>
                    {transaction.metadata?.transactionCode && (
                      <span className="transaction-code">
                        Mã: {transaction.metadata.transactionCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="transaction-amount">
                  <span className={`amount ${transaction.type === 'top-up' || transaction.type === 'refund' ? 'positive' : 'negative'}`}>
                    {transaction.type === 'top-up' || transaction.type === 'refund' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="transaction-pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="pagination-btn"
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

