export const walletPaymentMethods = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    iconType: 'image',
    iconSrc: '/MoMo_Logo.png',
    iconAlt: 'MoMo',
    color: '#A50064',
    gradient: 'linear-gradient(135deg, #A50064, #D91C81)'
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    description: 'Thanh toán qua cổng VNPay',
    iconType: 'image',
    iconSrc: '/Vnpay.jpg',
    iconAlt: 'VNPay',
    color: '#0071BA',
    gradient: 'linear-gradient(135deg, #0071BA, #0090E3)'
  },
  {
    id: 'payos',
    name: 'PayOS',
    description: 'Thanh toán qua cổng PayOS',
    iconType: 'icon',
    iconComponent: 'FiCreditCard',
    iconSize: 28,
    iconColor: '#6366f1',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  }
]

// Các mức nạp tiền đề xuất
export const suggestedAmounts = [
  50000,
  100000,
  200000,
  500000,
  1000000,
  2000000
]

// Số tiền tối thiểu và tối đa
export const MIN_AMOUNT = 10000
export const MAX_AMOUNT = 10000000

