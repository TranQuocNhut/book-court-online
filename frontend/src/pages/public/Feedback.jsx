import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { feedbackApi } from '../../api/feedbackApi';

const Feedback = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    type: 'feedback', // 'complaint' hoặc 'feedback'
    subject: '',
    content: '',
    senderName: '',
    senderEmail: '',
    senderPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền thông tin user nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        senderName: user.name || '',
        senderEmail: user.email || '',
        senderPhone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung góp ý');
      return;
    }
    if (!isAuthenticated) {
      if (!formData.senderName.trim()) {
        toast.error('Vui lòng nhập tên');
        return;
      }
      if (!formData.senderEmail.trim()) {
        toast.error('Vui lòng nhập email');
        return;
      }
      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(formData.senderEmail)) {
        toast.error('Email không hợp lệ');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const feedbackData = {
        senderName: formData.senderName || user?.name || '',
        senderEmail: formData.senderEmail || user?.email || '',
        senderPhone: formData.senderPhone || user?.phone || '',
        type: formData.type,
        subject: formData.subject.trim(),
        content: formData.content.trim(),
      };

      await feedbackApi.submitFeedback(feedbackData);
      
      toast.success('Cảm ơn bạn đã góp ý! Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
      
      // Reset form
      setFormData({
        type: 'feedback',
        subject: '',
        content: '',
        senderName: isAuthenticated && user ? (user.name || '') : '',
        senderEmail: isAuthenticated && user ? (user.email || '') : '',
        senderPhone: isAuthenticated && user ? (user.phone || '') : '',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Không thể gửi góp ý. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      padding: '40px 20px',
      background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          padding: '32px',
          color: '#fff',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'rgba(255,255,255,.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MessageSquare size={32} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>
            Góp ý & Phản hồi
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
            Chúng tôi rất mong nhận được ý kiến đóng góp từ bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Loại phản hồi */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Loại phản hồi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                disabled={isSubmitting}
              >
                <option value="feedback">Góp ý</option>
                <option value="complaint">Khiếu nại</option>
              </select>
            </div>

            {/* Thông tin người gửi (chỉ hiển thị nếu chưa đăng nhập) */}
            {!isAuthenticated && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}>
                    Tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => handleInputChange('senderName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '15px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.senderEmail}
                    onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '15px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.senderPhone}
                    onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '15px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            {/* Tiêu đề */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Nhập tiêu đề phản hồi..."
                disabled={isSubmitting}
              />
            </div>

            {/* Nội dung */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Nội dung <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Vui lòng mô tả chi tiết góp ý/khiếu nại của bạn..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                background: '#fff',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = '#fff';
              }}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                background: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.background = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.background = '#3b82f6';
                }
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;

