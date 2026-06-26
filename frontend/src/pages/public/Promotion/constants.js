import { Gift, Clock, Star, TrendingUp } from 'lucide-react'

export const promotions = [
  {
    id: 1,
    title: 'Giảm 50% đặt sân đầu tiên',
    description: 'Ưu đãi đặc biệt dành cho thành viên mới',
    discount: '50%',
    icon: Gift,
    color: '#3b82f6',
    image: '/pngtree-sports-poster-background.jpg',
    validUntil: '33 ngày 13 giờ',
    code: 'FIRST50',
    usage: { current: 342, total: 1000 },
    features: ['Áp dụng cho khách hàng mới', 'Giảm tối đa 200,000₫'],
    badges: ['HOT', 'MỚI']
  },
  {
    id: 2,
    title: 'Giảm 30% đặt sân cuối tuần',
    description: 'Đặt sân vào thứ 7, Chủ nhật và nhận giảm giá',
    discount: '30%',
    icon: Clock,
    color: '#ef4444',
    image: '/sports-meeting.webp',
    validUntil: '28 ngày 5 giờ',
    code: 'WEEKEND30',
    usage: { current: 156, total: 500 },
    features: ['Áp dụng cho cuối tuần', 'Tối đa 3 giờ/sân'],
    badges: ['HOT']
  },
  {
    id: 3,
    title: 'Tặng 1 giờ chơi miễn phí',
    description: 'Đặt sân 3 giờ được tặng thêm 1 giờ',
    discount: '1h',
    icon: Star,
    color: '#f59e0b',
    image: '/all-sports-banner.webp',
    validUntil: '45 ngày 22 giờ',
    code: 'FREE1H',
    usage: { current: 89, total: 200 },
    features: ['Áp dụng cho đơn từ 3 giờ', 'Chỉ áp dụng giờ off-peak'],
    badges: ['MỚI']
  },
  {
    id: 4,
    title: 'Member VIP - Giảm 20% mãi mãi',
    description: 'Đăng ký thành viên VIP cho giảm giá trọn đời',
    discount: '20%',
    icon: TrendingUp,
    color: '#8b5cf6',
    image: '/sports-meeting.webp',
    validUntil: 'Mãi mãi',
    code: 'VIP20',
    usage: { current: 523, total: 1000 },
    features: ['Phí đăng ký: 500.000đ', 'Giảm 20% mọi đơn hàng'],
    badges: []
  }
]

