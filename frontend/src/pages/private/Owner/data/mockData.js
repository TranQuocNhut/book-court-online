// Mock data cho Owner Panel
export const ownerKpis = {
  todayRevenue: 12500000,
  monthlyRevenue: 12500000,
  weeklyBookings: 58,
  occupancyRate: 80,
  averageRating: 4.6,
};

export const trendData = [
  { name: "Mon", bookings: 3, revenue: 1.5 },
  { name: "Tue", bookings: 4, revenue: 2.0 },
  { name: "Wed", bookings: 5, revenue: 2.5 },
  { name: "Thu", bookings: 6, revenue: 3.0 },
  { name: "Fri", bookings: 7, revenue: 3.5 },
  { name: "Sat", bookings: 8, revenue: 4.0 },
  { name: "Sun", bookings: 9, revenue: 4.5 },
];

export const pieData = [
  { name: "Đã xác nhận", value: 70 },
  { name: "Chờ xác nhận", value: 20 },
  { name: "Đã hủy", value: 10 },
];

export const pieColors = ["#10b981", "#f59e0b", "#ef4444"];

export const bookingData = [
  {
    id: "BK001",
    customer: "Nguyễn Văn An",
    phone: "0901234567",
    email: "nguyenvanan@gmail.com",
    court: "Sân Bóng Đá 7 Người A",
    courtType: "7 người",
    date: "2025-01-16",
    time: "17:00-19:00",
    price: 500000,
    status: "confirmed",
    pay: "paid",
    bookingDate: "2025-01-15",
    notes: "Đặt sân cho đội bóng công ty",
  },
  {
    id: "BK002",
    customer: "Trần Thị Bình",
    phone: "0909998888",
    email: "tranthibinh@gmail.com",
    court: "Sân Bóng Đá 7 Người B",
    courtType: "7 người",
    date: "2025-01-17",
    time: "19:00-21:00",
    price: 500000,
    status: "pending",
    pay: "pending",
    bookingDate: "2025-01-16",
    notes: "Đặt sân cho đội bóng phường",
  },
  {
    id: "BK003",
    customer: "Lê Văn Cường",
    phone: "0905556666",
    email: "levancuong@gmail.com",
    court: "Sân Tennis VIP",
    courtType: "Tennis",
    date: "2025-01-18",
    time: "20:00-22:00",
    price: 800000,
    status: "cancelled",
    pay: "refunded",
    bookingDate: "2025-01-17",
    notes: "Hủy do thời tiết xấu",
  },
  {
    id: "BK004",
    customer: "Phạm Thị Dung",
    phone: "0907778888",
    email: "phamthidung@gmail.com",
    court: "Sân Bóng Đá 5 Người",
    courtType: "5 người",
    date: "2025-01-19",
    time: "17:00-19:00",
    price: 350000,
    status: "confirmed",
    pay: "paid",
    bookingDate: "2025-01-18",
    notes: "Đặt sân cho đội bóng nữ",
  },
  {
    id: "BK005",
    customer: "Hoàng Văn Em",
    phone: "0903334444",
    email: "hoangvanem@gmail.com",
    court: "Sân Bóng Đá 7 Người A",
    courtType: "7 người",
    date: "2025-01-20",
    time: "18:30-20:30",
    price: 500000,
    status: "pending",
    pay: "pending",
    bookingDate: "2025-01-19",
    notes: "Đặt sân cho đội bóng trường",
  },
];

export const courtData = [
  {
    id: 1,
    name: "Sân Bóng Đá 7 Người A",
    type: "7 người",
    capacity: 7,
    price: 500000,
    status: "active",
    description: "Sân bóng đá 7 người chất lượng cao với cỏ nhân tạo",
    amenities: ["Cỏ nhân tạo", "Ánh sáng LED", "Ghế ngồi", "Nhà vệ sinh"],
    images: [
      "https://th.bing.com/th/id/OIP.bgEjFfMTC5jhVbdI35ON3gHaFj?w=248&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      "https://th.bing.com/th/id/OIP.I7symxL7x2MxaKv0F23sWQHaFs?w=212&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    ],
    maintenance: "Không có lịch bảo trì",
  },
  {
    id: 2,
    name: "Sân Bóng Đá 7 Người B",
    type: "7 người",
    capacity: 7,
    price: 500000,
    status: "active",
    description: "Sân bóng đá 7 người với hệ thống thoát nước tốt",
    amenities: ["Cỏ nhân tạo", "Ánh sáng LED", "Ghế ngồi", "Nhà vệ sinh"],
    images: ["/images/court2-1.jpg", "/images/court2-2.jpg"],
    maintenance: "Không có lịch bảo trì",
  },
  {
    id: 3,
    name: "Sân Tennis VIP",
    type: "Tennis",
    capacity: 2,
    price: 800000,
    status: "active",
    description: "Sân tennis cao cấp với mặt sân chuyên nghiệp",
    amenities: [
      "Mặt sân chuyên nghiệp",
      "Ánh sáng LED",
      "Ghế ngồi VIP",
      "Nhà vệ sinh",
    ],
    images: ["/images/tennis1-1.jpg", "/images/tennis1-2.jpg"],
    maintenance: "Không có lịch bảo trì",
  },
  {
    id: 4,
    name: "Sân Bóng Đá 5 Người",
    type: "5 người",
    capacity: 5,
    price: 350000,
    status: "maintenance",
    description: "Sân bóng đá 5 người phù hợp cho các trận đấu nhỏ",
    amenities: ["Cỏ nhân tạo", "Ánh sáng LED", "Ghế ngồi"],
    images: ["/images/court5-1.jpg", "/images/court5-2.jpg"],
    maintenance: "Bảo trì từ 20/01/2025 đến 25/01/2025",
  },
];

export const reportData = [
  { month: "01", bookings: 45, revenue: 22.5 },
  { month: "02", bookings: 38, revenue: 19.0 },
  { month: "03", bookings: 52, revenue: 26.0 },
  { month: "04", bookings: 41, revenue: 20.5 },
  { month: "05", bookings: 58, revenue: 29.0 },
  { month: "06", bookings: 62, revenue: 31.0 },
];

export const transactionData = [
  {
    id: "TXN001",
    bookingId: "BK001",
    customer: "Nguyễn Văn An",
    court: "Sân Bóng Đá 7 Người A",
    amount: 500000,
    method: "bank_transfer",
    status: "completed",
    transactionId: "TXN001",
    date: "2025-01-15",
    time: "14:30",
  },
  {
    id: "TXN002",
    bookingId: "BK002",
    customer: "Trần Thị Bình",
    court: "Sân Bóng Đá 7 Người B",
    amount: 500000,
    method: "momo",
    status: "pending",
    transactionId: "TXN002",
    date: "2025-01-16",
    time: "09:15",
  },
  {
    id: "TXN003",
    bookingId: "BK003",
    customer: "Lê Văn Cường",
    court: "Sân Tennis VIP",
    amount: 800000,
    method: "bank_transfer",
    status: "refunded",
    transactionId: "TXN003",
    date: "2025-01-17",
    time: "16:45",
  },
  {
    id: "TXN004",
    bookingId: "BK004",
    customer: "Phạm Thị Dung",
    court: "Sân Bóng Đá 5 Người",
    amount: 350000,
    method: "vnpay",
    status: "completed",
    transactionId: "TXN004",
    date: "2025-01-18",
    time: "11:20",
  },
  {
    id: "TXN005",
    bookingId: "BK005",
    customer: "Hoàng Văn Em",
    court: "Sân Bóng Đá 7 Người A",
    amount: 500000,
    method: "momo",
    status: "failed",
    transactionId: "TXN005",
    date: "2025-01-19",
    time: "13:10",
  },
];

export const dailyRevenueData = [
  { date: "2025-01-10", revenue: 2500000, bookings: 5 },
  { date: "2025-01-11", revenue: 3200000, bookings: 6 },
  { date: "2025-01-12", revenue: 1800000, bookings: 3 },
  { date: "2025-01-13", revenue: 4100000, bookings: 7 },
  { date: "2025-01-14", revenue: 2900000, bookings: 5 },
  { date: "2025-01-15", revenue: 3800000, bookings: 6 },
  { date: "2025-01-16", revenue: 4500000, bookings: 8 },
];

export const courtRevenueData = [
  {
    court: "Sân Bóng Đá 7 Người A",
    revenue: 15000000,
    bookings: 30,
    percentage: 35,
  },
  {
    court: "Sân Bóng Đá 7 Người B",
    revenue: 12000000,
    bookings: 24,
    percentage: 28,
  },
  { court: "Sân Tennis VIP", revenue: 10000000, bookings: 12, percentage: 23 },
  {
    court: "Sân Bóng Đá 5 Người",
    revenue: 6000000,
    bookings: 15,
    percentage: 14,
  },
];

export const reviewData = [
  {
    id: "REV001",
    customer: "Nguyễn Văn An",
    court: "Sân Bóng Đá 7 Người A",
    bookingId: "BK001",
    rating: 5,
    comment:
      "Sân rất đẹp, cỏ nhân tạo chất lượng cao. Nhân viên phục vụ nhiệt tình. Sẽ quay lại!",
    date: "2025-01-16",
    status: "approved",
    isOwnerReplied: true,
    ownerReply:
      "Cảm ơn bạn đã đánh giá! Chúng tôi sẽ tiếp tục cải thiện dịch vụ.",
    replyDate: "2025-01-16",
  },
  {
    id: "REV002",
    customer: "Trần Thị Bình",
    court: "Sân Bóng Đá 7 Người B",
    bookingId: "BK002",
    rating: 4,
    comment:
      "Sân tốt, giá cả hợp lý. Chỉ có điều ánh sáng hơi yếu vào buổi tối.",
    date: "2025-01-15",
    status: "approved",
    isOwnerReplied: false,
    ownerReply: "",
    replyDate: "",
  },
  {
    id: "REV003",
    customer: "Lê Văn Cường",
    court: "Sân Tennis VIP",
    bookingId: "BK003",
    rating: 5,
    comment:
      "Sân tennis tuyệt vời! Mặt sân chuyên nghiệp, ánh sáng tốt. Rất hài lòng!",
    date: "2025-01-14",
    status: "approved",
    isOwnerReplied: true,
    ownerReply: "Cảm ơn bạn! Chúng tôi rất vui khi được phục vụ bạn.",
    replyDate: "2025-01-14",
  },
  {
    id: "REV004",
    customer: "Phạm Thị Dung",
    court: "Sân Bóng Đá 5 Người",
    bookingId: "BK004",
    rating: 3,
    comment:
      "Sân ổn nhưng cần cải thiện hệ thống thoát nước. Khi mưa sân bị ướt.",
    date: "2025-01-13",
    status: "reported",
    isOwnerReplied: false,
    ownerReply: "",
    replyDate: "",
  },
  {
    id: "REV005",
    customer: "Hoàng Văn Em",
    court: "Sân Bóng Đá 7 Người A",
    bookingId: "BK005",
    rating: 4,
    comment:
      "Sân đẹp, giá cả hợp lý. Nhân viên thân thiện. Sẽ giới thiệu cho bạn bè.",
    date: "2025-01-12",
    status: "approved",
    isOwnerReplied: false,
    ownerReply: "",
    replyDate: "",
  },
];

export const occupancyData = [
  {
    court: "Sân Bóng Đá 7 Người A",
    totalSlots: 16,
    bookedSlots: 14,
    occupancyRate: 87.5,
    performance: "Tốt",
  },
  {
    court: "Sân Bóng Đá 7 Người B",
    totalSlots: 16,
    bookedSlots: 12,
    occupancyRate: 75.0,
    performance: "Tốt",
  },
  {
    court: "Sân Tennis VIP",
    totalSlots: 16,
    bookedSlots: 8,
    occupancyRate: 50.0,
    performance: "Trung bình",
  },
  {
    court: "Sân Bóng Đá 5 Người",
    totalSlots: 16,
    bookedSlots: 6,
    occupancyRate: 37.5,
    performance: "Thấp",
  },
];

export const peakHoursData = [
  { hour: "06:00-08:00", bookings: 2, revenue: 1000000, type: "Thấp điểm" },
  { hour: "08:00-10:00", bookings: 4, revenue: 2000000, type: "Thấp điểm" },
  { hour: "10:00-12:00", bookings: 6, revenue: 3000000, type: "Trung bình" },
  { hour: "12:00-14:00", bookings: 8, revenue: 4000000, type: "Cao điểm" },
  { hour: "14:00-16:00", bookings: 10, revenue: 5000000, type: "Cao điểm" },
  { hour: "16:00-18:00", bookings: 12, revenue: 6000000, type: "Cao điểm" },
  { hour: "18:00-20:00", bookings: 14, revenue: 7000000, type: "Cao điểm" },
  { hour: "20:00-22:00", bookings: 8, revenue: 4000000, type: "Trung bình" },
];

export const loyalCustomersData = [
  {
    customer: "Nguyễn Văn An",
    totalBookings: 15,
    totalSpent: 7500000,
    lastBooking: "2025-01-16",
    loyaltyScore: 95,
    tier: "VIP",
  },
  {
    customer: "Đặng Minh Tuấn",
    totalBookings: 12,
    totalSpent: 6000000,
    lastBooking: "2025-01-14",
    loyaltyScore: 88,
    tier: "Gold",
  },
  {
    customer: "Lê Hoàng",
    totalBookings: 8,
    totalSpent: 6400000,
    lastBooking: "2025-01-15",
    loyaltyScore: 82,
    tier: "Gold",
  },
  {
    customer: "Trần Thị Bình",
    totalBookings: 6,
    totalSpent: 3600000,
    lastBooking: "2025-01-13",
    loyaltyScore: 75,
    tier: "Silver",
  },
  {
    customer: "Võ Thị Hoa",
    totalBookings: 4,
    totalSpent: 2000000,
    lastBooking: "2025-01-12",
    loyaltyScore: 65,
    tier: "Silver",
  },
];

export const cancellationData = [
  {
    court: "Sân Bóng Đá 7 Người A",
    totalBookings: 30,
    cancelled: 2,
    noShow: 1,
    cancellationRate: 6.7,
    noShowRate: 3.3,
    status: "Tốt",
  },
  {
    court: "Sân Bóng Đá 7 Người B",
    totalBookings: 24,
    cancelled: 3,
    noShow: 2,
    cancellationRate: 12.5,
    noShowRate: 8.3,
    status: "Trung bình",
  },
  {
    court: "Sân Tennis VIP",
    totalBookings: 12,
    cancelled: 1,
    noShow: 0,
    cancellationRate: 8.3,
    noShowRate: 0.0,
    status: "Tốt",
  },
  {
    court: "Sân Bóng Đá 5 Người",
    totalBookings: 15,
    cancelled: 4,
    noShow: 3,
    cancellationRate: 26.7,
    noShowRate: 20.0,
    status: "Cần cải thiện",
  },
];

// Dữ liệu chat hỗ trợ khách hàng
export const notificationData = [
  {
    id: "CHAT001",
    customerId: "CUST001",
    customerName: "Nguyễn Văn An",
    customerPhone: "0901234567",
    customerEmail: "nguyenvanan@gmail.com",
    avatar: null,
    isOnline: true,
    lastMessage: "Cho em hỏi sân có còn trống vào tối mai không ạ?",
    lastMessageTime: "15:30",
    date: "2025-01-16",
    status: "unread",
    unreadCount: 3,
    messages: [
      {
        id: "msg1",
        text: "Xin chào, em muốn đặt sân bóng đá 7 người vào tối mai",
        sender: "customer",
        timestamp: Date.now() - 3600000,
        isRead: true,
      },
      {
        id: "msg2",
        text: "Chào bạn! Bạn muốn đặt khung giờ nào cụ thể?",
        sender: "owner",
        timestamp: Date.now() - 3500000,
        isRead: true,
      },
      {
        id: "msg3",
        text: "Cho em hỏi sân có còn trống vào tối mai không ạ?",
        sender: "customer",
        timestamp: Date.now() - 300000,
        isRead: false,
      },
    ],
  },
  {
    id: "CHAT002",
    customerId: "CUST002",
    customerName: "Trần Thị Bình",
    customerPhone: "0909998888",
    customerEmail: "tranthibinh@gmail.com",
    avatar: null,
    isOnline: false,
    lastMessage: "Cảm ơn bạn, em sẽ đến đúng giờ",
    lastMessageTime: "14:20",
    date: "2025-01-16",
    status: "read",
    unreadCount: 0,
    messages: [
      {
        id: "msg1",
        text: "Em đã thanh toán rồi, khi nào có thể đến chơi?",
        sender: "customer",
        timestamp: Date.now() - 7200000,
        isRead: true,
      },
      {
        id: "msg2",
        text: "Bạn có thể đến vào khung giờ đã đặt. Chúng tôi đã xác nhận đơn của bạn",
        sender: "owner",
        timestamp: Date.now() - 7100000,
        isRead: true,
      },
      {
        id: "msg3",
        text: "Cảm ơn bạn, em sẽ đến đúng giờ",
        sender: "customer",
        timestamp: Date.now() - 7000000,
        isRead: true,
      },
    ],
  },
  {
    id: "CHAT003",
    customerId: "CUST003",
    customerName: "Lê Văn Cường",
    customerPhone: "0905556666",
    customerEmail: "levancuong@gmail.com",
    avatar: null,
    isOnline: true,
    lastMessage: "Xin lỗi shop nhé, em muốn hủy đặt sân do thời tiết xấu",
    lastMessageTime: "13:15",
    date: "2025-01-16",
    status: "unread",
    unreadCount: 8,
    messages: [
      {
        id: "msg1",
        text: "Xin lỗi shop nhé, em muốn hủy đặt sân do thời tiết xấu",
        sender: "customer",
        timestamp: Date.now() - 10800000,
        isRead: false,
      },
    ],
  },
  {
    id: "CHAT004",
    customerId: "CUST004",
    customerName: "Phạm Thị Dung",
    customerPhone: "0907778888",
    customerEmail: "phamthidung@gmail.com",
    avatar: null,
    isOnline: false,
    lastMessage: "Em muốn phản ánh về chất lượng sân",
    lastMessageTime: "12:45",
    date: "2025-01-16",
    status: "read",
    unreadCount: 0,
    messages: [
      {
        id: "msg1",
        text: "Em muốn phản ánh về chất lượng sân",
        sender: "customer",
        timestamp: Date.now() - 14400000,
        isRead: true,
      },
      {
        id: "msg2",
        text: "Chúng tôi rất tiếc về trải nghiệm của bạn. Bạn có thể mô tả chi tiết hơn được không?",
        sender: "owner",
        timestamp: Date.now() - 14300000,
        isRead: true,
      },
    ],
  },
  {
    id: "CHAT005",
    customerId: "CUST005",
    customerName: "Hoàng Văn Em",
    customerPhone: "0903334444",
    customerEmail: "hoangvanem@gmail.com",
    avatar: null,
    isOnline: true,
    lastMessage: "Sân có dịch vụ cho thuê giày không ạ?",
    lastMessageTime: "10:30",
    date: "2025-01-16",
    status: "read",
    unreadCount: 0,
    messages: [
      {
        id: "msg1",
        text: "Sân có dịch vụ cho thuê giày không ạ?",
        sender: "customer",
        timestamp: Date.now() - 18000000,
        isRead: true,
      },
      {
        id: "msg2",
        text: "Có bạn nhé, chúng tôi có dịch vụ cho thuê giày đá bóng với giá 30,000 VNĐ",
        sender: "owner",
        timestamp: Date.now() - 17900000,
        isRead: true,
      },
    ],
  },
];

export const staffData = [
  {
    id: "STAFF001",
    name: "Nguyễn Thị Lan",
    email: "nguyenthilan@gmail.com",
    phone: "0901111111",
    position: "Quản lý sân",
    salary: 8000000,
    joinDate: "2024-01-15",
    status: "active",
    permissions: ["manage_courts", "manage_bookings", "view_reports"],
    lastLogin: "2025-01-16 14:30",
    totalHours: 160,
    performance: "Tốt",
  },
  {
    id: "STAFF002",
    name: "Trần Văn Minh",
    email: "tranvanminh@gmail.com",
    phone: "0902222222",
    position: "Nhân viên bảo trì",
    salary: 6000000,
    joinDate: "2024-03-20",
    status: "active",
    permissions: ["manage_courts", "view_reports"],
    lastLogin: "2025-01-16 09:15",
    totalHours: 140,
    performance: "Tốt",
  },
  {
    id: "STAFF003",
    name: "Lê Thị Hoa",
    email: "lethihoa@gmail.com",
    phone: "0903333333",
    position: "Nhân viên thu ngân",
    salary: 7000000,
    joinDate: "2024-02-10",
    status: "inactive",
    permissions: ["manage_bookings", "view_reports"],
    lastLogin: "2025-01-10 17:45",
    totalHours: 120,
    performance: "Trung bình",
  },
  {
    id: "STAFF004",
    name: "Phạm Văn Đức",
    email: "phamvanduc@gmail.com",
    phone: "0904444444",
    position: "Nhân viên vệ sinh",
    salary: 5000000,
    joinDate: "2024-04-05",
    status: "active",
    permissions: ["manage_courts"],
    lastLogin: "2025-01-16 16:20",
    totalHours: 150,
    performance: "Tốt",
  },
];

export const activityLogData = [
  {
    id: "LOG001",
    timestamp: "2025-01-16 15:30:25",
    user: "Nguyễn Văn Chủ",
    userId: "OWNER001",
    action: "Xác nhận đặt sân",
    target: "BK001",
    details: "Xác nhận đặt sân cho khách hàng Nguyễn Văn An",
    ip: "192.168.1.100",
    status: "success",
  },
  {
    id: "LOG002",
    timestamp: "2025-01-16 14:20:15",
    user: "Nguyễn Thị Lan",
    userId: "STAFF001",
    action: "Cập nhật thông tin sân",
    target: "Sân Bóng Đá 7 Người A",
    details: "Cập nhật giá thuê sân từ 450,000 VNĐ lên 500,000 VNĐ",
    ip: "192.168.1.101",
    status: "success",
  },
  {
    id: "LOG003",
    timestamp: "2025-01-16 13:15:30",
    user: "Nguyễn Văn Chủ",
    userId: "OWNER001",
    action: "Hủy đặt sân",
    target: "BK003",
    details: "Hủy đặt sân do khách hàng yêu cầu",
    ip: "192.168.1.100",
    status: "success",
  },
  {
    id: "LOG004",
    timestamp: "2025-01-16 12:45:20",
    user: "Trần Văn Minh",
    userId: "STAFF002",
    action: "Bảo trì sân",
    target: "Sân Bóng Đá 5 Người",
    details: "Thực hiện bảo trì hệ thống thoát nước",
    ip: "192.168.1.102",
    status: "success",
  },
  {
    id: "LOG005",
    timestamp: "2025-01-16 11:30:45",
    user: "Nguyễn Văn Chủ",
    userId: "OWNER001",
    action: "Thêm nhân viên mới",
    target: "STAFF005",
    details: "Thêm nhân viên mới: Võ Thị Mai",
    ip: "192.168.1.100",
    status: "success",
  },
];

export const drinksMenu = [
  { id: "drink001", name: "Nước suối Aquafina", price: 10000 },
  { id: "drink002", name: "Sting Dâu", price: 15000 },
  { id: "drink003", name: "Coca-Cola", price: 15000 },
  { id: "drink004", name: "Pepsi", price: 15000 },
  { id: "drink005", name: "Nước tăng lực Red Bull", price: 20000 },
  { id: "drink006", name: "Nước chanh muối", price: 12000 },
  { id: "drink007", name: "Trà ô long", price: 15000 },
];

// Trong file mockData.js

// Trong file data/mockData.js

// Trong file data/mockData.js

// Trong file data/mockData.js

export const serviceData = [
  {
    id: "cat_drinks",
    name: "Nước uống",
    items: [
      {
        _id: "d1",
        name: "Nước suối",
        price: 10000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.ocW_rXNgqN4B71hjPxB8PAHaHa?w=175&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "d2",
        name: "Nước tăng lực",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.F2iRwRCT6vpUdt7pxhI4TgHaFj?w=251&h=188&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "d3",
        name: "Sting dâu",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.hS4JT37JJe30GK-ww4zmAwHaHa?w=179&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "d4",
        name: "Trà đá",
        price: 5000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.sgTuAin9aVLZ3PiqyIgARAHaHa?w=197&h=197&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "d5",
        name: "Coca Cola",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-1.jpg",
      },
      {
        _id: "d6",
        name: "Fanta",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-2.jpg",
      },
      {
        _id: "d7",
        name: "Fuze Tea",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-3.jpg",
      },
      {
        _id: "d8",
        name: "PlayMore",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-4.jpg",
      },
      {
        _id: "d9",
        name: "Pepsi",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-5.jpg",
      },
      {
        _id: "d10",
        name: "7UP",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://kamereo.vn/blog/wp-content/uploads/2024/10/cac-loai-nuoc-ngot-6.jpg",
      },
    ],
  },
  {
    id: "cat_snacks",
    name: "Đồ ăn vặt",
    items: [
      {
        _id: "f1",
        name: "Bánh tráng trộn",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810Hxp/banh-tran-tron-882786.jpg",
      },
      {
        _id: "f2",
        name: "Bắp xào",
        price: 10000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810ivs/bap-xao-882792.jpg",
      },
      {
        _id: "f3",
        name: "Bánh snack",
        price: 10000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.MFgSkgmNcnBkxCQ_8APUJAHaHa?w=196&h=196&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "f4",
        name: "Trứng luộc",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://www.bing.com/th/id/OIP.n6lBSbWSge0vysNZThlsHwHaEo?w=266&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
      },
      {
        _id: "f5",
        name: "Bánh Flan",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810GjO/banh-flan-882807.jpg",
      },
      {
        _id: "f6",
        name: "Bánh mì bò lá lốt",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810geT/banh-mi-bo-la-lot-882799.jpg",
      },
      {
        _id: "f7",
        name: "Bánh khoai mỡ chiên",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810nBz/banh-khoai-mo-chien-882803.jpg",
      },
      {
        _id: "f8",
        name: "Bánh khọt",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810eQY/banh-khot-882794.jpg",
      },
      {
        _id: "f9",
        name: "Cacao đá chấm bánh mì",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810aZU/cacao-da-cham-banh-mi-882797.jpg",
      },
      {
        _id: "f10",
        name: "Gỏi chân gà sốt Thái",
        price: 7000,
        type: "sale",
        imageUrl:
          "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473810eFM/goi-chan-ga-sot-thai-882788.jpg",
      },
    ],
  },
  {
    id: "cat_rentals",
    name: "Thuê đồ & Dụng cụ",
    items: [
      // --- DỤNG CỤ BÓNG ĐÁ ---
      {
        _id: "r_fb_shoes",
        name: "Giày đá bóng",
        price: 30000,
        type: "rental",
        imageUrl:
          "https://th.bing.com/th/id/OIP.02YY9pGnJ9PXHwZJkDbtOwHaE8?w=277&h=184&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_gloves",
        name: "Găng tay thủ môn",
        price: 20000,
        type: "rental",
        imageUrl:
          "https://th.bing.com/th/id/OIP.l1XWBYy37YlZxQ5XdjZtHgHaEK?w=333&h=187&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_bib",
        name: "Áo Bib (1 áo)",
        price: 5000,
        type: "rental",
        imageUrl:
          "https://th.bing.com/th/id/OIP.D6yuofrzHnp1jNqsQFQiFgHaHa?w=199&h=199&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_shin",
        name: "Bọc ống đồng",
        price: 10000,
        type: "rental",
        imageUrl:
          "https://th.bing.com/th/id/OIP.FjMiNhbyXV8wssOtantQcgHaFy?w=247&h=193&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_tape",
        name: "Băng quấn (Cổ tay/Đầu gối)",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.Hg102z_BBuooWq0LhPpMTwHaHa?w=180&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_referee",
        name: "Thuê Trọng tài (1 trận)",
        price: 200000,
        type: "service",
        imageUrl:
          "https://th.bing.com/th/id/OIP.lGB1ZG8D_yT8ebs4Zx2nfwHaFa?w=256&h=187&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_whistle",
        name: "Còi trọng tài",
        price: 25000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.-PPDArj2SAI3ILoIwOuWhQHaHa?w=209&h=209&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },
      {
        _id: "r_fb_ball",
        name: "Bóng đá (1 trái)",
        price: 50000,
        type: "rental",
        imageUrl:
          "https://th.bing.com/th/id/OIP.EVJ1EvxXb6zfdYW2e4iM7wHaE6?w=253&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "football",
      },

      // --- DỤNG CỤ BÓNG RỔ ---
      {
        _id: "r_bb_ball",
        name: "Bóng rổ",
        price: 30000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1519861531473-92002a281d56?w=400&q=80",
        sportType: "basketball",
      },
      {
        _id: "r_bb_bib",
        name: "Áo bib (phân biệt đội)",
        price: 5000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1593341643440-1e5b1b36f7e4?w=400&q=80",
        sportType: "basketball",
      },
      {
        _id: "r_bb_shoes",
        name: "Giày bóng rổ",
        price: 50000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1515287315486-45546556b6d2?w=400&q=80",
        sportType: "basketball",
      },
      {
        _id: "r_bb_bands",
        name: "Băng cổ tay / Băng đầu gối",
        price: 15000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1594488550186-5309d431ba27?w=400&q=80",
        sportType: "basketball",
      },
      {
        _id: "r_bb_mouthguard",
        name: "Miếng bảo vệ răng",
        price: 20000,
        type: "sale",
        imageUrl:
          "https://images.unsplash.com/photo-1601061326160-561c28b72a6b?w=400&q=80",
        sportType: "basketball",
      },
      {
        _id: "r_bb_scoreboard",
        name: "Bảng điểm điện tử",
        price: 100000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1517649763942-321385573677?w=400&q=80",
        sportType: "basketball",
      },

      // --- DỤNG CỤ TENNIS (Cập nhật) ---
      {
        _id: "r_tn_racket",
        name: "Vợt tennis",
        price: 50000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-162124505973-c1e1c1c1c1c1?w=400&q=80",
        sportType: "tennis",
      },
      {
        _id: "r_tn_ball",
        name: "Bóng Tennis (1 hộp)",
        price: 120000,
        type: "sale",
        imageUrl:
          "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&q=80",
        sportType: "tennis",
      },
      {
        _id: "r_tn_shoes",
        name: "Giày tennis",
        price: 50000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1606902220745-a4a33c8a5ff5?w=400&q=80",
        sportType: "tennis",
      },
      {
        _id: "r_tn_machine",
        name: "Máy bắn bóng",
        price: 150000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1604313506161-9f93f60fde0d?w=400&q=80",
        sportType: "tennis",
      },

      // --- DỤNG CỤ PICKLEBALL (Cập nhật) ---
      {
        _id: "r_pb_paddle",
        name: "Vợt pickleball",
        price: 40000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=80",
        sportType: "pickleball",
      },
      {
        _id: "r_pb_ball",
        name: "Bóng nhựa (Pickleball)",
        price: 15000,
        type: "sale",
        imageUrl:
          "https://images.unsplash.com/photo-1611082154782-b133e9b0b4db?w=400&q=80",
        sportType: "pickleball",
      },
      {
        _id: "r_pb_bib",
        name: "Áo bib (Pickleball)",
        price: 5000,
        type: "rental",
        imageUrl:
          "https://plus.unsplash.com/premium_photo-1664302478562-63e86290b197?w=400&q=80",
        sportType: "pickleball",
      },
      {
        _id: "r_pb_shoes",
        name: "Giày thể thao (Pickleball)",
        price: 40000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1594912953041-e9e9e9e9e9e9?w=400&q=80",
        sportType: "pickleball",
      },

      // --- DỤNG CỤ BÓNG BÀN (Mới) ---
      {
        _id: "r_tt_paddle",
        name: "Vợt bóng bàn",
        price: 20000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1543306979-0d3f23f114c0?w=400&q=80",
        sportType: "tabletennis",
      },
      {
        _id: "r_tt_ball",
        name: "Bóng bàn (1 trái)",
        price: 5000,
        type: "sale",
        imageUrl:
          "https://images.unsplash.com/photo-1550971032-841da8d0111f?w=400&q=80",
        sportType: "tabletennis",
      },
      {
        _id: "r_tt_net",
        name: "Lưới bàn",
        price: 10000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1520625316870-62181b539a2b?w=400&q=80",
        sportType: "tabletennis",
      },
      {
        _id: "r_tt_machine",
        name: "Máy bắn bóng bàn",
        price: 100000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1604313506161-9f93f60fde0d?w=400&q=80",
        sportType: "tabletennis",
      },

      // --- DỤNG CỤ BÓNG CHUYỀN ---
      {
        _id: "r_vb_1",
        name: "Bóng chuyền",
        price: 25000,
        type: "rental",
        imageUrl:
          "https://images.unsplash.com/photo-1517649763942-321385573677?w=400&q=80",
        sportType: "volleyball",
      },

      // --- DỤNG CỤ CHUNG (ALL) ---
      {
        _id: "r_all_1",
        name: "Khăn lạnh",
        price: 5000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.nTFSZLjzabM9e7BWYWl2vwHaHa?w=191&h=191&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "all",
      },
      {
        _id: "r_all_2",
        name: "Bình xịt giảm đau",
        price: 80000,
        type: "sale",
        imageUrl:
          "https://th.bing.com/th/id/OIP.4Vihcx88jL5INgKwxr5BigHaHa?w=178&h=180&c=7&r=0&o=7&cb=ucfimg2&dpr=1.3&pid=1.7&rm=3&ucfimg=1",
        sportType: "all",
      },
    ],
  },
];

export const sportCategories = [
  { key: "football", name: "Bóng đá" },
  { key: "basketball", name: "Bóng rổ" },
  { key: "tennis", name: "Tennis" },
  { key: "pickleball", name: "Pickleball" },
  { key: "tabletennis", name: "Bóng bàn" },
  { key: "volleyball", name: "Bóng chuyền" },
];
