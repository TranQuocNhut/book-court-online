import React from 'react'
import { steps } from '../constants'
import '../../../../styles/Partner.css'

export default function HowItWorksSection() {
  return (
    <section className="how-it-works-section">
      <div className="section-container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            Quy Trình Đăng Ký Đơn Giản
          </h2>
          <p className="section-description">
            Chỉ 4 bước để bắt đầu kinh doanh cùng chúng tôi
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-wrapper" data-aos="fade-up" data-aos-delay={index * 150}>
              {index < steps.length - 1 && (
                <div className="step-connector" />
              )}
              <div className="step-card">
                <div className="step-number">
                  {step.number}
                </div>
                <h3 className="step-title">
                  {step.title}
                </h3>
                <p className="step-description">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

