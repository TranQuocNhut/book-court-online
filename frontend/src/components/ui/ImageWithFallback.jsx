import React, { useState } from 'react'
import { ImageIcon } from 'lucide-react'

const ImageWithFallback = ({ src, alt, className = '', fallbackIcon = true, ...props }) => {
  const [imageError, setImageError] = useState(false)

  if (imageError || !src) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ minHeight: '100px' }}
        {...props}
      >
        {fallbackIcon && <ImageIcon size={32} className="text-gray-400" />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      {...props}
    />
  )
}

export default ImageWithFallback

