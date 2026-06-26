import React, { useState, useEffect } from 'react'
import { serviceApi } from '../../../../api/serviceApi'
import { ShoppingCart, Utensils, Coffee, Dumbbell, Plus, Minus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

const SERVICE_TYPE_LABELS = {
  DRINK: 'Đồ uống',
  FOOD: 'Đồ ăn',
  EQUIPMENT: 'Dụng cụ'
}

const SERVICE_TYPE_ICONS = {
  DRINK: Coffee,
  FOOD: Utensils,
  EQUIPMENT: Dumbbell
}

export default function ServiceSelector({ 
  facilityId, 
  selectedSportCategory,
  selectedServices = [],
  onServicesChange 
}) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [serviceQuantities, setServiceQuantities] = useState({}) // { serviceId: quantity }

  // Load services when facilityId changes
  useEffect(() => {
    if (facilityId) {
      loadServices()
    } else {
      setServices([])
    }
  }, [facilityId, selectedSportCategory])

  // Initialize quantities from selectedServices prop
  useEffect(() => {
    if (selectedServices && selectedServices.length > 0) {
      const quantities = {}
      selectedServices.forEach(item => {
        quantities[item.serviceId] = item.quantity || 1
      })
      setServiceQuantities(quantities)
    }
  }, [selectedServices])

  const loadServices = async () => {
    try {
      setLoading(true)
      const params = {}
      
      // Filter by sport category if equipment type
      if (selectedSportCategory) {
        params.sportCategory = selectedSportCategory
      }

      const result = await serviceApi.getServicesByFacility(facilityId, params)
      
      if (result.success) {
        setServices(result.data || [])
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (serviceId, change) => {
    setServiceQuantities(prev => {
      const currentQty = prev[serviceId] || 0
      const newQty = Math.max(0, currentQty + change)
      
      const updated = { ...prev }
      if (newQty === 0) {
        delete updated[serviceId]
      } else {
        updated[serviceId] = newQty
      }

      // Notify parent component
      const selectedServicesList = Object.entries(updated)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const service = services.find(s => (s._id || s.id) === id)
          return {
            serviceId: id,
            service: service,
            quantity: qty,
            totalPrice: (service?.price || 0) * qty
          }
        })
      
      if (onServicesChange) {
        onServicesChange(selectedServicesList)
      }

      return updated
    })
  }

  const getServiceQuantity = (serviceId) => {
    return serviceQuantities[serviceId] || 0
  }

  // Group services by type
  const groupedServices = services.reduce((acc, service) => {
    const type = service.type || 'OTHER'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(service)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="service-selector-loading" style={{
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
        <div>Đang tải dịch vụ...</div>
      </div>
    )
  }

  if (!facilityId || services.length === 0) {
    return null
  }

  return (
    <div className="service-selector" style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <ShoppingCart size={20} style={{ color: '#374151' }} />
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          Dịch vụ bổ sung
        </h3>
      </div>

      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
        Chọn dịch vụ bạn muốn thuê
      </div>

      {Object.entries(groupedServices).map(([type, typeServices]) => {
        const Icon = SERVICE_TYPE_ICONS[type] || ShoppingCart
        const label = SERVICE_TYPE_LABELS[type] || type

        return (
          <div key={type} style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <Icon size={16} style={{ color: '#6b7280' }} />
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                {label}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {typeServices.map(service => {
                const serviceId = service._id || service.id
                const quantity = getServiceQuantity(serviceId)
                const price = service.price || 0

                return (
                  <div
                    key={serviceId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: quantity > 0 ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '8px',
                      border: quantity > 0 ? '1px solid #86efac' : '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Service Image */}
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}

                    {/* Service Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        {service.name}
                      </div>
                      {service.description && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {service.description}
                        </div>
                      )}
                      {service.sportCategory && (
                        <div style={{
                          fontSize: '12px',
                          color: '#059669',
                          marginTop: '4px'
                        }}>
                          {service.sportCategory.name || service.sportCategory}
                        </div>
                      )}
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669',
                        marginTop: '4px'
                      }}>
                        {price.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => handleQuantityChange(serviceId, -1)}
                        disabled={quantity === 0}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: quantity > 0 ? '#fff' : '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: quantity > 0 ? 'pointer' : 'not-allowed',
                          color: quantity > 0 ? '#374151' : '#9ca3af',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (quantity > 0) {
                            e.target.style.background = '#f3f4f6'
                            e.target.style.borderColor = '#d1d5db'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (quantity > 0) {
                            e.target.style.background = '#fff'
                            e.target.style.borderColor = '#e5e7eb'
                          }
                        }}
                      >
                        <Minus size={16} />
                      </button>

                      <span style={{
                        minWidth: '32px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(serviceId, 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#fff',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#059669'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#10b981'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

