/**
 * Helper functions cho tournament
 */

/**
 * Lấy thông tin đội vô địch từ tournament
 * @param {Object} tournament - Tournament object từ API
 * @returns {Object|null} - Team object của đội vô địch hoặc null
 */
export const getChampion = (tournament) => {
  if (!tournament) return null

  // Ưu tiên 1: Lấy từ field champion (nếu đã được lưu)
  if (tournament.champion) {
    const championId = tournament.champion
    const champion = tournament.teams?.find(t => 
      (t.id === championId) || 
      (t._id?.toString() === championId?.toString())
    )
    if (champion) return champion
  }

  // Ưu tiên 2: Tính toán từ trận final (fallback)
  const finalMatch = tournament.matches?.find(m => m.stage === 'final')
  
  if (!finalMatch || finalMatch.score1 === null || finalMatch.score2 === null) {
    return null
  }

  // Xác định đội thắng
  let winnerId = null
  
  if (finalMatch.team1Id === "BYE" || finalMatch.team2Id === "BYE") {
    // Có BYE trong trận đấu
    winnerId = finalMatch.team1Id !== "BYE" ? finalMatch.team1Id : finalMatch.team2Id
  } else {
    // Trận đấu bình thường, tính winner dựa trên điểm số
    winnerId = finalMatch.score1 > finalMatch.score2 
      ? finalMatch.team1Id 
      : finalMatch.score2 > finalMatch.score1 
        ? finalMatch.team2Id 
        : null // Hòa
  }

  if (!winnerId || winnerId === "BYE") return null

  // Tìm thông tin đội vô địch
  const champion = tournament.teams?.find(t => 
    (t.id === winnerId) || 
    (t._id?.toString() === winnerId?.toString())
  )

  return champion || null
}

/**
 * Kiểm tra xem giải đấu đã có đội vô địch chưa
 * @param {Object} tournament - Tournament object từ API
 * @returns {Boolean} - true nếu đã có đội vô địch
 */
export const hasChampion = (tournament) => {
  return getChampion(tournament) !== null
}

/**
 * Lấy tên đội vô địch
 * @param {Object} tournament - Tournament object từ API
 * @returns {String} - Tên đội vô địch hoặc null
 */
export const getChampionName = (tournament) => {
  const champion = getChampion(tournament)
  if (!champion) return null
  return champion.teamNumber || `Đội #${champion.id || champion._id}`
}

/**
 * Lấy badge cho status của giải đấu (giống như trong TournamentCard)
 * @param {String} status - Status của giải đấu (upcoming, starting, ongoing, completed, cancelled)
 * @returns {Object} - Object chứa className và text cho badge
 */
export const getStatusBadge = (status) => {
  const badges = {
    upcoming: { 
      text: 'Đang đăng ký', 
      className: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 inset-ring inset-ring-blue-700/10' 
    },
    starting: { 
      text: 'Sắp diễn ra', 
      className: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 inset-ring inset-ring-yellow-600/20' 
    },
    ongoing: { 
      text: 'Đang diễn ra', 
      className: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 inset-ring inset-ring-green-600/20' 
    },
    completed: { 
      text: 'Đã kết thúc', 
      className: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10' 
    },
    cancelled: { 
      text: 'Đã hủy', 
      className: 'inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 inset-ring inset-ring-red-600/20' 
    }
  }
  return badges[status] || badges.upcoming
}

