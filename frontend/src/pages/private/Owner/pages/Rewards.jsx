import React, { useState, useEffect } from 'react'
import { loyaltyApi } from '../../../../api/loyaltyApi'
import { toast } from 'react-toastify'
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader,
  Star,
  Ticket,
  Package,
  Settings,
  CheckCircle,
  XCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react'

const Rewards = () => {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReward, setEditingReward] = useState(null)
  const [showInactive, setShowInactive] = useState(false) // Toggle để hiển thị inactive rewards
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointCost: '',
    type: 'VOUCHER',
    voucherValue: '',
    voucherType: 'fixed',
    stock: '',
    isActive: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const response = await loyaltyApi.getAllRewards()
      if (response.success) {
        setRewards(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast.error('Không thể tải danh sách quà tặng')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward)
      setFormData({
        name: reward.name || '',
        description: reward.description || '',
        pointCost: reward.pointCost || '',
        type: reward.type || 'VOUCHER',
        voucherValue: reward.voucherValue || '',
        voucherType: reward.voucherType || 'fixed',
        stock: reward.stock || '',
        isActive: reward.isActive !== undefined ? reward.isActive : true
      })
      setImagePreview(reward.image || null)
    } else {
      setEditingReward(null)
      setFormData({
        name: '',
        description: '',
        pointCost: '',
        type: 'VOUCHER',
        voucherValue: '',
        voucherType: 'fixed',
        stock: '',
        isActive: true
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingReward(null)
    setFormData({
      name: '',
      description: '',
      pointCost: '',
      type: 'VOUCHER',
      voucherValue: '',
      voucherType: 'fixed',
      stock: '',
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
    
    if (!formData.name || !formData.pointCost || !formData.type) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (formData.type === 'VOUCHER' && (!formData.voucherValue || !formData.voucherType)) {
      toast.error('Voucher cần có giá trị và loại giảm giá')
      return
    }

    try {
      let rewardId
      if (editingReward) {
        await loyaltyApi.updateReward(editingReward._id, formData)
        rewardId = editingReward._id
        toast.success('Cập nhật quà tặng thành công')
      } else {
        const response = await loyaltyApi.createReward(formData)
        rewardId = response.data._id
        toast.success('Tạo quà tặng thành công')
      }

      // Upload image if selected
      if (imageFile && rewardId) {
        try {
          setUploadingImage(true)
          await loyaltyApi.uploadRewardImage(rewardId, imageFile)
          toast.success('Upload ảnh thành công')
        } catch (error) {
          console.error('Error uploading image:', error)
          toast.error('Không thể upload ảnh')
        } finally {
          setUploadingImage(false)
        }
      }

      handleCloseModal()
      fetchRewards()
    } catch (error) {
      console.error('Error saving reward:', error)
      toast.error(error.response?.data?.message || 'Không thể lưu quà tặng')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quà tặng này?')) {
      return
    }

    try {
      await loyaltyApi.deleteReward(id)
      toast.success('Xóa quà tặng thành công')
      fetchRewards()
    } catch (error) {
      console.error('Error deleting reward:', error)
      toast.error('Không thể xóa quà tặng')
    }
  }

  const handleToggleActive = async (reward) => {
    try {
      await loyaltyApi.updateReward(reward._id, { isActive: !reward.isActive })
      toast.success(reward.isActive ? 'Đã vô hiệu hóa quà tặng' : 'Đã kích hoạt quà tặng')
      fetchRewards()
    } catch (error) {
      console.error('Error toggling reward:', error)
      toast.error('Không thể cập nhật trạng thái')
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'VOUCHER':
        return Ticket
      case 'ITEM':
        return Package
      case 'SERVICE':
        return Settings
      default:
        return Gift
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'VOUCHER':
        return 'Voucher'
      case 'ITEM':
        return 'Vật phẩm'
      case 'SERVICE':
        return 'Dịch vụ'
      default:
        return type
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Ưu đãi</h1>
          <p className="text-gray-600">Tạo và quản lý các quà tặng cho khách hàng đổi điểm</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Tạo quà tặng mới
        </button>
      </div>

      {/* Filter Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="showInactive" className="text-sm text-gray-700 cursor-pointer">
            Hiển thị ưu đãi đã xóa
          </label>
        </div>
      </div>

      {/* Rewards Grid */}
      {(() => {
        // Filter rewards based on showInactive toggle
        const filteredRewards = showInactive 
          ? rewards 
          : rewards.filter(reward => reward.isActive === true)
        
        if (filteredRewards.length === 0) {
          return (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Gift size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showInactive ? 'Chưa có quà tặng nào' : 'Chưa có quà tặng đang hoạt động'}
              </h3>
              <p className="text-gray-600 mb-6">
                {showInactive 
                  ? 'Bắt đầu tạo quà tặng đầu tiên của bạn'
                  : 'Tất cả quà tặng đã bị xóa hoặc vô hiệu hóa'}
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Tạo quà tặng mới
              </button>
            </div>
          )
        }
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
            const TypeIcon = getTypeIcon(reward.type)
            return (
              <div
                key={reward._id}
                className={`bg-white rounded-lg border-2 overflow-hidden transition-all ${
                  reward.isActive
                    ? 'border-gray-200 hover:border-blue-500 hover:shadow-lg'
                    : 'border-gray-100 opacity-60'
                }`}
              >
                {/* Image */}
                {reward.image ? (
                  <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      src={reward.image}
                      alt={reward.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <TypeIcon size={48} className="text-blue-400" />
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{reward.name}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                        {getTypeLabel(reward.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reward.isActive ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : (
                        <XCircle size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                {/* Description */}
                {reward.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {reward.description}
                  </p>
                )}

                {/* Point Cost */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 rounded-lg">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-900">
                    {reward.pointCost.toLocaleString('vi-VN')} điểm
                  </span>
                </div>

                {/* Voucher Info */}
                {reward.type === 'VOUCHER' && reward.voucherValue && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Giá trị:{' '}
                      <span className="font-semibold text-green-700">
                        {reward.voucherType === 'percentage'
                          ? `${reward.voucherValue}%`
                          : `${reward.voucherValue.toLocaleString('vi-VN')} ₫`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stock */}
                {reward.stock !== null && (
                  <div className="mb-4 text-sm text-gray-600">
                    Tồn kho: <span className="font-semibold">{reward.stock}</span>
                  </div>
                )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleOpenModal(reward)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit size={16} />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleToggleActive(reward)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        reward.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {reward.isActive ? (
                        <>
                          <XCircle size={16} />
                          Vô hiệu
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Kích hoạt
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(reward._id)}
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
        )
      })()}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingReward ? 'Chỉnh sửa quà tặng' : 'Tạo quà tặng mới'}
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
                  Hình ảnh quà tặng
                </label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload size={20} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {imagePreview ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP). Tối đa 5MB.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên quà tặng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại quà tặng <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="VOUCHER">Voucher</option>
                  <option value="ITEM">Vật phẩm</option>
                  <option value="SERVICE">Dịch vụ</option>
                </select>
              </div>

              {/* Point Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm cần đổi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.pointCost}
                  onChange={(e) => setFormData({ ...formData, pointCost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Voucher Fields */}
              {formData.type === 'VOUCHER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại giảm giá <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.voucherType}
                      onChange={(e) => setFormData({ ...formData, voucherType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="fixed">Giảm giá cố định (VNĐ)</option>
                      <option value="percentage">Giảm giá phần trăm (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị voucher <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.voucherValue}
                      onChange={(e) => setFormData({ ...formData, voucherValue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder={formData.voucherType === 'percentage' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
                    />
                  </div>
                </>
              )}

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng (để trống = vô hạn)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vô hạn"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Kích hoạt quà tặng
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
                      {editingReward ? 'Cập nhật' : 'Tạo mới'}
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

export default Rewards

