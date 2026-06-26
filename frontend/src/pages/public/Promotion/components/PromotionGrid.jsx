import React from 'react'
import PromotionCard from './PromotionCard'
import '../../../../styles/Promotion.css'

export default function PromotionGrid({ promotions, copiedCode, onCopy, onApply }) {
  return (
    <div className="promotion-grid">
      {promotions.map((promotion) => (
        <PromotionCard
          key={promotion.id}
          promotion={promotion}
          copiedCode={copiedCode}
          onCopy={onCopy}
          onApply={onApply}
        />
      ))}
    </div>
  )
}

