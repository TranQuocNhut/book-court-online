import React, { useState } from 'react'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent } from '../../../../components/ui/card'
import { Clock, CheckCircle, Tag, Copy, Gift, Flame, Star } from 'lucide-react'
import { calculateUsagePercent } from '../utils/helpers'
import '../../../../styles/Promotion.css'

export default function PromotionCard({ promotion, copiedCode, onCopy, onApply }) {
  const usagePercent = calculateUsagePercent(promotion.usage.current, promotion.usage.total)

  return (
    <Card className="promotion-card">
      <div 
        className="promotion-card-image"
        style={{ backgroundImage: `url(${promotion.image})` }}
      >
        <div className="image-overlay" />
        
        <div className="promotion-badges">
          {promotion.badges.map((badge, idx) => (
            <Badge 
              key={idx}
              variant="default"
              className={`badge ${badge === 'HOT' ? 'badge-hot' : 'badge-new'}`}
            >
              {badge === 'HOT' ? <Flame size={14} /> : <Star size={14} />}
              {badge}
            </Badge>
          ))}
        </div>

        <span className="discount-badge">
          {promotion.discount}
        </span>
      </div>

      <CardContent className="promotion-card-content">
        <div className="promotion-title">
          {promotion.title}
        </div>

        <div className="promotion-description">
          {promotion.description}
        </div>

        <div className="promotion-timer">
          <Clock size={16} />
          <span>{promotion.validUntil}</span>
        </div>

        <div className="usage-section">
          <div className="usage-header">
            <span>Đã sử dụng</span>
            <span className="usage-count">
              {promotion.usage.current}/{promotion.usage.total}
            </span>
          </div>
          <div className="usage-progress-bar">
            <div 
              className="usage-progress-fill"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        <div className="conditions-section">
          <div className="conditions-title">
            Điều kiện:
          </div>
          <div className="conditions-list">
            {promotion.features.map((feature, index) => (
              <div key={index} className="condition-item">
                <CheckCircle size={16} className="condition-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="promo-code-section">
          <div className="promo-code-left">
            <Tag size={16} className="code-icon" />
            <span className="promo-code">
              {promotion.code}
            </span>
          </div>
          <button
            onClick={() => onCopy(promotion.code)}
            className={`copy-btn ${copiedCode === promotion.code ? 'copied' : ''}`}
          >
            <Copy size={14} />
            {copiedCode === promotion.code ? 'Đã copy' : 'Copy'}
          </button>
        </div>

        <button
          onClick={() => onApply?.(promotion.code)}
          className="apply-btn"
        >
          <Gift size={18} />
          Sử dụng ngay
        </button>
      </CardContent>
    </Card>
  )
}

