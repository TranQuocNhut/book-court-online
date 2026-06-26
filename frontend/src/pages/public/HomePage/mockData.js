export const venues = [
  {
    id: 1,
    name: 'Truong Football',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    rating: 4.5,
    price: '200,000 VNĐ/giờ',
    operatingHours: '06:00 - 22:00',
    image: 'venue1.jpg',
    facilities: ['Bóng đá', 'Ánh sáng', 'Thay đồ', 'Nước uống']
  },
  {
    id: 2,
    name: 'Sân Bóng Đá Minh Khai',
    address: '456 Đường Minh Khai, Quận 3, TP.HCM',
    rating: 4.2,
    price: '180,000 VNĐ/giờ',
    operatingHours: '05:00 - 23:00',
    image: 'venue2.jpg',
    facilities: ['Bóng đá', 'Bãi đỗ xe', 'Wifi', 'Quán ăn']
  },
  {
    id: 3,
    name: 'Trung Tâm Thể Thao Quận 7',
    address: '789 Đường Nguyễn Thị Thập, Quận 7, TP.HCM',
    rating: 4.7,
    price: '250,000 VNĐ/giờ',
    operatingHours: '06:00 - 22:00',
    image: 'venue3.jpg',
    facilities: ['Bóng đá', 'Hệ thống tưới', 'Camera', 'Bảo vệ 24/7']
  },
  {
    id: 4,
    name: 'Sân Bóng Đá Gò Vấp',
    address: '321 Đường Quang Trung, Gò Vấp, TP.HCM',
    rating: 4.0,
    price: '150,000 VNĐ/giờ',
    operatingHours: '05:30 - 22:30',
    image: 'venue4.jpg',
    facilities: ['Bóng đá', 'Ánh sáng', 'Thay đồ', 'Nước uống']
  },
  {
    id: 5,
    name: 'Sân Bóng Đá Tân Bình',
    address: '654 Đường Cộng Hòa, Tân Bình, TP.HCM',
    rating: 4.3,
    price: '220,000 VNĐ/giờ',
    operatingHours: '06:00 - 22:00',
    image: 'venue5.jpg',
    facilities: ['Bóng đá', 'Bãi đỗ xe', 'Wifi', 'Quán ăn']
  },
  {
    id: 6,
    name: 'Trung Tâm Thể Thao Bình Thạnh',
    address: '987 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
    rating: 4.6,
    price: '230,000 VNĐ/giờ',
    operatingHours: '05:00 - 23:00',
    image: 'venue6.jpg',
    facilities: ['Bóng đá', 'Hệ thống tưới', 'Camera', 'Bảo vệ 24/7']
  },
  {
    id: 7,
    name: 'Sân Bóng Đá Phú Nhuận',
    address: '147 Đường Phan Đình Phùng, Phú Nhuận, TP.HCM',
    rating: 4.1,
    price: '190,000 VNĐ/giờ',
    operatingHours: '06:00 - 22:00',
    image: 'venue7.jpg',
    facilities: ['Bóng đá', 'Ánh sáng', 'Thay đồ', 'Nước uống']
  },
  {
    id: 8,
    name: 'Sân Bóng Đá Thủ Đức',
    address: '258 Đường Võ Văn Ngân, Thủ Đức, TP.HCM',
    rating: 4.4,
    price: '210,000 VNĐ/giờ',
    operatingHours: '05:30 - 22:30',
    image: 'venue8.jpg',
    facilities: ['Bóng đá', 'Bãi đỗ xe', 'Wifi', 'Quán ăn']
  }
]

export const getVenueImage = (venueId) => {
  const images = [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=200&fit=crop&crop=center'
  ]
  return images[(venueId - 1) % images.length]
}

