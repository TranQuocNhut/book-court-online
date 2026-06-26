import React from 'react'
import { benefits } from '../constants'
import '../../../../styles/Partner.css'

export default function BenefitsSection() {
  return (
    <section className="benefits-section">
      <div className="section-header" data-aos="fade-up">
        <h2 className="section-title">
          Lợi Ích Khi Trở Thành Đối Tác
        </h2>
        <p className="section-description">
          Tham gia cùng hàng ngàn đối tác đang phát triển thành công trên nền tảng của chúng tôi
        </p>
      </div>

      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <div 
            key={index}
            className="benefit-card"
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="benefit-icon">{benefit.icon}</div>
            <h3 className="benefit-title">
              {benefit.title}
            </h3>
            <p className="benefit-description">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

