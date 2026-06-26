import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Pencil, HelpCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { categoryApi } from '../../../api/categoryApi'
import { facilityApi } from '../../../api/facilityApi'
import { userApi } from '../../../api/userApi'
import { leagueApi } from '../../../api/leagueApi'
import { useAuth } from '../../../contexts/AuthContext'
import useClickOutside from '../../../hook/use-click-outside'
import '../../../styles/CreateTournament.css'

const CreateTournament = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const facilityIdFromUrl = searchParams.get('facility')
  
  const [formData, setFormData] = useState({
    image: null,
    name: '',
    description: '',
    phone: '',
    mode: 'private', // private or public
    location: '',
    type: 'individual', // team or individual
    sport: '', // selected sport category
    courtType: '', // selected court type
    format: 'single-elimination', // tournament format
    numParticipants: 4, // Mặc định 4 cho single-elimination (min)
    membersPerTeam: 2, // số lượng người mỗi đội
    startDate: '',
    endDate: '',
    allowRegistration: false,
    registrationDeadline: '',
    // Cấu hình cho vòng tròn
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    numRounds: 1
  })

  const [imagePreview, setImagePreview] = useState(null)
  const [sportCategories, setSportCategories] = useState([])
  const [loadingSports, setLoadingSports] = useState(false)
  const [courtTypes, setCourtTypes] = useState([])
  const [loadingCourtTypes, setLoadingCourtTypes] = useState(false)
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('')
  const [facilitySearchResults, setFacilitySearchResults] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [favoriteFacilities, setFavoriteFacilities] = useState([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFacilityLocked, setIsFacilityLocked] = useState(false) // Track if facility is locked from URL
  const facilityDropdownRef = useClickOutside(() => {
    setShowFacilityDropdown(false)
  }, showFacilityDropdown)

  // Fetch sport categories
  useEffect(() => {
    const fetchSportCategories = async () => {
      try {
        setLoadingSports(true)
        const result = await categoryApi.getSportCategories({ status: 'active' })
        if (result.success && result.data) {
          setSportCategories(result.data)
        }
      } catch (error) {
        console.error('Error fetching sport categories:', error)
        toast.error('Không thể tải danh sách môn thể thao')
      } finally {
        setLoadingSports(false)
      }
    }

    fetchSportCategories()
  }, [])

  // Search facilities with debounce
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

  // Fetch favorite facilities
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
        // Không hiển thị toast vì đây là optional feature
        setFavoriteFacilities([])
      } finally {
        setLoadingFavorites(false)
      }
    }

    fetchFavorites()
  }, [])

  // Load facility from URL params
  useEffect(() => {
    if (facilityIdFromUrl) {
      const loadFacility = async () => {
        try {
          const result = await facilityApi.getFacilityById(facilityIdFromUrl)
          if (result.success && result.data) {
            const facility = result.data
            
            // Verify facility belongs to owner if user is owner
            if (user && (user.role === 'owner' || user.role === 'admin')) {
              const facilityOwnerId = facility.owner?._id || facility.owner?.id || facility.owner
              const userId = user._id || user.id
              
              if (facilityOwnerId && String(facilityOwnerId) !== String(userId) && user.role !== 'admin') {
                toast.error('Bạn không có quyền tạo giải đấu cho cơ sở này')
                navigate('/tournament/create')
                return
              }
            }
            
            setSelectedFacility(facility)
            setFormData(prev => ({ ...prev, location: facility._id || facility.id || facility.name || '' }))
            setFacilitySearchQuery(facility.name + (facility.address ? ` - ${facility.address}` : ''))
            setIsFacilityLocked(true) // Lock the facility field
          }
        } catch (error) {
          console.error('Error loading facility:', error)
          toast.error('Không thể tải thông tin cơ sở')
        }
      }
      loadFacility()
    }
  }, [facilityIdFromUrl, user, navigate])

  const tournamentFormats = [
    { id: 'single-elimination', icon: '⚔️', label: 'Loại trực tiếp' },
    { id: 'round-robin', icon: '🔁', label: 'Vòng tròn' }
  ]

  // Fetch court types based on sport and facility
  useEffect(() => {
    const fetchCourtTypes = async () => {
      if (!formData.sport || !selectedFacility) {
        setCourtTypes([])
        setFormData(prev => ({ ...prev, courtType: '' }))
        return
      }
      
      try {
        setLoadingCourtTypes(true)
        // Tìm sport category để lấy ID
        const sportCategory = sportCategories.find(cat => cat.name === formData.sport)
        if (!sportCategory) {
          setCourtTypes([])
          return
        }
        
        const sportCategoryId = sportCategory._id || sportCategory.id
        const result = await categoryApi.getCourtTypes({ 
          sportCategory: sportCategoryId,
          status: 'active' 
        })
        
        if (result.success) {
          const types = Array.isArray(result.data) 
            ? result.data 
            : result.data?.courtTypes || []
          setCourtTypes(types)
          
          // Reset courtType nếu loại sân hiện tại không còn trong danh sách
          if (formData.courtType) {
            const currentTypeExists = types.some(
              type => (type._id || type.id) === formData.courtType
            )
            if (!currentTypeExists) {
              setFormData(prev => ({ ...prev, courtType: '' }))
            }
          }
        }
      } catch (error) {
        console.error('Error fetching court types:', error)
        setCourtTypes([])
      } finally {
        setLoadingCourtTypes(false)
      }
    }

    fetchCourtTypes()
  }, [formData.sport, selectedFacility, sportCategories])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseInt(value) || 0) : value)
      }
      // Khi chọn "Công khai", tự động bật cho phép đăng ký
      if (name === 'mode' && value === 'public') {
        newData.allowRegistration = true
      }
      // Khi chọn "Riêng tư", tắt cho phép đăng ký
      if (name === 'mode' && value === 'private') {
        newData.allowRegistration = false
        newData.registrationDeadline = ''
      }
      // Khi thay đổi sport, reset courtType
      if (name === 'sport') {
        newData.courtType = ''
      }
      // Khi format thay đổi, điều chỉnh numParticipants nếu cần
      if (name === 'format') {
        if (value === 'single-elimination') {
          // Đấu loại trực tiếp: 4-16 đội
          if (prev.numParticipants < 4) {
            newData.numParticipants = 4
          } else if (prev.numParticipants > 16) {
            newData.numParticipants = 16
          }
        } else if (value === 'round-robin') {
          // Đấu vòng tròn: 2-6 đội
          if (prev.numParticipants > 6) {
            newData.numParticipants = 6
          } else if (prev.numParticipants < 2) {
            newData.numParticipants = 2
          }
        }
      }
      return newData
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB')
        return
      }
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }



  const handleFacilitySelect = (facility) => {
    setSelectedFacility(facility)
    setFormData(prev => ({ ...prev, location: facility._id || facility.id }))
    setFacilitySearchQuery(facility.name + (facility.address ? ` - ${facility.address}` : ''))
    setShowFacilityDropdown(false)
  }

  const handleFacilitySearchChange = (e) => {
    // Prevent changes if facility is locked from URL
    if (isFacilityLocked) {
      return
    }
    const value = e.target.value
    setFacilitySearchQuery(value)
    if (!value.trim()) {
      setSelectedFacility(null)
      setFormData(prev => ({ ...prev, location: '' }))
      setShowFacilityDropdown(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên giải đấu')
      return
    }
    if (!formData.location) {
      toast.error('Vui lòng chọn sân')
      return
    }
    if (!formData.startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu')
      return
    }
    if (!formData.endDate) {
      toast.error('Vui lòng chọn ngày kết thúc')
      return
    }
    // Validation cho hạn chót đăng ký khi chọn công khai
    if (formData.mode === 'public' && !formData.registrationDeadline) {
      toast.error('Vui lòng chọn hạn chót đăng ký cho giải đấu công khai')
      return
    }
    // Validate date range
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
    // Validation số đội theo format
    if (formData.format === 'single-elimination') {
      if (formData.numParticipants < 4 || formData.numParticipants > 16) {
        toast.error('Đấu loại trực tiếp: Số đội phải từ 4 đến 16')
        return
      }
    } else if (formData.format === 'round-robin') {
      if (formData.numParticipants < 2 || formData.numParticipants > 6) {
        toast.error('Đấu vòng tròn: Số đội phải từ 2 đến 6')
        return
      }
    } else {
      if (formData.numParticipants < 2) {
        toast.error('Số đội tham gia phải ít nhất 2')
        return
      }
    }
    if (!formData.sport) {
      toast.error('Vui lòng chọn môn thể thao')
      return
    }
    if (!formData.courtType) {
      toast.error('Vui lòng chọn loại sân')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Map format từ frontend sang backend
      const formatMapping = {
        'single-elimination': 'Loại Trực Tiếp',
        'round-robin': 'Vòng tròn'
      }

      // 2. Combine date với time mặc định (00:00:00) thành ISO datetime
      const startDateTime = `${formData.startDate}T00:00:00`
      const endDateTime = `${formData.endDate}T23:59:59`

      // 3. Lấy thông tin facility
      const facilityName = selectedFacility?.name || ''
      const facilityAddress = selectedFacility?.address || ''
      const facilityId = selectedFacility?._id || selectedFacility?.id || facilityIdFromUrl || null

      // 4. Prepare request body
      const requestBody = {
        name: formData.name.trim(),
        format: formatMapping[formData.format] || formData.format,
        sport: formData.sport,
        phone: user?.phone || null,
        tournamentType: formData.type, // 'team' | 'individual'
        membersPerTeam: formData.membersPerTeam,
        startDate: startDateTime,
        endDate: endDateTime,
        location: facilityName,
        address: facilityAddress,
        maxParticipants: formData.numParticipants,
        description: formData.description.trim() || null,
        fullDescription: formData.description.trim() || null,
        registrationDeadline: formData.mode === 'public' && formData.registrationDeadline
          ? `${formData.registrationDeadline}T23:59:59`
          : null,
        type: formData.mode === 'public' ? 'PUBLIC' : 'PRIVATE', // Map mode to type
        teams: [],
        matches: []
      }

      // Thêm courtType nếu có
      if (formData.courtType) {
        requestBody.courtType = formData.courtType
      }

      // Thêm cấu hình vòng tròn nếu format là round-robin
      if (formData.format === 'round-robin') {
        requestBody.winPoints = formData.winPoints
        requestBody.drawPoints = formData.drawPoints
        requestBody.lossPoints = formData.lossPoints
        requestBody.numRounds = formData.numRounds
      }

      // Nếu có facility ID, thêm vào request body
      if (facilityId) {
        requestBody.facility = facilityId
        // Nếu có facility, giải đấu sẽ tự động có approvalStatus: "pending"
      }

      // 5. Create league first
      const result = await leagueApi.createLeague(requestBody)
      
      if (!result.success) {
        throw new Error(result.message || 'Tạo giải đấu thất bại')
      }

      const leagueId = result.data._id || result.data.id

      // 6. Upload image if exists
      if (formData.image && leagueId) {
        try {
          const uploadResult = await leagueApi.uploadImage(leagueId, formData.image)
          if (uploadResult.success && uploadResult.data) {
            // Update league with image URL
            await leagueApi.updateLeague(leagueId, {
              image: uploadResult.data.image || uploadResult.data.imageUrl,
              banner: uploadResult.data.image || uploadResult.data.imageUrl
            })
          }
        } catch (uploadError) {
          // Log error but don't block success
          console.error('Error uploading image:', uploadError)
          toast.warning('Tạo giải đấu thành công nhưng upload ảnh thất bại. Bạn có thể upload ảnh sau.')
        }
      }

      toast.success('Tạo giải đấu thành công!')
      navigate(`/tournament/${leagueId}`)
    } catch (error) {
      console.error('Error creating tournament:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi tạo giải đấu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-tournament-page">
      <div className="create-tournament-container">
        <form onSubmit={handleSubmit} className="tournament-form">
          {/* Header */}
          <div className="create-tournament-header">
            <div className="header-left">
              <h1>Tạo Giải</h1>
              <p className="header-subtitle">
                Vui lòng nhập thông tin hợp lệ cho các trường được yêu cầu
              </p>
            </div>
            <button className="help-button" type="button">
              <HelpCircle size={18} />
              <span>Hướng dẫn</span>
            </button>
          </div>
          {/* Basic Information Section */}
          <div className="form-section">
            <div className="form-row">
              {/* Image Upload */}
              <div className="image-upload-container">
                <label className="image-upload-label">Hình giải đấu</label>
                <div className="image-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                    id="tournament-image"
                  />
                  <label htmlFor="tournament-image" className="image-upload-area">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Tournament preview" className="uploaded-image" />
                        <div className="edit-overlay">
                          <Pencil size={16} />
                        </div>
                      </>
                    ) : (
                      <div className="upload-placeholder">
                        <img 
                          src="/givetour-compact.png" 
                          alt="Tournament default" 
                          className="default-tournament-image"
                        />
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-fields-group">
                <div className="form-field">
                  <label htmlFor="name">
                    Tên giải đấu <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên giải đấu"
                    required
                  />
                </div>

                {/* Sport Selection */}
                <div className="form-field">
                  <label htmlFor="sport">
                    Môn thể thao <span className="required">*</span>
                  </label>
                  <select
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn môn thể thao --</option>
                    {sportCategories.map((sport) => (
                      <option key={sport._id || sport.id} value={sport.name}>
                        {sport.icon ? `${sport.icon} ` : ''}{sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Competition Format */}
                <div className="form-field">
                  <label htmlFor="format">
                    Hình thức thi đấu <span className="required">*</span>
                  </label>
                  <select
                    id="format"
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    required
                  >
                    {tournamentFormats.map((format) => (
                      <option key={format.id} value={format.id}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Court Type Selection */}
                {formData.sport && selectedFacility && (
                  <div className="form-field">
                    <label htmlFor="courtType">
                      Loại sân {formData.sport ? <span className="required">*</span> : ''}
                    </label>
                    <select
                      id="courtType"
                      name="courtType"
                      value={formData.courtType}
                      onChange={handleInputChange}
                      required={!!formData.sport}
                      disabled={loadingCourtTypes}
                    >
                      <option value="">
                        {loadingCourtTypes ? 'Đang tải...' : '-- Chọn loại sân --'}
                      </option>
                      {courtTypes.map((courtType) => (
                        <option key={courtType._id || courtType.id} value={courtType._id || courtType.id}>
                          {courtType.name}
                          {courtType.description ? ` - ${courtType.description}` : ''}
                        </option>
                      ))}
                    </select>
                    {formData.sport && courtTypes.length === 0 && !loadingCourtTypes && (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Không có loại sân nào cho môn thể thao này
                      </p>
                    )}
                  </div>
                )}

                {/* Cấu hình cho vòng tròn */}
                {formData.format === 'round-robin' && (
                  <div style={{ 
                    gridColumn: '1 / -1',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '16px'
                  }}>
                    {/* Điểm số */}
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#111827',
                        marginBottom: '12px'
                      }}>
                        Cấu hình điểm số
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '12px' 
                      }}>
                        <div>
                          <label htmlFor="winPoints" style={{ 
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                          }}>
                            Điểm thắng <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            id="winPoints"
                            name="winPoints"
                            min="0"
                            value={formData.winPoints}
                            onChange={handleInputChange}
                            required
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor="drawPoints" style={{ 
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                          }}>
                            Điểm hòa <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            id="drawPoints"
                            name="drawPoints"
                            min="0"
                            value={formData.drawPoints}
                            onChange={handleInputChange}
                            required
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor="lossPoints" style={{ 
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                          }}>
                            Điểm thua <span className="required">*</span>
                          </label>
                          <input
                            type="number"
                            id="lossPoints"
                            name="lossPoints"
                            min="0"
                            value={formData.lossPoints}
                            onChange={handleInputChange}
                            required
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Số lượt đá */}
                    <div>
                      <label style={{ 
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '12px'
                      }}>
                        Số lượt đá vòng tròn <span className="required">*</span>
                      </label>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {[1, 2, 3, 4].map((round) => (
                          <button
                            key={round}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, numRounds: round }))}
                            style={{
                              padding: '10px 20px',
                              border: formData.numRounds === round 
                                ? '2px solid #3b82f6' 
                                : '1px solid #d1d5db',
                              borderRadius: '6px',
                              background: formData.numRounds === round 
                                ? '#eff6ff' 
                                : '#fff',
                              color: formData.numRounds === round 
                                ? '#3b82f6' 
                                : '#374151',
                              fontWeight: formData.numRounds === round ? '600' : '500',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (formData.numRounds !== round) {
                                e.target.style.background = '#f9fafb'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (formData.numRounds !== round) {
                                e.target.style.background = '#fff'
                              }
                            }}
                          >
                            {round} lượt
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hiển thị số trận đấu */}
                    <div style={{ 
                      marginTop: '16px',
                      padding: '12px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>ⓘ</span>
                      <span>
                        Đối với cấu hình này thì số lượng trận đấu của giải là:{' '}
                        <strong style={{ fontSize: '16px', fontWeight: '700' }}>
                          {(() => {
                            const n = formData.numParticipants || 2
                            // Công thức: n*(n-1)/2 * số lượt (vòng tròn)
                            const matchesPerRound = (n * (n - 1)) / 2
                            const totalMatches = matchesPerRound * formData.numRounds
                            return Math.round(totalMatches)
                          })()}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Number of Participants */}
                <div className="form-field">
                  <label htmlFor="numParticipants">
                    Số đội tham gia <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="numParticipants"
                    name="numParticipants"
                    value={formData.numParticipants || ''}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value === '' || isNaN(parseInt(value))) {
                        const min = formData.format === 'single-elimination' ? 4 : 2
                        setFormData(prev => ({ ...prev, numParticipants: min }))
                      }
                    }}
                    min={formData.format === 'single-elimination' ? 4 : 2}
                    max={formData.format === 'single-elimination' ? 16 : 6}
                    required
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    marginTop: '4px' 
                  }}>
                    {formData.format === 'single-elimination' 
                      ? 'Đấu loại trực tiếp: 4-16 đội'
                      : formData.format === 'round-robin'
                      ? 'Đấu vòng tròn: 2-6 đội'
                      : 'Tối thiểu 2 đội'
                    }
                  </div>
                </div>

                {/* Members Per Team */}
                <div className="form-field">
                  <label htmlFor="membersPerTeam">
                    Số thành viên mỗi đội
                  </label>
                  <input
                    type="number"
                    id="membersPerTeam"
                    name="membersPerTeam"
                    value={formData.membersPerTeam || ''}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value === '' || isNaN(parseInt(value))) {
                        setFormData(prev => ({ ...prev, membersPerTeam: 1 }))
                      }
                    }}
                    min="1"
                    placeholder="Nhập số thành viên"
                  />
                </div>

                <div className="form-row-inline">
                  <div className="form-field">
                    <label htmlFor="mode">Chế độ</label>
                    <select
                      id="mode"
                      name="mode"
                      value={formData.mode}
                      onChange={handleInputChange}
                    >
                      <option value="private">Riêng tư</option>
                      <option value="public">Công khai</option>
                    </select>
                  </div>

                  {formData.mode === 'public' && (
                    <div className="form-field">
                      <label htmlFor="registrationDeadline">
                        Hạn chót đăng ký <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="registrationDeadline"
                        name="registrationDeadline"
                        value={formData.registrationDeadline}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Tournament Date & Time */}
                <div className="form-row-inline">
                  <div className="form-field">
                    <label htmlFor="startDate">
                      Ngày bắt đầu <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="endDate">
                      Ngày kết thúc <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-field facility-search-field">
                  <label htmlFor="facilitySearch">
                    Địa điểm <span className="required">*</span>
                    {isFacilityLocked && (
                      <span style={{ 
                        marginLeft: 8, 
                        fontSize: 12, 
                        color: '#6b7280', 
                        fontWeight: 'normal' 
                      }}>
                        (Đã khóa)
                      </span>
                    )}
                  </label>
                  <div className="facility-search-wrapper" ref={facilityDropdownRef}>
                    <input
                      type="text"
                      id="facilitySearch"
                      name="facilitySearch"
                      value={facilitySearchQuery}
                      onChange={handleFacilitySearchChange}
                      onFocus={() => {
                        if (!isFacilityLocked && (facilitySearchResults.length > 0 || favoriteFacilities.length > 0)) {
                          setShowFacilityDropdown(true)
                        }
                      }}
                      placeholder={isFacilityLocked ? "Địa điểm đã được chọn" : "Tìm theo tên cơ sở, quận huyện..."}
                      required={!formData.location}
                      autoComplete="off"
                      disabled={isFacilityLocked}
                      style={{
                        cursor: isFacilityLocked ? 'not-allowed' : 'text',
                        backgroundColor: isFacilityLocked ? '#f3f4f6' : '#fff',
                        opacity: isFacilityLocked ? 0.7 : 1
                      }}
                    />
                    {loadingFacilities && (
                      <div className="facility-search-loading">
                        <span>Đang tìm...</span>
                      </div>
                    )}
                    {showFacilityDropdown && (
                      <div className="facility-search-dropdown">
                        {/* Favorite Facilities Section */}
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

                        {/* Search Results Section */}
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

                        {/* Empty State */}
                        {facilitySearchQuery.trim() && !loadingFacilities && facilitySearchResults.length === 0 && (
                          <div className="facility-search-empty">
                            Không tìm thấy cơ sở nào
                          </div>
                        )}

                        {/* No Favorites and No Search */}
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
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="form-section">
            <div className="form-field">
              <label htmlFor="description">
                Mô tả giải đấu
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Nhập mô tả về giải đấu..."
                rows="4"
              />
            </div>
          </div>


          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo giải đấu...' : 'Tạo giải'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

export default CreateTournament

