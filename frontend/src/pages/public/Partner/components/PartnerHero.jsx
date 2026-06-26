import React from 'react'
import '../../../../styles/Partner.css'

export default function PartnerHero({ onScrollToForm }) {
  return (
    <section className="partner-hero">
      <div className="hero-pattern" />
      <div className="hero-content" data-aos="fade-up">
        <div className="hero-badge" data-aos="fade-up" data-aos-delay="100">
          CHƯƠNG TRÌNH ĐỐI TÁC
        </div>
        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="200">
          Cùng Phát Triển Với Đặt Sân Thể Thao
        </h1>
        <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="300">
          Đưa sân thể thao của bạn lên một tầm cao mới. Tiếp cận hàng nghìn khách hàng, 
          tăng doanh thu và quản lý hiệu quả với nền tảng hàng đầu Việt Nam.
        </p>
        <button
          className="hero-cta-btn"
          data-aos="zoom-in" 
          data-aos-delay="400"
          onClick={onScrollToForm}
        >
          Đăng Ký Ngay →
        </button>
      </div>
    </section>
  )
}

