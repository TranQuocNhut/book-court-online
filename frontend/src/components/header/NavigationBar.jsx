import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, Settings, Handshake, Search, Gift, Trophy, Plus, List, Ticket } from 'lucide-react'
import { facilityApi } from '../../api/facilityApi'
import { toast } from 'react-toastify'

function NavigationBar({ user, mobile, onLinkClick, className }) {
  const navigate = useNavigate()
  const [loadingFacilities, setLoadingFacilities] = useState(false)

  // Kiểm tra nếu user có role owner
  const isOwner = user && user.role === 'owner'
  // Kiểm tra nếu user có role admin
  const isAdmin = user && user.role === 'admin'
  // Xác định route tạo giải đấu dựa trên role
  const createTournamentRoute = (isOwner || isAdmin) ? '/tournament/create' : '/tournament/create/internal'

  const handleClick = () => {
    if (onLinkClick) {
      onLinkClick()
    }
  }

  const handleCreateTournamentClick = async (e) => {
    e.preventDefault()
    handleClick()

    // Nếu là owner hoặc admin, fetch facilities và navigate với facility ID
    if (isOwner || isAdmin) {
      try {
        setLoadingFacilities(true)
        const ownerId = user._id || user.id
        const result = await facilityApi.getFacilities({ ownerId, status: 'opening' })

        if (result.success) {
          const facilities = result.data?.facilities || result.data || []

          if (facilities.length === 0) {
            toast.error('Bạn chưa có cơ sở nào. Vui lòng tạo cơ sở trước.')
            navigate('/tournament/create')
            return
          }

          // Navigate với facility ID đầu tiên
          const facilityId = facilities[0]._id || facilities[0].id
          navigate(`/tournament/create?facility=${facilityId}`)
        } else {
          navigate('/tournament/create')
        }
      } catch (error) {
        console.error('Error fetching owner facilities:', error)
        navigate('/tournament/create')
      } finally {
        setLoadingFacilities(false)
      }
    } else {
      // User thường, navigate bình thường
      navigate(createTournamentRoute)
    }
  }

  const handleRedeemPointsClick = () => {
    handleClick()
    navigate('/loyalty/redeem')
  }

  return (
    <nav className={`nav ${mobile ? 'mobile' : ''} ${className || ''}`} onClick={handleClick}>
      <Link to="/" className="nav-item" onClick={handleClick}>
        <Home size={20} />
        <span>Trang chủ</span>
      </Link>
      <Link to="/facilities" className="nav-item" onClick={handleClick}>
        <Search size={20} />
        <span>Tìm sân</span>
      </Link>
      <Link to="/promotion" className="nav-item" onClick={handleClick}>
        <Ticket size={20} />
        <span>Khuyến mãi</span>
      </Link>
      {user && (
        <Link to="/loyalty/redeem" className="nav-item" onClick={handleRedeemPointsClick}>
          <Gift size={20} />
          <span>Đổi điểm</span>
        </Link>
      )}
      <div className="nav-item-dropdown">
        <div className="nav-item nav-item-with-dropdown">
          <Trophy size={20} />
          <span>Giải đấu</span>
        </div>
        <div className="tournament-dropdown">
          <a
            href={createTournamentRoute}
            className="dropdown-item"
            onClick={handleCreateTournamentClick}
            style={{
              cursor: loadingFacilities ? 'wait' : 'pointer',
              opacity: loadingFacilities ? 0.6 : 1
            }}
          >
            <Plus size={18} />
            <span>{loadingFacilities ? 'Đang tải...' : 'Tạo giải đấu'}</span>
          </a>
          <Link to="/tournament" className="dropdown-item" onClick={handleClick}>
            <List size={18} />
            <span>Tìm giải đấu</span>
          </Link>
        </div>
      </div>
      {isOwner ? (
        <Link to="/owner" className="nav-item" onClick={handleClick}>
          <Settings size={20} />
          <span>Quản lý sân</span>
        </Link>
      ) : (
        <a href="/partner" className="nav-item" onClick={handleClick}>
          <Handshake size={20} />
          <span>Đối tác</span>
        </a>
      )}
    </nav>
  )
}

export default NavigationBar

