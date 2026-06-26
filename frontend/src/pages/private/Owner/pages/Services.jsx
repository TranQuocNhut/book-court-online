import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { categoryApi } from '../../../../api/categoryApi'
import { serviceApi } from '../../../../api/serviceApi'
import {
  Coffee,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Utensils,
  Droplet,
  Wrench
} from 'lucide-react'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedType, setSelectedType] = useState('all') // Filter by service type
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    type: 'DRINK',
    sportCategory: '', // For EQUIPMENT type
    image: '',
    isActive: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sportCategories, setSportCategories] = useState([])
  const [loadingSports, setLoadingSports] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchSportCategories()
  }, [])

  const fetchSportCategories = async () => {
    try {
      setLoadingSports(true)
      const result = await categoryApi.getSportCategories({ status: 'active' })
      if (result.success && result.data) {
        setSportCategories(Array.isArray(result.data) ? result.data : [])
      }
    } catch (error) {
      console.error('Error fetching sport categories:', error)
    } finally {
      setLoadingSports(false)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await serviceApi.getAllServices()
      if (response.success) {
        setServices(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error(error.response?.data?.message || 'Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
        type: service.type || 'DRINK',
        sportCategory: service.sportCategory?._id || service.sportCategory || '',
        image: service.image || '',
        isActive: service.isActive !== undefined ? service.isActive : true
      })
      setImagePreview(service.image || null)
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        type: 'DRINK',
        sportCategory: '',
        image: '',
        isActive: true
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      type: 'DRINK',
      sportCategory: '',
      image: '',
      isActive: true
    })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Validate sport category for EQUIPMENT type
    if (formData.type === 'EQUIPMENT' && !formData.sportCategory) {
      toast.error('Vui lòng chọn môn thể thao cho dụng cụ')
      return
    }

    try {
      let serviceId
      if (editingService) {
        const response = await serviceApi.updateService(editingService._id, formData)
        serviceId = editingService._id
        toast.success('Cập nhật dịch vụ thành công')
      } else {
        const response = await serviceApi.createService(formData)
        serviceId = response.data._id
        toast.success('Tạo dịch vụ thành công')
      }

      // Upload image if selected
      if (imageFile && serviceId) {
        try {
          setUploadingImage(true)
          await serviceApi.uploadServiceImage(serviceId, imageFile)
          toast.success('Upload ảnh thành công')
        } catch (error) {
          console.error('Error uploading image:', error)
          toast.error(error.response?.data?.message || 'Không thể upload ảnh')
        } finally {
          setUploadingImage(false)
        }
      }

      handleCloseModal()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error(error.response?.data?.message || 'Không thể lưu dịch vụ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return
    }

    try {
      await serviceApi.deleteService(id)
      toast.success('Xóa dịch vụ thành công')
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa dịch vụ')
    }
  }

  const handleToggleActive = async (service) => {
    try {
      await serviceApi.toggleActive(service._id)
      toast.success(service.isActive ? 'Đã vô hiệu hóa dịch vụ' : 'Đã kích hoạt dịch vụ')
      fetchServices()
    } catch (error) {
      console.error('Error toggling service:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DRINK':
        return Droplet
      case 'FOOD':
        return Utensils
      case 'EQUIPMENT':
        return Wrench
      default:
        return Coffee
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'DRINK':
        return 'Nước uống'
      case 'FOOD':
        return 'Đồ ăn vặt'
      case 'EQUIPMENT':
        return 'Thuê dụng cụ'
      default:
        return type
    }
  }

  const serviceTypes = [
    { value: 'DRINK', label: 'Nước uống', icon: Droplet },
    { value: 'FOOD', label: 'Đồ ăn vặt', icon: Utensils },
    { value: 'EQUIPMENT', label: 'Thuê dụng cụ', icon: Wrench }
  ]

  const filteredServices = services.filter(service => {
    // Filter by active status
    if (!showInactive && !service.isActive) {
      return false
    }
    // Filter by type
    if (selectedType !== 'all' && service.type !== selectedType) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={48} color="#3b82f6" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý dịch vụ</h1>
          <p className="text-gray-600">Tạo và quản lý các dịch vụ như nước uống, đồ ăn vặt, thuê dụng cụ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                selectedType === 'all'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <Coffee size={18} />
              Tất cả
            </button>
            {serviceTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                    selectedType === type.value
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {type.label}
                </button>
              )
            })}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Hiển thị đã tắt</span>
          </label>
        </div>
        {/* Count display */}
        <div className="text-sm text-gray-600">
          Hiển thị {filteredServices.length} dịch vụ
          {selectedType !== 'all' && ` (${getTypeLabel(selectedType)})`}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          {selectedType !== 'all' ? (
            <>
              {(() => {
                const TypeIcon = getTypeIcon(selectedType)
                const Icon = TypeIcon
                return <Icon size={64} className="mx-auto mb-4 text-gray-300" />
              })()}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có dịch vụ {getTypeLabel(selectedType).toLowerCase()}
              </h3>
              <p className="text-gray-600 mb-4">
                {showInactive 
                  ? `Chưa có dịch vụ ${getTypeLabel(selectedType).toLowerCase()} nào`
                  : `Chưa có dịch vụ ${getTypeLabel(selectedType).toLowerCase()} đang hoạt động`}
              </p>
            </>
          ) : (
            <>
              <Coffee size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showInactive ? 'Chưa có dịch vụ nào' : 'Chưa có dịch vụ đang hoạt động'}
              </h3>
              <p className="text-gray-600 mb-4">
                {showInactive 
                  ? 'Bắt đầu bằng cách thêm dịch vụ đầu tiên của bạn'
                  : 'Tất cả dịch vụ đã bị vô hiệu hóa hoặc chưa có dịch vụ nào'}
              </p>
            </>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thêm dịch vụ mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const TypeIcon = getTypeIcon(service.type)
            return (
              <div
                key={service._id}
                className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow ${
                  !service.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {service.image || imagePreview ? (
                    <img
                      src={service.image || imagePreview}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <TypeIcon size={48} className="text-blue-400" />
                    </div>
                  )}
                  {!service.isActive && (
                    <div className="absolute top-3 right-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Đã tắt
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{getTypeLabel(service.type)}</span>
                        {service.type === 'EQUIPMENT' && service.sportCategory && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {service.sportCategory?.name || 'Môn thể thao'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description || 'Không có mô tả'}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      {service.price?.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Edit size={16} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                        service.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {service.isActive ? (
                        <>
                          <XCircle size={16} />
                          Tắt
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Bật
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh dịch vụ
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Upload size={18} />
                        <span className="text-sm font-medium">
                          {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                        </span>
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ví dụ: Nước suối, Bánh mì, Vợt cầu lông..."
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại dịch vụ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {serviceTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.type === type.value
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          // Reset sportCategory when changing type
                          setFormData({ 
                            ...formData, 
                            type: type.value,
                            sportCategory: type.value === 'EQUIPMENT' ? formData.sportCategory : ''
                          })
                        }}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sport Category - Only show for EQUIPMENT type */}
              {formData.type === 'EQUIPMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Môn thể thao <span className="text-red-500">*</span>
                  </label>
                  {loadingSports ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader className="animate-spin" size={16} />
                      <span className="text-sm">Đang tải danh sách môn thể thao...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.sportCategory}
                      onChange={(e) => setFormData({ ...formData, sportCategory: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                      required
                    >
                      <option value="">-- Chọn môn thể thao --</option>
                      {sportCategories.map((category) => (
                        <option key={category._id || category.id} value={category._id || category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {sportCategories.length === 0 && !loadingSports && (
                    <p className="text-sm text-gray-500 mt-1">
                      Chưa có môn thể thao nào. Vui lòng liên hệ admin để thêm môn thể thao.
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Mô tả chi tiết về dịch vụ..."
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Kích hoạt dịch vụ
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingService ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services

