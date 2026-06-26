import { CheckCircle, Clock, AlertCircle, Info } from 'lucide-react'

export const mockNotifications = [
  {
    id: 1,
    type: 'booking',
    title: 'Đặt sân thành công',
    message: 'Bạn đã đặt sân bóng đá Thành Công thành công cho ngày 15/01/2025',
    time: '2 phút trước',
    isRead: false,
    icon: CheckCircle,
    iconColor: '#10b981'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Thanh toán hoàn tất',
    message: 'Thanh toán cho đặt sân đã được xử lý thành công',
    time: '1 giờ trước',
    isRead: false,
    icon: CheckCircle,
    iconColor: '#10b981'
  },
  {
    id: 3,
    type: 'reminder',
    title: 'Nhắc nhở đặt sân',
    message: 'Bạn có lịch đặt sân vào ngày mai lúc 18:00',
    time: '3 giờ trước',
    isRead: true,
    icon: Clock,
    iconColor: '#f59e0b'
  },
  {
    id: 4,
    type: 'promotion',
    title: 'Khuyến mãi mới',
    message: 'Giảm 20% cho tất cả đặt sân cuối tuần này',
    time: '1 ngày trước',
    isRead: true,
    icon: Info,
    iconColor: '#3b82f6'
  },
  {
    id: 5,
    type: 'cancellation',
    title: 'Hủy đặt sân',
    message: 'Đặt sân ngày 10/01/2025 đã được hủy do thời tiết',
    time: '2 ngày trước',
    isRead: true,
    icon: AlertCircle,
    iconColor: '#ef4444'
  }
]
