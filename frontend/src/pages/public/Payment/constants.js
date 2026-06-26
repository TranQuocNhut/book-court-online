export const paymentMethods = [
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
    id: 'wallet',
    name: 'Ví tiền',
    description: 'Thanh toán bằng số dư trong ví',
    iconType: 'image',
    iconSrc: '/pngtree-vector-wallet-icon-png-image_4869029.jpg',
    iconAlt: 'Ví tiền',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
  },
  {
    id: 'cash',
    name: 'Tiền mặt',
    description: 'Thanh toán trực tiếp tại sân',
    iconType: 'icon',
    iconComponent: 'FiDollarSign',
    iconSize: 28,
    iconColor: '#22c55e',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)'
  }
]

export const defaultBookingData = {
  venueName: 'Sân bóng đá ABC',
  sport: 'Bóng đá',
  courtNumber: 'Sân số 1',
  fieldType: 'Bóng đá mini',
  date: '25/01/2024',
  time: '18:00 - 20:00',
  slots: [
    { time: '18:00', nextTime: '19:00', price: 250000 },
    { time: '19:00', nextTime: '20:00', price: 250000 }
  ],
  duration: 2,
  pricePerHour: 250000,
  subtotal: 500000,
  serviceFee: 0,
  discount: 0,
  total: 500000
}

export const timeSlotPrices = [
  { time: '06:00', price: 150000 }, { time: '07:00', price: 180000 },
  { time: '08:00', price: 200000 }, { time: '09:00', price: 200000 },
  { time: '10:00', price: 200000 }, { time: '11:00', price: 200000 },
  { time: '12:00', price: 200000 }, { time: '13:00', price: 200000 },
  { time: '14:00', price: 200000 }, { time: '15:00', price: 200000 },
  { time: '16:00', price: 200000 }, { time: '17:00', price: 220000 },
  { time: '18:00', price: 250000 }, { time: '19:00', price: 250000 },
  { time: '20:00', price: 220000 }, { time: '21:00', price: 200000 },
  { time: '22:00', price: 180000 }
]

