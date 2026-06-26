// frontend/src/pages/public/ProfilePage/modals/CreateReviewModal.jsx
import React, { useState, useEffect } from 'react'
import { Star, X } from 'lucide-react'
import Dialog from '../../../../components/ui/Dialog'
import { reviewApi } from '../../../../api/reviewApi'
import { toast } from 'react-toastify'

export default function CreateReviewModal({ 
  isOpen, 
  onClose, 
  booking, 
  review, // Review data nếu đang edit
  onSuccess 
}) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  // Load review data khi review được truyền vào (edit mode)
  useEffect(() => {
    if (review && isOpen) {
      setRating(review.rating || 0)
      setComment(review.comment || '')
    } else if (!review && isOpen) {
      // Reset form khi tạo mới
      setRating(0)
      setComment('')
    }
  }, [review, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Vui lòng chọn điểm đánh giá')
      return
    }

    const isEditMode = !!review

    if (isEditMode) {
      // Edit mode: cập nhật review
      if (!review._id && !review.id) {
        toast.error('Không tìm thấy thông tin đánh giá')
        return
      }

      try {
        setLoading(true)
        const reviewId = review._id || review.id
        const result = await reviewApi.updateReview(reviewId, {
          rating,
          comment: comment.trim() || undefined
        })
        
        if (result || result?.data) {
          toast.success('Cập nhật đánh giá thành công!')
          if (onSuccess) {
            onSuccess(result?.data || result)
          }
          if (onClose) {
            onClose()
          }
        }
      } catch (error) {
        console.error('Error updating review:', error)
        toast.error(error.message || 'Không thể cập nhật đánh giá')
      } finally {
        setLoading(false)
      }
    } else {
      // Create mode: tạo review mới
      if (!booking?._id && !booking?.id) {
        toast.error('Không tìm thấy thông tin booking')
        return
      }

      try {
        setLoading(true)
        const bookingId = booking._id || booking.id
        const result = await reviewApi.createReview({
          bookingId,
          rating,
          comment: comment.trim() || undefined
        })
        
        if (result || result?.data) {
          toast.success('Đánh giá thành công!')
          setRating(0)
          setComment('')
          if (onSuccess) {
            onSuccess(result?.data || result)
          }
          if (onClose) {
            onClose()
          }
        }
      } catch (error) {
        console.error('Error creating review:', error)
        toast.error(error.message || 'Không thể tạo đánh giá')
      } finally {
        setLoading(false)
      }
    }
  }

  if (!isOpen) return null

  const isEditMode = !!review
  const modalTitle = isEditMode ? 'Chỉnh sửa đánh giá' : 'Đánh giá đặt sân'
  const buttonText = isEditMode ? 'Cập nhật đánh giá' : 'Gửi đánh giá'
  const descriptionText = booking 
    ? `${booking.venue || booking.facility?.name || 'Đặt sân'} - ${booking.date ? new Date(booking.date).toLocaleDateString('vi-VN') : ''}`
    : review?.facility?.name || ''

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={descriptionText}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Rating Selection */}
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 600, 
              marginBottom: '12px',
              fontSize: '14px',
              color: '#374151'
            }}>
              Đánh giá <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '12px'
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Star
                    size={40}
                    fill={
                      star <= (hoveredRating || rating)
                        ? '#fbbf24'
                        : 'none'
                    }
                    color="#fbbf24"
                    strokeWidth={star <= (hoveredRating || rating) ? 0 : 2}
                    style={{
                      transition: 'all 0.2s',
                      transform: star <= (hoveredRating || rating) ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ 
                textAlign: 'center', 
                marginTop: '8px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {rating === 5 && 'Tuyệt vời! ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'Rất tốt! ⭐⭐⭐⭐'}
                {rating === 3 && 'Tốt! ⭐⭐⭐'}
                {rating === 2 && 'Tạm được ⭐⭐'}
                {rating === 1 && 'Cần cải thiện ⭐'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 600, 
              marginBottom: '8px',
              fontSize: '14px',
              color: '#374151'
            }}>
              Nhận xét (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về đặt sân này..."
              rows={5}
              maxLength={1000}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <div style={{ 
              textAlign: 'right', 
              marginTop: '4px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              {comment.length}/1000 ký tự
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading || rating === 0}
              style={{
                opacity: (loading || rating === 0) ? 0.6 : 1,
                cursor: (loading || rating === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (isEditMode ? 'Đang cập nhật...' : 'Đang gửi...') : buttonText}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

