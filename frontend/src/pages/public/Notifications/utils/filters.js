export const filterNotifications = (notifications, filters) => {
  let result = [...notifications]
  const { categoryFilter, readFilter } = filters

  // Filter by category
  if (categoryFilter !== 'all') {
    switch (categoryFilter) {
      case 'booking':
        result = result.filter(n => ['booking', 'payment'].includes(n.type))
        break
      case 'promotion':
        result = result.filter(n => n.type === 'promotion')
        break
      case 'system':
        result = result.filter(n => ['reminder', 'cancellation'].includes(n.type))
        break
      default:
        break
    }
  }

  // Filter by read status
  switch (readFilter) {
    case 'unread':
      result = result.filter(n => !n.isRead)
      break
    case 'read':
      result = result.filter(n => n.isRead)
      break
    default:
      break
  }

  return result
}

export const getCategoryCounts = (notifications) => {
  return {
    all: notifications.length,
    booking: notifications.filter(n => ['booking', 'payment'].includes(n.type)).length,
    promotion: notifications.filter(n => n.type === 'promotion').length,
    system: notifications.filter(n => ['reminder', 'cancellation'].includes(n.type)).length
  }
}

export const getCategoryUnreadCounts = (notifications) => {
  return {
    all: notifications.filter(n => !n.isRead).length,
    booking: notifications.filter(n => ['booking', 'payment'].includes(n.type) && !n.isRead).length,
    promotion: notifications.filter(n => n.type === 'promotion' && !n.isRead).length,
    system: notifications.filter(n => ['reminder', 'cancellation'].includes(n.type) && !n.isRead).length
  }
}

export const getCategoryName = (category) => {
  switch (category) {
    case 'all':
      return 'thông báo'
    case 'booking':
      return 'đơn đặt sân'
    case 'promotion':
      return 'khuyến mãi'
    case 'system':
      return 'hệ thống'
    default:
      return 'thông báo'
  }
}

export const getPageTitle = (category) => {
  switch (category) {
    case 'all':
      return 'Thông báo'
    case 'booking':
      return 'Đơn đặt sân'
    case 'promotion':
      return 'Khuyến mãi'
    case 'system':
      return 'Hệ thống'
    default:
      return 'Thông báo'
  }
}

