// Mock data for Booking page

export const venuesData = [
  {
    id: 1,
    name: 'Sân bóng đá Thành Công',
    address: '123 Nguyễn Huệ, Quận 1, TP. HCM',
    phone: '0376283388',
    rating: 4.8,
    reviewCount: 124,
    price: '200,000 VNĐ/giờ',
    images: ['/sports-meeting.webp', '/all-sports-banner.webp', '/pngtree-sports-poster-background.jpg'],
    facilities: ['Phòng thay đồ', 'Wifi miễn phí', 'Bãi đỗ xe', 'Nước uống', 'Đèn chiếu sáng'],
    description: 'Sân cỏ nhân tạo cao cấp, đầy đủ trang thiết bị, có phòng thay đồ và khu vực đỗ xe rộng rãi.',
    operatingHours: '06:00 - 22:00',
    capacity: '7 người/sân'
  },
  {
    id: 2,
    name: 'Sân Bóng Đá Minh Khai',
    address: '456 Đường Minh Khai, Quận 3, TP.HCM',
    phone: '0376283389',
    rating: 4.2,
    price: '180,000 VNĐ/giờ',
    images: ['/all-sports-banner.webp', '/sports-meeting.webp'],
    facilities: ['Cỏ tự nhiên', 'Bãi đỗ xe', 'Wifi', 'Quán ăn', 'Thay đồ', 'Nước uống'],
    description: 'Sân bóng đá với cỏ tự nhiên chất lượng cao, không gian rộng rãi và thoáng mát. Có quán ăn và dịch vụ tiện ích đầy đủ.',
    operatingHours: '05:00 - 23:00',
    capacity: '8 người/sân'
  },
  {
    id: 3,
    name: 'Trung Tâm Thể Thao Quận 7',
    address: '789 Đường Nguyễn Thị Thập, Quận 7, TP.HCM',
    phone: '0376283390',
    rating: 4.7,
    price: '250,000 VNĐ/giờ',
    images: ['/pngtree-sports-poster-background.jpg', '/sports-meeting.webp'],
    facilities: ['Cỏ nhân tạo', 'Hệ thống tưới', 'Camera', 'Bảo vệ 24/7', 'Thay đồ', 'Nước uống'],
    description: 'Trung tâm thể thao hiện đại với hệ thống cỏ nhân tạo cao cấp, camera giám sát và bảo vệ 24/7. Địa điểm lý tưởng cho các trận đấu chuyên nghiệp.',
    operatingHours: '06:00 - 22:00',
    capacity: '10 người/sân'
  },
  {
    id: 4,
    name: 'Sân Bóng Đá Gò Vấp',
    address: '321 Đường Quang Trung, Gò Vấp, TP.HCM',
    phone: '0376283391',
    rating: 4.0,
    price: '150,000 VNĐ/giờ',
    images: ['venue4.jpg'],
    facilities: ['Cỏ nhân tạo', 'Ánh sáng', 'Thay đồ', 'Nước uống', 'Bãi đỗ xe'],
    description: 'Sân bóng đá giá cả hợp lý với cỏ nhân tạo chất lượng tốt. Phù hợp cho các nhóm bạn và gia đình.',
    operatingHours: '05:30 - 22:30',
    capacity: '7 người/sân'
  },
  {
    id: 5,
    name: 'Sân Bóng Đá Tân Bình',
    address: '654 Đường Cộng Hòa, Tân Bình, TP.HCM',
    phone: '0376283392',
    rating: 4.3,
    price: '220,000 VNĐ/giờ',
    images: ['venue5.jpg'],
    facilities: ['Cỏ tự nhiên', 'Bãi đỗ xe', 'Wifi', 'Quán ăn', 'Thay đồ', 'Nước uống'],
    description: 'Sân bóng đá với cỏ tự nhiên được chăm sóc kỹ lưỡng. Có quán ăn và wifi miễn phí cho khách hàng.',
    operatingHours: '06:00 - 22:00',
    capacity: '8 người/sân'
  },
  {
    id: 6,
    name: 'Trung Tâm Thể Thao Bình Thạnh',
    address: '987 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
    phone: '0376283393',
    rating: 4.6,
    price: '230,000 VNĐ/giờ',
    images: ['venue6.jpg'],
    facilities: ['Cỏ nhân tạo', 'Hệ thống tưới', 'Camera', 'Bảo vệ 24/7', 'Thay đồ', 'Nước uống'],
    description: 'Trung tâm thể thao cao cấp với hệ thống cỏ nhân tạo và tưới nước tự động. An ninh tốt với camera và bảo vệ 24/7.',
    operatingHours: '05:00 - 23:00',
    capacity: '10 người/sân'
  },
  {
    id: 7,
    name: 'Sân Bóng Đá Phú Nhuận',
    address: '147 Đường Phan Đình Phùng, Phú Nhuận, TP.HCM',
    phone: '0376283394',
    rating: 4.1,
    price: '190,000 VNĐ/giờ',
    images: ['venue7.jpg'],
    facilities: ['Cỏ nhân tạo', 'Ánh sáng', 'Thay đồ', 'Nước uống', 'Bãi đỗ xe', 'Wifi'],
    description: 'Sân bóng đá với cỏ nhân tạo và hệ thống ánh sáng hiện đại. Có wifi miễn phí và bãi đỗ xe rộng rãi.',
    operatingHours: '06:00 - 22:00',
    capacity: '7 người/sân'
  },
  {
    id: 8,
    name: 'Sân Bóng Đá Thủ Đức',
    address: '258 Đường Võ Văn Ngân, Thủ Đức, TP.HCM',
    phone: '0376283395',
    rating: 4.4,
    price: '210,000 VNĐ/giờ',
    images: ['venue8.jpg'],
    facilities: ['Cỏ tự nhiên', 'Bãi đỗ xe', 'Wifi', 'Quán ăn', 'Thay đồ', 'Nước uống'],
    description: 'Sân bóng đá với cỏ tự nhiên được chăm sóc tốt. Có quán ăn và các tiện ích đầy đủ cho khách hàng.',
    operatingHours: '05:30 - 22:30',
    capacity: '8 người/sân'
  }
]

export const reviews = [
  {
    id: 1,
    user: 'Nguyễn Văn An',
    rating: 5,
    date: '2025-01-15',
    comment: 'Sân rất đẹp, cỏ nhân tạo chất lượng tốt. Nhân viên phục vụ nhiệt tình, giá cả hợp lý. Sẽ quay lại lần sau!',
    avatar: 'A'
  },
  {
    id: 2,
    user: 'Trần Thị Bình',
    rating: 4,
    date: '2025-01-14',
    comment: 'Sân sạch sẽ, ánh sáng tốt. Chỉ có điều bãi đỗ xe hơi chật vào cuối tuần. Nhìn chung rất hài lòng.',
    avatar: 'B'
  },
  {
    id: 3,
    user: 'Lê Hoàng Minh',
    rating: 5,
    date: '2025-01-13',
    comment: 'Đã chơi ở đây nhiều lần, chất lượng sân ổn định. Có wifi miễn phí, nước uống giá rẻ. Recommend!',
    avatar: 'L'
  },
  {
    id: 4,
    user: 'Phạm Thị Hoa',
    rating: 4,
    date: '2025-01-12',
    comment: 'Sân bóng đẹp, không gian thoáng mát. Chỉ cần cải thiện thêm về dịch vụ thay đồ thì sẽ hoàn hảo.',
    avatar: 'P'
  },
  {
    id: 5,
    user: 'Hoàng Văn Cường',
    rating: 5,
    date: '2025-01-11',
    comment: 'Sân cỏ nhân tạo rất mềm, không bị trượt chân. Hệ thống ánh sáng đầy đủ, chơi ban đêm cũng rất tốt. Giá cả hợp lý.',
    avatar: 'H'
  },
  {
    id: 6,
    user: 'Nguyễn Thị Lan',
    rating: 3,
    date: '2025-01-10',
    comment: 'Sân ổn nhưng nhân viên hơi lạnh lùng. Bãi đỗ xe hơi xa, đi bộ mất thời gian. Cần cải thiện dịch vụ khách hàng.',
    avatar: 'N'
  },
  {
    id: 7,
    user: 'Đỗ Minh Tuấn',
    rating: 4,
    date: '2025-01-09',
    comment: 'Chất lượng sân tốt, có phòng thay đồ sạch sẽ. Chỉ thiếu quán ăn gần đó, phải đi xa để mua đồ ăn.',
    avatar: 'D'
  },
  {
    id: 8,
    user: 'Vũ Thị Mai',
    rating: 5,
    date: '2025-01-08',
    comment: 'Sân rất đẹp và chuyên nghiệp. Có camera giám sát, cảm giác an toàn. Nhân viên hỗ trợ nhiệt tình.',
    avatar: 'V'
  },
  {
    id: 9,
    user: 'Bùi Văn Đức',
    rating: 2,
    date: '2025-01-07',
    comment: 'Sân cỏ có vấn đề, một số chỗ bị lồi lõm. Giá hơi cao so với chất lượng. Không recommend.',
    avatar: 'B'
  },
  {
    id: 10,
    user: 'Lý Thị Hương',
    rating: 4,
    date: '2025-01-06',
    comment: 'Sân sạch sẽ, có wifi miễn phí. Chỉ cần cải thiện thêm về hệ thống tưới nước cho cỏ.',
    avatar: 'L'
  },
  {
    id: 11,
    user: 'Phan Văn Nam',
    rating: 5,
    date: '2025-01-05',
    comment: 'Địa điểm thuận tiện, dễ tìm. Sân cỏ chất lượng cao, chơi rất thoải mái. Sẽ đặt lại nhiều lần.',
    avatar: 'P'
  },
  {
    id: 12,
    user: 'Trịnh Thị Linh',
    rating: 3,
    date: '2025-01-04',
    comment: 'Sân ổn nhưng giá hơi cao. Thiếu chỗ ngồi cho người xem. Cần có thêm ghế ngồi nghỉ.',
    avatar: 'T'
  },
  {
    id: 13,
    user: 'Ngô Văn Hùng',
    rating: 4,
    date: '2025-01-03',
    comment: 'Chất lượng sân tốt, có bảo vệ 24/7. Chỉ cần cải thiện thêm về dịch vụ vệ sinh.',
    avatar: 'N'
  },
  {
    id: 14,
    user: 'Đinh Thị Thu',
    rating: 5,
    date: '2025-01-02',
    comment: 'Sân rất đẹp, có hệ thống tưới nước tự động. Nhân viên chuyên nghiệp, phục vụ tốt.',
    avatar: 'D'
  },
  {
    id: 15,
    user: 'Cao Văn Long',
    rating: 4,
    date: '2025-01-01',
    comment: 'Sân cỏ nhân tạo chất lượng tốt. Có wifi và nước uống miễn phí. Giá cả hợp lý.',
    avatar: 'C'
  },
  {
    id: 16,
    user: 'Lưu Thị Hoa',
    rating: 3,
    date: '2024-12-31',
    comment: 'Sân ổn nhưng thiếu chỗ đỗ xe. Phải đỗ xa và đi bộ khá lâu. Cần mở rộng bãi đỗ xe.',
    avatar: 'L'
  },
  {
    id: 17,
    user: 'Tôn Văn Quang',
    rating: 5,
    date: '2024-12-30',
    comment: 'Sân rất chuyên nghiệp, có camera giám sát. Chất lượng cỏ tốt, chơi rất thoải mái.',
    avatar: 'T'
  },
  {
    id: 18,
    user: 'Hồ Thị Nga',
    rating: 4,
    date: '2024-12-29',
    comment: 'Sân sạch sẽ, có phòng thay đồ tiện lợi. Chỉ cần cải thiện thêm về ánh sáng ban đêm.',
    avatar: 'H'
  },
  {
    id: 19,
    user: 'Võ Văn Tài',
    rating: 2,
    date: '2024-12-28',
    comment: 'Sân có vấn đề về chất lượng cỏ. Một số chỗ bị hỏng, không đảm bảo an toàn khi chơi.',
    avatar: 'V'
  },
  {
    id: 20,
    user: 'Dương Thị Lan',
    rating: 4,
    date: '2024-12-27',
    comment: 'Sân đẹp, có wifi miễn phí. Nhân viên phục vụ nhiệt tình. Chỉ thiếu quán ăn gần đó.',
    avatar: 'D'
  },
  {
    id: 21,
    user: 'Lâm Văn Hải',
    rating: 5,
    date: '2024-12-26',
    comment: 'Sân cỏ chất lượng cao, có hệ thống tưới nước hiện đại. Chơi rất thoải mái và an toàn.',
    avatar: 'L'
  },
  {
    id: 22,
    user: 'Nguyễn Thị Bích',
    rating: 3,
    date: '2024-12-25',
    comment: 'Sân ổn nhưng giá hơi cao so với các sân khác. Thiếu chỗ ngồi nghỉ cho người xem.',
    avatar: 'N'
  },
  {
    id: 23,
    user: 'Trần Văn Sơn',
    rating: 4,
    date: '2024-12-24',
    comment: 'Chất lượng sân tốt, có bảo vệ 24/7. Chỉ cần cải thiện thêm về dịch vụ vệ sinh.',
    avatar: 'T'
  },
  {
    id: 24,
    user: 'Lê Thị Mai',
    rating: 5,
    date: '2024-12-23',
    comment: 'Sân rất đẹp và chuyên nghiệp. Có camera giám sát, cảm giác an toàn. Recommend!',
    avatar: 'L'
  },
  {
    id: 25,
    user: 'Phạm Văn Đạt',
    rating: 4,
    date: '2024-12-22',
    comment: 'Sân cỏ nhân tạo chất lượng tốt. Có wifi và nước uống miễn phí. Giá cả hợp lý.',
    avatar: 'P'
  },
  {
    id: 26,
    user: 'Hoàng Thị Hương',
    rating: 3,
    date: '2024-12-21',
    comment: 'Sân ổn nhưng thiếu chỗ đỗ xe. Phải đỗ xa và đi bộ khá lâu. Cần mở rộng bãi đỗ xe.',
    avatar: 'H'
  },
  {
    id: 27,
    user: 'Vũ Văn Minh',
    rating: 5,
    date: '2024-12-20',
    comment: 'Sân rất chuyên nghiệp, có camera giám sát. Chất lượng cỏ tốt, chơi rất thoải mái.',
    avatar: 'V'
  },
  {
    id: 28,
    user: 'Đỗ Thị Thu',
    rating: 4,
    date: '2024-12-19',
    comment: 'Sân sạch sẽ, có phòng thay đồ tiện lợi. Chỉ cần cải thiện thêm về ánh sáng ban đêm.',
    avatar: 'D'
  },
  {
    id: 29,
    user: 'Bùi Văn Cường',
    rating: 2,
    date: '2024-12-18',
    comment: 'Sân có vấn đề về chất lượng cỏ. Một số chỗ bị hỏng, không đảm bảo an toàn khi chơi.',
    avatar: 'B'
  },
  {
    id: 30,
    user: 'Lý Thị Lan',
    rating: 4,
    date: '2024-12-17',
    comment: 'Sân đẹp, có wifi miễn phí. Nhân viên phục vụ nhiệt tình. Chỉ thiếu quán ăn gần đó.',
    avatar: 'L'
  },
  {
    id: 31,
    user: 'Phan Văn Hải',
    rating: 5,
    date: '2024-12-16',
    comment: 'Sân cỏ chất lượng cao, có hệ thống tưới nước hiện đại. Chơi rất thoải mái và an toàn.',
    avatar: 'P'
  },
  {
    id: 32,
    user: 'Trịnh Thị Bích',
    rating: 3,
    date: '2024-12-15',
    comment: 'Sân ổn nhưng giá hơi cao so với các sân khác. Thiếu chỗ ngồi nghỉ cho người xem.',
    avatar: 'T'
  },
  {
    id: 33,
    user: 'Ngô Văn Sơn',
    rating: 4,
    date: '2024-12-14',
    comment: 'Chất lượng sân tốt, có bảo vệ 24/7. Chỉ cần cải thiện thêm về dịch vụ vệ sinh.',
    avatar: 'N'
  },
  {
    id: 34,
    user: 'Đinh Thị Mai',
    rating: 5,
    date: '2024-12-13',
    comment: 'Sân rất đẹp và chuyên nghiệp. Có camera giám sát, cảm giác an toàn. Recommend!',
    avatar: 'D'
  },
  {
    id: 35,
    user: 'Cao Văn Đạt',
    rating: 4,
    date: '2024-12-12',
    comment: 'Sân cỏ nhân tạo chất lượng tốt. Có wifi và nước uống miễn phí. Giá cả hợp lý.',
    avatar: 'C'
  }
]

export const courts = [
  { id: 1, name: 'Sân 1' },
  { id: 2, name: 'Sân 2' },
  { id: 3, name: 'Sân 3' },
  { id: 4, name: 'Sân 4' },
  { id: 5, name: 'Sân 5' },
  { id: 6, name: 'Sân 6' },
  { id: 7, name: 'Sân 7' },
  { id: 8, name: 'Sân 8' },
  { id: 10, name: 'Sân 10' }
]

export const generateTimeSlots = () => {
  const slots = []
  for (let hour = 11; hour <= 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 20 && min > 0) break
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  return slots
}

export const getBookedSlots = () => [
  { court: 1, time: '14:00' },
  { court: 1, time: '14:30' },
  { court: 2, time: '15:00' },
  { court: 3, time: '16:00' },
  { court: 3, time: '16:30' },
  { court: 5, time: '18:00' },
  { court: 5, time: '18:30' },
  { court: 7, time: '19:00' }
]

