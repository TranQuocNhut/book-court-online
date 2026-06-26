import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../../contexts/AuthContext'
import { paymentApi } from '../../../api/paymentApi'
import { walletApi } from '../../../api/walletApi'
import { leagueApi } from '../../../api/leagueApi'
import { userApi } from '../../../api/userApi'
import { facilityApi } from '../../../api/facilityApi'
import { categoryApi } from '../../../api/categoryApi'
import PaymentMethods from '../Payment/components/PaymentMethods'
import { paymentMethods } from '../Payment/constants'
import '../../../styles/Payment.css'

const InternalTournamentPayment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Lấy dữ liệu từ location state (từ CreateInternalTournament)
  const tournamentData = location.state?.tournamentData || null
  
  // Filter bỏ phương thức thanh toán tiền mặt (cash) vì giải đấu cần đặt trước
  const availablePaymentMethods = paymentMethods.filter(method => method.id !== 'cash')
  
  const [selectedMethod, setSelectedMethod] = useState('wallet')
  const [walletBalance, setWalletBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Phí từ cấu hình (có thể lấy từ API hoặc localStorage)
  const [fees, setFees] = useState({
    serviceFee: 0, // Phí tạo giải
    courtTypeFees: {}, // Phí sử dụng sân cho từng loại sân
    refereeFee: 0 // Phí trọng tài
  })
  
  const [loadingFees, setLoadingFees] = useState(true)
  const [courtTypes, setCourtTypes] = useState([])

  useEffect(() => {
    if (!tournamentData) {
      toast.error('Không tìm thấy thông tin giải đấu')
      navigate('/tournament/create/internal')
      return
    }
    
    fetchWalletBalance()
    fetchFees()
    fetchCourtTypes()
  }, [])

  const fetchCourtTypes = async () => {
    if (!tournamentData?.sport || !tournamentData?.courtType) return
    
    try {
      // Tìm sport category để lấy ID
      const categoriesResult = await categoryApi.getSportCategories({ status: 'active' })
      if (categoriesResult.success) {
        const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : []
        const sportCategory = categories.find(cat => cat.name === tournamentData.sport)
        
        if (sportCategory) {
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
          }
        }
      }
    } catch (error) {
      console.error('Error fetching court types:', error)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      setLoadingBalance(true)
      const result = await walletApi.getBalance()
      if (result.success) {
        setWalletBalance(result.data.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      setWalletBalance(0)
    } finally {
      setLoadingBalance(false)
    }
  }

  const fetchFees = async () => {
    try {
      setLoadingFees(true)
      
      // Lấy phí từ owner của facility (nếu có facility)
      // Nếu không có facility, lấy từ user hiện tại (fallback)
      let result = null
      
      if (tournamentData?.selectedFacility) {
        const facilityId = tournamentData.selectedFacility._id || tournamentData.selectedFacility.id
        if (facilityId) {
          try {
            result = await facilityApi.getTournamentFeeConfig(facilityId)
          } catch (facilityError) {
            console.error('Error fetching fees from facility owner:', facilityError)
            // Fallback: lấy từ user hiện tại nếu có lỗi
            if (user?.role === 'owner') {
              try {
                result = await userApi.getTournamentFeeConfig()
              } catch (userError) {
                console.error('Error fetching fees from user:', userError)
              }
            }
          }
        }
      } else if (user?.role === 'owner') {
        // Nếu không có facility nhưng user là owner, lấy từ user
        result = await userApi.getTournamentFeeConfig()
      }
      
      if (result && result.success && result.data) {
        const config = result.data
        if (config.internalTournamentFees) {
          const courtTypeFees = config.internalTournamentFees.courtTypeFees || {}
          setFees({
            serviceFee: config.internalTournamentFees.serviceFee || 0,
            courtTypeFees: courtTypeFees,
            refereeFee: config.internalTournamentFees.refereeFee || 0
          })
        } else {
          // Giá trị mặc định nếu chưa có config
          setFees({
            serviceFee: 50000,
            courtTypeFees: {},
            refereeFee: 100000
          })
        }
      } else {
        // Giá trị mặc định nếu không có config
        setFees({
          serviceFee: 50000,
          courtTypeFees: {},
          refereeFee: 100000
        })
      }
    } catch (error) {
      console.error('Error fetching fees:', error)
      // Sử dụng giá trị mặc định nếu có lỗi
      setFees({
        serviceFee: 50000,
        courtTypeFees: {},
        refereeFee: 100000
      })
      // Không hiển thị toast vì đây có thể là lần đầu, chưa có config
    } finally {
      setLoadingFees(false)
    }
  }

  // Tính số trận dựa trên format
  const calculateEstimatedMatches = () => {
    const numTeams = tournamentData.numParticipants || 2
    
    if (tournamentData.format === 'round-robin') {
      // Vòng tròn: n*(n-1)/2 * số lượt
      const numRounds = tournamentData.numRounds || 1
      const matchesPerRound = (numTeams * (numTeams - 1)) / 2
      return matchesPerRound * numRounds
    } else {
      // Loại trực tiếp: n - 1
      return numTeams - 1
    }
  }

  // Tính tổng phí
  const calculateTotal = () => {
    let total = fees.serviceFee || 0
    
    // Tính số trận dựa trên format
    const estimatedMatches = calculateEstimatedMatches()
    
    // Tính phí sử dụng sân nếu có chọn loại sân
    let courtFee = 0
    if (tournamentData?.courtType && fees.courtTypeFees) {
      const courtTypeFee = fees.courtTypeFees[tournamentData.courtType]
      if (courtTypeFee) {
        const hoursPerMatch = 1.5 // Ước tính mỗi trận 1.5 giờ
        const totalHours = estimatedMatches * hoursPerMatch
        courtFee = courtTypeFee * totalHours
        total += courtFee
      }
    }
    
    // Tính phí trọng tài dựa trên số trận ước tính
    if (fees.refereeFee && fees.refereeFee > 0) {
      const refereeTotal = fees.refereeFee * estimatedMatches
      total += refereeTotal
    }
    
    return Math.round(total)
  }

  const totalAmount = calculateTotal()

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0'
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán')
      return
    }

    if (selectedMethod === 'wallet' && walletBalance < totalAmount) {
      toast.error('Số dư ví không đủ. Vui lòng nạp thêm tiền')
      return
    }

    setIsProcessing(true)

    try {
      // Tạo giải đấu trước
      const formatMapping = {
        'single-elimination': 'Loại Trực Tiếp',
        'round-robin': 'Vòng tròn'
      }

      const startDateTime = `${tournamentData.startDate}T00:00:00`
      const endDateTime = `${tournamentData.endDate}T23:59:59`

      const facilityName = tournamentData.selectedFacility?.name || ''
      const facilityAddress = tournamentData.selectedFacility?.address || ''
      const facilityId = tournamentData.selectedFacility?._id || tournamentData.selectedFacility?.id || null

      const requestBody = {
        name: tournamentData.name.trim(),
        format: formatMapping[tournamentData.format] || tournamentData.format,
        sport: tournamentData.sport,
        phone: tournamentData.phone.trim(),
        tournamentType: tournamentData.type,
        membersPerTeam: tournamentData.membersPerTeam,
        startDate: startDateTime,
        endDate: endDateTime,
        location: facilityName || null,
        address: facilityAddress || null,
        maxParticipants: tournamentData.numParticipants,
        description: tournamentData.description?.trim() || null,
        fullDescription: tournamentData.description?.trim() || null,
        type: 'PRIVATE',
        teams: [],
        matches: []
      }

      if (facilityId) {
        requestBody.facility = facilityId
      }

      // Tạo giải đấu
      const leagueResult = await leagueApi.createLeague(requestBody)
      
      if (!leagueResult.success) {
        throw new Error(leagueResult.message || 'Tạo giải đấu thất bại')
      }

      const leagueId = leagueResult.data._id || leagueResult.data.id

      // Upload image nếu có
      if (tournamentData.image && leagueId) {
        try {
          const uploadResult = await leagueApi.uploadImage(leagueId, tournamentData.image)
          if (uploadResult.success && uploadResult.data) {
            await leagueApi.updateLeague(leagueId, {
              image: uploadResult.data.image || uploadResult.data.imageUrl,
              banner: uploadResult.data.image || uploadResult.data.imageUrl
            })
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
        }
      }

      // Xử lý thanh toán
      if (selectedMethod === 'wallet') {
        // Thanh toán bằng ví - sử dụng API để trừ tiền
        try {
          // TODO: Tạo API endpoint để thanh toán phí giải đấu bằng ví
          // Tạm thời: Tạo payment record và cập nhật wallet balance
          // Giả sử có API endpoint: POST /api/leagues/:id/pay-fee
          const paymentResult = await paymentApi.payTournamentFee(leagueId, totalAmount)
          
          if (paymentResult.success) {
            toast.success('Thanh toán thành công! Giải đấu đã được tạo.')
            // Cập nhật số dư ví local
            if (walletBalance !== null) {
              setWalletBalance(walletBalance - totalAmount)
            }
            navigate(`/tournament/${leagueId}`)
          } else {
            throw new Error(paymentResult.message || 'Thanh toán thất bại')
          }
        } catch (error) {
          console.error('Payment error:', error)
          toast.error(error.message || 'Thanh toán thất bại')
          // Xóa giải đấu nếu thanh toán thất bại
          try {
            await leagueApi.deleteLeague(leagueId)
          } catch (deleteError) {
            console.error('Error deleting league:', deleteError)
          }
        }
      } else if (selectedMethod === 'momo' || selectedMethod === 'vnpay') {
        // Thanh toán qua MoMo hoặc VNPay
        // TODO: Tạo payment record và redirect đến payment gateway
        toast.info('Tính năng thanh toán qua MoMo/VNPay đang được phát triển')
        // Tạm thời cho phép tạo giải mà không cần thanh toán
        toast.success('Giải đấu đã được tạo. Vui lòng thanh toán sau.')
        navigate(`/tournament/${leagueId}`)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi xử lý thanh toán')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!tournamentData) {
    return null
  }

  return (
    <div className="payment-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          Thanh toán phí giải đấu nội bộ
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Vui lòng thanh toán phí để hoàn tất việc tạo giải đấu
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Left: Payment Details */}
        <div>
          {/* Tournament Info */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Thông tin giải đấu
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Tên giải đấu:</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{tournamentData.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Môn thể thao:</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{tournamentData.sport}</span>
              </div>
              {tournamentData.courtType && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Loại sân:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {courtTypes.find(ct => (ct._id || ct.id) === tournamentData.courtType)?.name || 'Đã chọn'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Số đội tham gia:</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{tournamentData.numParticipants}</span>
              </div>
              {tournamentData.selectedFacility && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Địa điểm:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{tournamentData.selectedFacility.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Chi tiết phí
            </h2>
            {loadingFees ? (
              <p style={{ color: '#6b7280' }}>Đang tải thông tin phí...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>1. Phí tạo giải (Service Fee):</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {formatCurrency(fees.serviceFee)} VNĐ
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>
                    2. Phí sử dụng sân {tournamentData?.courtType ? `(${courtTypes.find(ct => (ct._id || ct.id) === tournamentData.courtType)?.name || 'loại sân đã chọn'})` : ''}:
                  </span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {(() => {
                      if (tournamentData?.courtType && fees.courtTypeFees?.[tournamentData.courtType]) {
                        const courtTypeFee = fees.courtTypeFees[tournamentData.courtType]
                        const estimatedMatches = calculateEstimatedMatches()
                        const hoursPerMatch = 1.5
                        const totalHours = estimatedMatches * hoursPerMatch
                        const totalCourtFee = courtTypeFee * totalHours
                        return formatCurrency(Math.round(totalCourtFee)) + ' VNĐ'
                      } else {
                        return '0 VNĐ (Chưa chọn loại sân hoặc chưa cấu hình phí)'
                      }
                    })()}
                  </span>
                </div>
                {tournamentData?.courtType && fees.courtTypeFees?.[tournamentData.courtType] && (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#f0f9ff', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0369a1'
                  }}>
                    <p style={{ margin: 0 }}>
                      (Ước tính: {calculateEstimatedMatches()} trận × 1.5 giờ/trận = {(calculateEstimatedMatches() * 1.5).toFixed(1)} giờ)
                    </p>
                  </div>
                )}
                {(!tournamentData?.courtType || !fees.courtTypeFees?.[tournamentData.courtType]) && (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#fef3c7', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#92400e'
                  }}>
                    <p style={{ margin: 0 }}>
                      {!tournamentData?.courtType 
                        ? '⚠️ Chưa chọn loại sân trong form tạo giải'
                        : '⚠️ Chưa cấu hình phí cho loại sân này'}
                    </p>
                  </div>
                )}
                {fees.refereeFee && fees.refereeFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>
                      3. Phí trọng tài:
                    </span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>
                      {(() => {
                        const estimatedMatches = calculateEstimatedMatches()
                        const refereeTotal = fees.refereeFee * estimatedMatches
                        return formatCurrency(Math.round(refereeTotal)) + ' VNĐ'
                      })()}
                    </span>
                  </div>
                )}
                {fees.refereeFee && fees.refereeFee > 0 && (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#f0f9ff', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0369a1'
                  }}>
                    <p style={{ margin: 0 }}>
                      (Ước tính: {calculateEstimatedMatches()} trận × {formatCurrency(fees.refereeFee)} VNĐ/trận)
                    </p>
                  </div>
                )}
                <div style={{ 
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '2px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Tổng cộng:</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                    {formatCurrency(totalAmount)} VNĐ
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <PaymentMethods
              selectedMethod={selectedMethod}
              onMethodSelect={setSelectedMethod}
              walletBalance={walletBalance}
              totalAmount={totalAmount}
              methods={availablePaymentMethods}
            />
          </div>
        </div>

        {/* Right: Summary & Action */}
        <div>
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            position: 'sticky',
            top: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Tóm tắt
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Phí tạo giải:</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  {formatCurrency(fees.serviceFee)} VNĐ
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Phí sử dụng sân:</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>
                  {(() => {
                    if (tournamentData?.courtType && fees.courtTypeFees?.[tournamentData.courtType]) {
                      const courtTypeFee = fees.courtTypeFees[tournamentData.courtType]
                      const estimatedMatches = calculateEstimatedMatches()
                      const hoursPerMatch = 1.5
                      const totalHours = estimatedMatches * hoursPerMatch
                      const totalCourtFee = courtTypeFee * totalHours
                      return formatCurrency(Math.round(totalCourtFee)) + ' VNĐ'
                    } else {
                      return '0 VNĐ'
                    }
                  })()}
                </span>
              </div>
              {fees.refereeFee && fees.refereeFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Phí trọng tài:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {(() => {
                      const estimatedMatches = calculateEstimatedMatches()
                      const refereeTotal = fees.refereeFee * estimatedMatches
                      return formatCurrency(Math.round(refereeTotal)) + ' VNĐ'
                    })()}
                  </span>
                </div>
              )}
              <div style={{ 
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '2px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>Tổng cộng:</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                  {formatCurrency(totalAmount)} VNĐ
                </span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing || loadingFees || loadingBalance}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                background: isProcessing ? '#9ca3af' : '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.target.style.background = '#2563eb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.target.style.background = '#3b82f6'
                }
              }}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán và tạo giải đấu'}
            </button>

            <button
              onClick={() => navigate('/tournament/create/internal')}
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
              }}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InternalTournamentPayment

