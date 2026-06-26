import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Gift } from 'lucide-react'
import '../../../../styles/Promotion.css'

export default function InfoSection() {
  const steps = [
    {
      number: 1,
      title: 'Chọn sân và thời gian',
      description: 'Chọn sân thể thao yêu thích và khung giờ phù hợp với bạn'
    },
    {
      number: 2,
      title: 'Nhập mã khuyến mãi',
      description: 'Tìm ô nhập mã khuyến mãi và nhập code nhận được từ chương trình'
    },
    {
      number: 3,
      title: 'Hoàn tất đặt sân',
      description: 'Xác nhận thông tin và thanh toán để hoàn tất đặt sân với giá ưu đãi'
    }
  ]

  return (
    <div className="info-section-wrapper">
      <div className="info-section-container">
        <Card className="info-section-card">
          <CardHeader>
            <CardTitle className="info-section-title">
              <Gift className="info-icon" /> 
              Hướng dẫn sử dụng mã khuyến mãi
            </CardTitle>
            <CardDescription className="info-section-description" />
          </CardHeader>
          <CardContent>
            <div className="info-steps-grid">
              {steps.map((step) => (
                <div key={step.number} className="info-step">
                  <div className="step-number">
                    {step.number}
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

