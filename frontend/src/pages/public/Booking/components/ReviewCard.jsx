import React from 'react'
import { getRatingStars } from '../utils/bookingHelpers'

export default function ReviewCard({ review }) {
  return (
    <div style={{
      background: '#f9fafb',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {(() => {
          // Check if avatar is a URL (http, https, /, or data:)
          const isAvatarUrl = typeof review.avatar === 'string' && 
            (review.avatar.startsWith('http://') || 
             review.avatar.startsWith('https://') || 
             review.avatar.startsWith('/') || 
             review.avatar.startsWith('data:'));
          
          return (
            <div style={{
              width: '40px',
              height: '40px',
              background: isAvatarUrl
                ? `url(${review.avatar})`
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {!isAvatarUrl && review.avatar}
            </div>
          );
        })()}
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {review.user}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b', fontSize: '14px' }}>
              {getRatingStars(review.rating)}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {new Date(review.date).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>
      <p style={{
        fontSize: '14px',
        color: '#374151',
        lineHeight: '1.5',
        margin: 0
      }}>
        {review.comment}
      </p>
      
      {/* Owner Reply */}
      {review.ownerReply && review.ownerReply.reply && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#f0f9ff',
          borderLeft: '3px solid #3b82f6',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#3b82f6',
            marginBottom: '6px'
          }}>
            Phản hồi từ chủ sân:
          </div>
          <p style={{
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.5',
            margin: 0
          }}>
            {review.ownerReply.reply}
          </p>
          {review.ownerReply.repliedAt && (
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              marginTop: '6px'
            }}>
              {new Date(review.ownerReply.repliedAt).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

