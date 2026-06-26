import React, { useEffect, useRef, useState } from 'react'
import { 
  Zap, 
  Shield, 
  MapPin, 
  Star, 
  Clock,
  Smartphone
} from 'lucide-react'
import '../../../../styles/HomePage.css'

const features = [
  {
    id: 1,
    icon: Zap,
    title: 'Đặt sân nhanh chóng',
    description: 'Tìm và đặt sân thể thao chỉ trong vài phút với giao diện thân thiện, dễ sử dụng',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    iconGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    id: 2,
    icon: Shield,
    title: 'Thanh toán an toàn',
    description: 'Hỗ trợ nhiều phương thức thanh toán, bảo mật thông tin tuyệt đối với công nghệ mã hóa',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    iconGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    id: 3,
    icon: MapPin,
    title: 'Tìm kiếm thông minh',
    description: 'Tìm sân gần bạn nhất với bản đồ tích hợp, lọc theo môn thể thao và khoảng cách',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    iconGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  {
    id: 4,
    icon: Star,
    title: 'Đánh giá xác thực',
    description: 'Xem đánh giá thực tế từ người dùng, giúp bạn chọn sân phù hợp nhất',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    iconGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  {
    id: 5,
    icon: Clock,
    title: 'Đặt sân 24/7',
    description: 'Đặt sân bất cứ lúc nào, hệ thống tự động xử lý và gửi xác nhận ngay lập tức',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    iconGradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
  },
  {
    id: 6,
    icon: Smartphone,
    title: 'Ứng dụng di động',
    description: 'Trải nghiệm tốt nhất trên mọi thiết bị, tối ưu cho cả mobile và desktop',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    iconGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
]

export default function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className="features-section">
      <div className="features-container">
        <div className="features-header">
          <div className="features-badge">
            <Zap size={16} />
            Tính năng nổi bật
          </div>
          <h2 className="features-title">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="features-subtitle">
            Trải nghiệm đặt sân thể thao tốt nhất với những tính năng được yêu thích nhất
          </p>
        </div>

        <div className={`features-grid ${isVisible ? 'visible' : ''}`}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.id}
                className="feature-card"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div 
                  className="feature-icon-wrapper"
                  style={{
                    background: feature.iconGradient,
                    boxShadow: `0 8px 24px ${feature.color}40`
                  }}
                >
                  <Icon size={28} color="#fff" />
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
                <div 
                  className="feature-background"
                  style={{
                    background: feature.gradient,
                    opacity: 0
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

