import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Plus, Minus, Pencil, Upload, Send, Play } from 'lucide-react'
import { toast } from 'react-toastify'
import { categoryApi } from '../../../../../api/categoryApi'
import { facilityApi } from '../../../../../api/facilityApi'
import { userApi } from '../../../../../api/userApi'
import { leagueApi } from '../../../../../api/leagueApi'
import { useTournament } from '../../TournamentContext'
import useClickOutside from '../../../../../hook/use-click-outside'

const ConfigTab = ({ tournament: tournamentProp }) => {
  const { id } = useParams()
  const { tournament: tournamentFromContext, refreshTournament } = useTournament()
  const tournament = tournamentProp || tournamentFromContext
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    mode: 'private',
    location: '',
    format: '',
    sport: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    formatSport: false
  })
  const [tournamentImage, setTournamentImage] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('')
  const [facilitySearchResults, setFacilitySearchResults] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [favoriteFacilities, setFavoriteFacilities] = useState([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [sportCategories, setSportCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateFacilitySearchQuery, setActivateFacilitySearchQuery] = useState('')
  const [activateFacilitySearchResults, setActivateFacilitySearchResults] = useState([])
  const [loadingActivateFacilities, setLoadingActivateFacilities] = useState(false)
  const [showActivateFacilityDropdown, setShowActivateFacilityDropdown] = useState(false)
  const [selectedActivateFacility, setSelectedActivateFacility] = useState(null)
  const [startingTournament, setStartingTournament] = useState(false)
  const [activateFavoriteFacilities, setActivateFavoriteFacilities] = useState([])
  
  const facilityDropdownRef = useClickOutside(() => {
    setShowFacilityDropdown(false)
  }, showFacilityDropdown)
  
  const activateFacilityDropdownRef = useClickOutside(() => {
    setShowActivateFacilityDropdown(false)
  }, showActivateFacilityDropdown)

  useEffect(() => {
    if (tournament) {
      const locationName = tournament.location || ''
      const locationAddress = tournament.address || ''
      
      // Map format từ backend sang frontend
      const formatMapping = {
        'Loại Trực Tiếp': 'single-elimination',
        'Vòng tròn': 'round-robin'
      }
      
      // Map type từ backend sang mode frontend
      const mode = tournament.type === 'PUBLIC' ? 'public' : 'private'
      
      setFormData({
        name: tournament.name || '',
        phone: tournament.phone || '',
        mode: mode,
        location: locationName || '',
        format: formatMapping[tournament.format] || tournament.format || 'single-elimination',
        sport: tournament.sport || '',
        description: tournament.description || tournament.fullDescription || ''
      })
      setTournamentImage(tournament.image || null)
      setCoverImage(tournament.banner || tournament.image || null)
      
      // Nếu tournament có facility (đã populate), set selectedFacility
      if (tournament.facility) {
        if (typeof tournament.facility === 'object' && (tournament.facility._id || tournament.facility.id)) {
          setSelectedFacility({
            _id: tournament.facility._id || tournament.facility.id,
            id: tournament.facility._id || tournament.facility.id,
            name: tournament.facility.name || locationName || '',
            address: tournament.facility.address || locationAddress || ''
          })
        }
      }
      
      if (locationName || locationAddress) {
        setFacilitySearchQuery(locationName ? `${locationName}${locationAddress ? ` - ${locationAddress}` : ''}` : locationAddress || '')
      }
    }
  }, [tournament])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const result = await categoryApi.getSportCategories({ status: 'active' })
        if (result.success && result.data) {
          setSportCategories(Array.isArray(result.data) ? result.data : [])
        }
      } catch (error) {
        console.error('Error fetching sport categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoadingFavorites(true)
        const result = await userApi.getFavorites()
        if (result.success && result.data?.favorites) {
          setFavoriteFacilities(result.data.favorites)
        } else {
          setFavoriteFacilities([])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        setFavoriteFacilities([])
      } finally {
        setLoadingFavorites(false)
      }
    }
    fetchFavorites()
  }, [])

  useEffect(() => {
    const fetchActivateFavorites = async () => {
      try {
        const result = await userApi.getFavorites()
        if (result.success && result.data?.favorites) {
          setActivateFavoriteFacilities(result.data.favorites)
        } else {
          setActivateFavoriteFacilities([])
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
        setActivateFavoriteFacilities([])
      }
    }
    
    if (isActivateModalOpen) {
      fetchActivateFavorites()
    }
  }, [isActivateModalOpen])

  useEffect(() => {
    const searchActivateFacilities = async () => {
      if (!activateFacilitySearchQuery.trim()) {
        setActivateFacilitySearchResults([])
        setShowActivateFacilityDropdown(false)
        return
      }

      try {
        setLoadingActivateFacilities(true)
        const result = await facilityApi.getFacilities({ 
          limit: 20, 
          status: 'opening',
          address: activateFacilitySearchQuery.trim()
        })
        if (result.success && result.data) {
          const facilitiesList = result.data.facilities || result.data || []
          setActivateFacilitySearchResults(facilitiesList)
          setShowActivateFacilityDropdown(true)
        }
      } catch (error) {
        console.error('Error searching facilities:', error)
        setActivateFacilitySearchResults([])
      } finally {
        setLoadingActivateFacilities(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchActivateFacilities()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [activateFacilitySearchQuery])

  useEffect(() => {
    const searchFacilities = async () => {
      if (!facilitySearchQuery.trim()) {
        setFacilitySearchResults([])
        setShowFacilityDropdown(false)
        return
      }

      try {
        setLoadingFacilities(true)
        const result = await facilityApi.getFacilities({ 
          limit: 20, 
          status: 'opening',
          address: facilitySearchQuery.trim()
        })
        if (result.success && result.data) {
          const facilitiesList = result.data.facilities || result.data || []
          setFacilitySearchResults(facilitiesList)
          setShowFacilityDropdown(true)
        }
      } catch (error) {
        console.error('Error searching facilities:', error)
        setFacilitySearchResults([])
      } finally {
        setLoadingFacilities(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchFacilities()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [facilitySearchQuery])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility)
    // Lưu tên facility vào location để hiển thị, nhưng facility ID sẽ được lưu riêng khi save
    setFormData(prev => ({ ...prev, location: facility.name || '' }))
    setFacilitySearchQuery(facility.name + (facility.address ? ` - ${facility.address}` : ''))
    setShowFacilityDropdown(false)
  }

  const handleFacilitySearchChange = (e) => {
    const value = e.target.value
    setFacilitySearchQuery(value)
    if (!value.trim()) {
      setSelectedFacility(null)
      setFormData(prev => ({ ...prev, location: '' }))
      setShowFacilityDropdown(false)
    }
  }

  const handleImageChange = (type, e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'tournament') {
          setTournamentImage(reader.result)
          setImageFile(file)
        } else {
          setCoverImage(reader.result)
          setBannerFile(file)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên giải đấu')
      return
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }
    if (!formData.location.trim() && !selectedFacility) {
      toast.error('Vui lòng chọn địa điểm')
      return
    }

    try {
      setSaving(true)
      
      // Map format từ frontend sang backend
      const formatMapping = {
        'single-elimination': 'Loại Trực Tiếp',
        'round-robin': 'Vòng tròn',
        'group-stage': 'Chia bảng đấu',
        'knockout': 'Loại Trực Tiếp'
      }
      
      // Lấy thông tin facility - ưu tiên selectedFacility
      let facilityId = null
      let facilityName = ''
      let facilityAddress = ''
      
      if (selectedFacility) {
        // Nếu đã chọn facility trong form, dùng thông tin từ đó
        facilityId = selectedFacility._id || selectedFacility.id
        facilityName = selectedFacility.name || ''
        facilityAddress = selectedFacility.address || ''
      } else if (tournament?.facility) {
        // Nếu tournament đã có facility, giữ nguyên
        if (typeof tournament.facility === 'object' && (tournament.facility._id || tournament.facility.id)) {
          facilityId = tournament.facility._id || tournament.facility.id
          facilityName = tournament.facility.name || tournament.location || ''
          facilityAddress = tournament.facility.address || tournament.address || ''
        } else if (typeof tournament.facility === 'string') {
          facilityId = tournament.facility
          facilityName = tournament.location || ''
          facilityAddress = tournament.address || ''
        }
      } else if (formData.location) {
        // Nếu chỉ có location (tên), không có facility ID
        facilityName = formData.location
        facilityAddress = tournament?.address || ''
      }
      
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        format: formatMapping[formData.format] || formData.format,
        sport: formData.sport,
        description: formData.description.trim() || null,
        fullDescription: formData.description.trim() || null,
        location: facilityName,
        address: facilityAddress,
        type: formData.mode === 'public' ? 'PUBLIC' : 'PRIVATE' // Map mode to type
      }
      
      // Luôn gửi facility ID nếu có (có thể là null để xóa facility)
      updateData.facility = facilityId
      
      // Update tournament
      const result = await leagueApi.updateLeague(id, updateData)
      
      if (!result.success) {
        throw new Error(result.message || 'Cập nhật thông tin giải đấu thất bại')
      }
      
      // Upload images if changed
      if (imageFile && id) {
        try {
          await leagueApi.uploadImage(id, imageFile)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          toast.warning('Cập nhật thông tin thành công nhưng upload ảnh thất bại')
        }
      }
      
      // Refresh tournament data
      if (refreshTournament) {
        refreshTournament()
      }
      
      toast.success('Cập nhật thông tin giải đấu thành công')
      setIsEditing(false)
      setImageFile(null)
      setBannerFile(null)
    } catch (error) {
      console.error('Error updating tournament:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật giải đấu')
    } finally {
      setSaving(false)
    }
  }

  const handleActivateFacilitySelect = (facility) => {
    setSelectedActivateFacility(facility)
    setActivateFacilitySearchQuery(facility.name + (facility.address ? ` - ${facility.address}` : ''))
    setShowActivateFacilityDropdown(false)
  }

  const handleActivateFacilitySearchChange = (e) => {
    const value = e.target.value
    setActivateFacilitySearchQuery(value)
    if (!value.trim()) {
      setSelectedActivateFacility(null)
      setShowActivateFacilityDropdown(false)
    }
  }

  const handleActivateClick = async () => {
    // Kiểm tra xem đã có facility chưa
    let facilityToUse = null
    
    // Ưu tiên 1: Facility đã được chọn trong form (selectedFacility) - khi đang edit
    if (selectedFacility) {
      facilityToUse = selectedFacility
    }
    // Ưu tiên 2: Tournament đã có facility (từ database) - đã populate
    else if (tournament?.facility) {
      // Nếu tournament.facility là object (đã populate), lấy thông tin từ đó
      if (typeof tournament.facility === 'object' && (tournament.facility._id || tournament.facility.id)) {
        facilityToUse = {
          _id: tournament.facility._id || tournament.facility.id,
          id: tournament.facility._id || tournament.facility.id,
          name: tournament.facility.name || tournament.location || '',
          address: tournament.facility.address || tournament.address || ''
        }
      }
      // Nếu là ID string, cần fetch thông tin facility
      else if (typeof tournament.facility === 'string') {
        try {
          const result = await facilityApi.getFacilityById(tournament.facility)
          if (result.success && result.data) {
            facilityToUse = result.data
          }
        } catch (error) {
          console.error('Error fetching facility:', error)
        }
      }
    }
    // Ưu tiên 3: Nếu tournament có location (tên facility), tìm facility theo tên
    else if (tournament?.location && tournament.location.trim()) {
      try {
        // Tìm facility theo tên
        const result = await facilityApi.getFacilities({ 
          name: tournament.location.trim(),
          limit: 1
        })
        if (result.success && result.data) {
          const facilities = result.data.facilities || result.data || []
          if (facilities.length > 0) {
            facilityToUse = facilities[0]
          }
        }
      } catch (error) {
        console.error('Error searching facility by name:', error)
      }
    }
    // Ưu tiên 4: formData.location có thể là facility ID (ObjectId thường có 24 ký tự)
    else if (formData.location && typeof formData.location === 'string' && formData.location.length === 24 && /^[a-fA-F0-9]{24}$/.test(formData.location)) {
      // Có thể là ObjectId, thử fetch
      try {
        const result = await facilityApi.getFacilityById(formData.location)
        if (result.success && result.data) {
          facilityToUse = result.data
        }
      } catch (error) {
        console.error('Error fetching facility:', error)
      }
    }
    
    // Nếu đã có facility, gửi luôn
    if (facilityToUse) {
      await handleActivate(facilityToUse)
    } else {
      // Chưa có facility, mở modal để chọn
      setIsActivateModalOpen(true)
    }
  }

  const handleActivate = async (facility = null) => {
    const facilityToUse = facility || selectedActivateFacility
    
    if (!facilityToUse) {
      toast.error('Vui lòng chọn cơ sở thể thao')
      return
    }

    try {
      setActivating(true)
      
      const facilityId = facilityToUse._id || facilityToUse.id
      const facilityName = facilityToUse.name || tournament?.location || ''
      const facilityAddress = facilityToUse.address || tournament?.address || ''
      
      const updateData = {
        facility: facilityId,
        location: facilityName,
        address: facilityAddress,
        approvalStatus: 'pending'
      }
      
      const result = await leagueApi.updateLeague(id, updateData)
      
      if (result.success) {
        toast.success('Đã gửi đơn đăng ký giải đấu cho chủ sân thành công')
        setIsActivateModalOpen(false)
        setSelectedActivateFacility(null)
        setActivateFacilitySearchQuery('')
        if (refreshTournament) {
          refreshTournament()
        }
      } else {
        throw new Error(result.message || 'Gửi đơn đăng ký thất bại')
      }
    } catch (error) {
      console.error('Error activating league:', error)
      toast.error(error.message || 'Không thể gửi đơn đăng ký')
    } finally {
      setActivating(false)
    }
  }

  // Bắt đầu giải đấu (chuyển status từ upcoming sang ongoing)
  const handleStartTournament = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn bắt đầu giải đấu? Trạng thái sẽ chuyển sang "Đang diễn ra".')) {
      return
    }

    try {
      setStartingTournament(true)
      
      const result = await leagueApi.updateLeague(id, {
        status: 'ongoing'
      })
      
      if (result.success) {
        toast.success('Đã bắt đầu giải đấu thành công')
        if (refreshTournament) {
          refreshTournament()
        }
      } else {
        throw new Error(result.message || 'Không thể bắt đầu giải đấu')
      }
    } catch (error) {
      console.error('Error starting tournament:', error)
      toast.error(error.message || 'Không thể bắt đầu giải đấu')
    } finally {
      setStartingTournament(false)
    }
  }

  const tournamentFormats = [
    { value: 'single-elimination', label: 'Loại trực tiếp' },
    { value: 'round-robin', label: 'Vòng tròn' },
    { value: 'group-stage', label: 'Chia bảng đấu' },
    { value: 'knockout', label: 'Loại trực tiếp' }
  ]

  const canActivate = !tournament?.facility && tournament?.approvalStatus !== 'pending' && tournament?.approvalStatus !== 'approved'
  const isPending = tournament?.approvalStatus === 'pending'
  const isApproved = tournament?.approvalStatus === 'approved'
  const canStartTournament = tournament?.status === 'upcoming' && (isApproved || !tournament?.facility) // Có thể bắt đầu nếu đã được duyệt hoặc không cần duyệt

  if (!tournament) return null

  return (
    <div className="custom-tab-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Cấu hình giải đấu</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canActivate && !isEditing && (
            <button 
              className="btn-edit"
              onClick={handleActivateClick}
              disabled={activating}
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', opacity: activating ? 0.6 : 1 }}
            >
              {activating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                  Kích hoạt & Gửi đơn
                </>
              )}
            </button>
          )}
          {isPending && !isEditing && (
            <span style={{ 
              padding: '8px 16px', 
              backgroundColor: '#fef3c7', 
              color: '#92400e', 
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ⏳ Đang chờ chủ sân duyệt
            </span>
          )}
          {isApproved && !isEditing && (
            <span style={{ 
              padding: '8px 16px', 
              backgroundColor: '#d1fae5', 
              color: '#065f46', 
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ✓ Đã được duyệt
            </span>
          )}
          {canStartTournament && !isEditing && (
            <button 
              className="btn-edit"
              onClick={handleStartTournament}
              disabled={startingTournament}
              style={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                opacity: startingTournament ? 0.6 : 1 
              }}
            >
              {startingTournament ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }}></div>
                  Đang bắt đầu...
                </>
              ) : (
                <>
                  <Play size={16} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                  Bắt đầu giải đấu
                </>
              )}
            </button>
          )}
          {tournament?.status === 'ongoing' && !isEditing && (
            <span style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dbeafe', 
              color: '#1e40af', 
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ▶ Đang diễn ra
            </span>
          )}
          {!isEditing && (
            <button 
              className="btn-edit"
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form className="tournament-edit-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Section: Thông tin cơ bản */}
          <div className="collapsible-section">
            <div 
              className="section-header-expandable"
              onClick={() => toggleSection('basicInfo')}
            >
              {expandedSections.basicInfo ? <Minus size={20} /> : <Plus size={20} />}
              <span>Thông tin cơ bản</span>
            </div>
            
            {expandedSections.basicInfo && (
              <div className="section-content-expandable">
                <div className="basic-info-layout">
                  {/* Left: Image Upload */}
                  <div className="image-upload-section">
                    <label className="image-upload-label">Đổi hình giải đấu</label>
                    <div className="image-upload-container">
                      <img 
                        src={tournamentImage || '/sports-meeting.webp'} 
                        alt="Tournament" 
                        className="tournament-image-preview"
                      />
                      <label className="image-edit-button">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange('tournament', e)}
                          style={{ display: 'none' }}
                        />
                        <Pencil size={16} />
                      </label>
                    </div>
                  </div>

                  {/* Right: Form Fields */}
                  <div className="form-fields-section">
                    <div className="form-group">
                      <label>
                        Tên giải đấu <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập tên giải đấu"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Số điện thoại <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div className="form-group">
                      <label>Chế độ</label>
                      <select
                        name="mode"
                        value={formData.mode}
                        onChange={handleInputChange}
                      >
                        <option value="private">Riêng tư</option>
                        <option value="public">Công khai</option>
                      </select>
                    </div>
                    <div className="form-group facility-search-field">
                      <label>
                        Địa điểm <span className="required-asterisk">*</span>
                      </label>
                      <div className="facility-search-wrapper" ref={facilityDropdownRef}>
                        <input
                          type="text"
                          name="facilitySearch"
                          value={facilitySearchQuery}
                          onChange={handleFacilitySearchChange}
                          onFocus={() => {
                            if (facilitySearchResults.length > 0 || favoriteFacilities.length > 0) {
                              setShowFacilityDropdown(true)
                            }
                          }}
                          placeholder="Tìm theo tên cơ sở, quận huyện..."
                          required={!formData.location}
                          autoComplete="off"
                        />
                        {loadingFacilities && (
                          <div className="facility-search-loading">
                            <span>Đang tìm...</span>
                          </div>
                        )}
                        {showFacilityDropdown && (
                          <div className="facility-search-dropdown">
                            {!facilitySearchQuery.trim() && favoriteFacilities.length > 0 && (
                              <>
                                <div className="facility-search-section-header">
                                  <span className="facility-search-section-title">Sân yêu thích</span>
                                </div>
                                {favoriteFacilities.map((facility) => (
                                  <div
                                    key={facility._id || facility.id}
                                    className="facility-search-item facility-search-item-favorite"
                                    onClick={() => handleFacilitySelect(facility)}
                                  >
                                    <div className="facility-search-item-name">
                                      {facility.name}
                                      <span className="favorite-badge">★</span>
                                    </div>
                                    {facility.address && (
                                      <div className="facility-search-item-address">{facility.address}</div>
                                    )}
                                  </div>
                                ))}
                                {facilitySearchResults.length > 0 && (
                                  <div className="facility-search-divider"></div>
                                )}
                              </>
                            )}
                            {facilitySearchResults.length > 0 && (
                              <>
                                {!facilitySearchQuery.trim() && favoriteFacilities.length > 0 && (
                                  <div className="facility-search-section-header">
                                    <span className="facility-search-section-title">Kết quả tìm kiếm</span>
                                  </div>
                                )}
                                {facilitySearchResults.map((facility) => (
                                  <div
                                    key={facility._id || facility.id}
                                    className="facility-search-item"
                                    onClick={() => handleFacilitySelect(facility)}
                                  >
                                    <div className="facility-search-item-name">{facility.name}</div>
                                    {facility.address && (
                                      <div className="facility-search-item-address">{facility.address}</div>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}
                            {facilitySearchQuery.trim() && !loadingFacilities && facilitySearchResults.length === 0 && (
                              <div className="facility-search-empty">
                                Không tìm thấy cơ sở nào
                              </div>
                            )}
                            {!facilitySearchQuery.trim() && favoriteFacilities.length === 0 && !loadingFavorites && (
                              <div className="facility-search-empty">
                                Nhập để tìm kiếm cơ sở hoặc thêm sân vào yêu thích
                              </div>
                            )}
                          </div>
                        )}
                        <input
                          type="hidden"
                          name="location"
                          value={formData.location}
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="btn-update-cover"
                      onClick={() => document.getElementById('cover-image-input')?.click()}
                    >
                      <Upload size={16} />
                      Cập nhật ảnh bìa
                    </button>
                    <input
                      id="cover-image-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange('cover', e)}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                
                {/* Description Field */}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                  <label>Mô tả giải đấu</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Nhập mô tả về giải đấu..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#1f2937',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Thể thức và môn thi đấu */}
          <div className="collapsible-section">
            <div 
              className="section-header-expandable"
              onClick={() => toggleSection('formatSport')}
            >
              {expandedSections.formatSport ? <Minus size={20} /> : <Plus size={20} />}
              <span>Thể thức và môn thi đấu</span>
            </div>
            
            {expandedSections.formatSport && (
              <div className="section-content-expandable">
                <div className="form-row">
                  <div className="form-group">
                    <label>Môn thi đấu</label>
                    <select
                      name="sport"
                      value={formData.sport}
                      onChange={handleInputChange}
                      disabled={loadingCategories}
                    >
                      <option value="">Chọn môn thi đấu</option>
                      {sportCategories.map((category) => (
                        <option key={category._id || category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Thể thức thi đấu</label>
                    <select
                      name="format"
                      value={formData.format}
                      onChange={handleInputChange}
                    >
                      {tournamentFormats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button 
              className="btn-cancel"
              onClick={() => {
                setIsEditing(false)
                if (tournament) {
                  // Reset form data
                  const formatMapping = {
                    'Loại Trực Tiếp': 'single-elimination',
                    'Vòng tròn': 'round-robin'
                  }
                  
                  const locationName = tournament.location || ''
                  const locationAddress = tournament.address || ''
                  
                  setFormData({
                    name: tournament.name || '',
                    phone: tournament.phone || '',
                    mode: 'private',
                    location: locationName || '',
                    format: formatMapping[tournament.format] || tournament.format || 'single-elimination',
                    sport: tournament.sport || '',
                    description: tournament.description || tournament.fullDescription || ''
                  })
                  setTournamentImage(tournament.image || null)
                  setCoverImage(tournament.banner || tournament.image || null)
                  setImageFile(null)
                  setBannerFile(null)
                  
                  if (locationName || locationAddress) {
                    setFacilitySearchQuery(locationName ? `${locationName}${locationAddress ? ` - ${locationAddress}` : ''}` : locationAddress || '')
                  } else {
                    setFacilitySearchQuery('')
                  }
                  setSelectedFacility(null)
                }
              }}
            >
              Hủy
            </button>
            <button 
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      ) : (
        <div className="custom-content">
          {/* View mode - similar structure but read-only */}
          <div className="collapsible-section">
            <div 
              className="section-header-expandable"
              onClick={() => toggleSection('basicInfo')}
            >
              {expandedSections.basicInfo ? <Minus size={20} /> : <Plus size={20} />}
              <span>Thông tin cơ bản</span>
            </div>
            
            {expandedSections.basicInfo && (
              <div className="section-content-expandable">
                <div className="basic-info-layout">
                  <div className="image-upload-section">
                    <label className="image-upload-label">Hình giải đấu</label>
                    <div className="image-upload-container">
                      <img 
                        src={tournamentImage || tournament.image || '/sports-meeting.webp'} 
                        alt="Tournament" 
                        className="tournament-image-preview"
                      />
                    </div>
                  </div>
                  <div className="form-fields-section">
                    <div className="info-display">
                      <div className="info-row">
                        <strong>Tên giải đấu:</strong>
                        <span>{tournament.name || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="info-row">
                        <strong>Số điện thoại:</strong>
                        <span>{tournament.contact?.phone || tournament.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="info-row">
                        <strong>Chế độ:</strong>
                        <span>
                          {tournament.type === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>
                      <div className="info-row">
                        <strong>Địa điểm:</strong>
                        <span>{tournament.address || tournament.location || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="info-display" style={{ marginTop: '16px', gridColumn: '1 / -1' }}>
                  <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <strong>Mô tả giải đấu:</strong>
                    <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {tournament.description || tournament.fullDescription || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="collapsible-section">
            <div 
              className="section-header-expandable"
              onClick={() => toggleSection('formatSport')}
            >
              {expandedSections.formatSport ? <Minus size={20} /> : <Plus size={20} />}
              <span>Thể thức và môn thi đấu</span>
            </div>
            
            {expandedSections.formatSport && (
              <div className="section-content-expandable">
                <div className="info-display">
                  <div className="info-row">
                    <strong>Môn thi đấu:</strong>
                    <span>{tournament.sport || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="info-row">
                    <strong>Thể thức thi đấu:</strong>
                    <span>
                      {tournament.format === 'knockout' || tournament.format === 'single-elimination' ? 'Loại trực tiếp' :
                       tournament.format === 'round-robin' ? 'Vòng tròn' :
                       tournament.format === 'group-stage' ? 'Chia bảng đấu' :
                       tournament.format || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isActivateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ position: 'fixed' }}>
          <div className="bg-white rounded-lg max-w-md w-full mx-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Kích hoạt & Gửi đơn đăng ký</h2>
                <button
                  onClick={() => {
                    setIsActivateModalOpen(false)
                    setSelectedActivateFacility(null)
                    setActivateFacilitySearchQuery('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  style={{ fontSize: '24px', lineHeight: '1', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn cơ sở thể thao <span className="text-red-500">*</span>
                  </label>
                  <div className="facility-search-wrapper" ref={activateFacilityDropdownRef} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={activateFacilitySearchQuery}
                      onChange={handleActivateFacilitySearchChange}
                      onFocus={() => {
                        if (activateFacilitySearchResults.length > 0 || activateFavoriteFacilities.length > 0) {
                          setShowActivateFacilityDropdown(true)
                        }
                      }}
                      placeholder="Tìm theo tên cơ sở, quận huyện..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoComplete="off"
                      style={{ width: '100%' }}
                    />
                    {loadingActivateFacilities && (
                      <div className="text-sm text-gray-500 mt-1">Đang tìm...</div>
                    )}
                    {showActivateFacilityDropdown && (
                      <div style={{
                        position: 'absolute',
                        zIndex: 10,
                        width: '100%',
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        maxHeight: '240px',
                        overflowY: 'auto'
                      }}>
                        {!activateFacilitySearchQuery.trim() && activateFavoriteFacilities.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                              Sân yêu thích
                            </div>
                            {activateFavoriteFacilities.map((facility) => (
                              <div
                                key={facility._id || facility.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                                onClick={() => handleActivateFacilitySelect(facility)}
                              >
                                <div className="font-medium">
                                  {facility.name}
                                  <span className="text-yellow-500 ml-1">★</span>
                                </div>
                                {facility.address && (
                                  <div className="text-sm text-gray-500">{facility.address}</div>
                                )}
                              </div>
                            ))}
                            {activateFacilitySearchResults.length > 0 && (
                              <div className="border-t border-gray-200"></div>
                            )}
                          </>
                        )}
                        {activateFacilitySearchResults.length > 0 && (
                          <>
                            {!activateFacilitySearchQuery.trim() && activateFavoriteFacilities.length > 0 && (
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                                Kết quả tìm kiếm
                              </div>
                            )}
                            {activateFacilitySearchResults.map((facility) => (
                              <div
                                key={facility._id || facility.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleActivateFacilitySelect(facility)}
                              >
                                <div className="font-medium">{facility.name}</div>
                                {facility.address && (
                                  <div className="text-sm text-gray-500">{facility.address}</div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                        {activateFacilitySearchQuery.trim() && !loadingActivateFacilities && activateFacilitySearchResults.length === 0 && (
                          <div className="px-3 py-4 text-center text-gray-500 text-sm">
                            Không tìm thấy cơ sở nào
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedActivateFacility && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm font-medium text-green-800">
                        Đã chọn: {selectedActivateFacility.name}
                      </div>
                      {selectedActivateFacility.address && (
                        <div className="text-xs text-green-600 mt-1">
                          {selectedActivateFacility.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <strong>Lưu ý:</strong> Sau khi gửi đơn, chủ sân sẽ xem xét và duyệt giải đấu của bạn. 
                  Bạn sẽ nhận được thông báo khi có kết quả.
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsActivateModalOpen(false)
                      setSelectedActivateFacility(null)
                      setActivateFacilitySearchQuery('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    disabled={activating}
                    style={{ border: 'none', cursor: activating ? 'not-allowed' : 'pointer' }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleActivate}
                    disabled={activating || !selectedActivateFacility}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ border: 'none' }}
                  >
                    {activating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gửi đơn đăng ký
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigTab

