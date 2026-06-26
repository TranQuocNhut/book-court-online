// Mock data for ProfilePage
export const mockUserData = {
  name: 'Nguyễn Văn An',
  email: 'nguyenvanan@email.com',
  phone: '0901 234 567',
  location: 'TP. Hồ Chí Minh',
  avatar: null,
  joinDate: '2025-04-01',
  totalBookings: 48,
  points: 1250,
  isVIP: true
}

export const mockFavoriteVenues = [
  {
    id: 1,
    name: 'Sân bóng đá Thành Công',
    address: 'Quận 1, TP. HCM',
    sport: 'Bóng đá',
    bookingCount: 12
  },
  {
    id: 2,
    name: 'Sân tennis Vạn Phúc',
    address: 'Quận Tân Bình, TP. HCM',
    sport: 'Tennis',
    bookingCount: 8
  },
  {
    id: 3,
    name: 'Sân cầu lông Ngọc Khánh',
    address: 'Quận 5, TP. HCM',
    sport: 'Cầu lông',
    bookingCount: 15
  }
]

export const mockBookingHistory = [
  {
    id: 1,
    venue: 'Sân bóng đá ABC',
    sport: 'Bóng đá',
    date: '2024-01-20',
    time: '18:00 - 20:00',
    status: 'completed',
    price: '200,000 VNĐ',
    location: '123 Nguyễn Huệ, Quận 1, TP. HCM',
    paymentMethod: 'MoMo',
    imageUrl: '/all-sports-banner.webp'
  },
  {
    id: 2,
    venue: 'Trung tâm cầu lông XYZ',
    sport: 'Cầu lông',
    date: '2024-01-18',
    time: '19:00 - 21:00',
    status: 'completed',
    price: '150,000 VNĐ',
    location: '45 Lê Lợi, Quận 1, TP. HCM',
    paymentMethod: 'VNPAY',
    imageUrl: '/sports-meeting.webp'
  },
  {
    id: 3,
    venue: 'Sân tennis DEF',
    sport: 'Tennis',
    date: '2024-01-25',
    time: '16:00 - 18:00',
    status: 'upcoming',
    price: '300,000 VNĐ',
    location: '10 Trường Chinh, Quận Tân Bình, TP. HCM',
    paymentMethod: 'Tiền mặt',
    imageUrl: '/pngtree-sports-poster-background.jpg'
  }
]

export const mockUpcomingBookings = [
  {
    id: 1,
    name: 'Sân tennis Vạn Phúc',
    date: '25/10/2025',
    time: '07:00 - 09:00',
    price: '250.000 VNĐ'
  },
  {
    id: 2,
    name: 'Sân futsal Bình Tân',
    date: '28/10/2025',
    time: '19:00 - 21:00',
    price: '280.000 VNĐ'
  }
]

export const mockAchievements = [
  {
    id: 1,
    title: 'Người mới',
    description: 'Đặt sân lần đầu',
    isUnlocked: true
  },
  {
    id: 2,
    title: 'Người chơi thường xuyên',
    description: 'Đặt 10 lần',
    isUnlocked: true
  },
  {
    id: 3,
    title: 'VIP',
    description: 'Đặt 50 lần',
    isUnlocked: false
  },
  {
    id: 4,
    title: 'Trung thành',
    description: 'Sử dụng 6 tháng',
    isUnlocked: true
  }
]

