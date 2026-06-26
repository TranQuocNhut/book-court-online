import React from 'react'
import { Zap, Tag } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert'
import '../../../../styles/Promotion.css'

export default function FeaturedPromotion({ promotion, onApply }) {
  return (
    <div className="featured-promotion">
      <Alert className="featured-alert">
        <Zap className="alert-icon" />
        <AlertTitle className="alert-title">
          Khuyến mãi nổi bật trong tháng
        </AlertTitle>
        <AlertDescription className="alert-description">
          {promotion.title} - Mã: <strong>{promotion.code}</strong>
        </AlertDescription>
        <button
          onClick={() => onApply?.(promotion.code)}
          className="featured-apply-btn"
        >
          <Tag size={16} /> Áp dụng ngay
        </button>
      </Alert>
    </div>
  )
}

