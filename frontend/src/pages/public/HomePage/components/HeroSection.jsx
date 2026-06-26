import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Compass, Clock } from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import TypeWriter from '../../../../components/ui/TypeWriter'
import SearchBar from './SearchBar'
import '../../../../styles/HomePage.css'

export default function HeroSection({ 
  onScrollToFeatured, 
  onScrollToRecent,
  searchBarProps 
}) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </div>
      
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            ⚡ Hơn 200+ sân thể thao đang chờ bạn
          </div>
          
          <h1 className="hero-title">
            <TypeWriter 
              text="Tìm sân thể thao" 
              speed={80}
            />
          </h1>
          
          <h2 className="hero-subtitle">
            <TypeWriter 
              text="nhanh chóng, dễ dàng" 
              speed={60}
            />
          </h2>
          
          <p className="hero-description">
            <TypeWriter 
              text="Khám phá hàng trăm sân thể thao chất lượng cao với giá tốt nhất" 
              speed={30}
            />
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button
                  onClick={onScrollToFeatured}
                  className="hero-button hero-button-primary"
                >
                  <Compass size={20} />
                  Khám phá
                </button>
                <button
                  onClick={onScrollToRecent}
                  className="hero-button hero-button-secondary"
                >
                  <Clock size={20} />
                  Sân gần đây
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hero-button hero-button-primary hero-button-large"
              >
                <Search size={22} />
                Bắt đầu ngay
              </button>
            )}
          </div>
        </div>

        <SearchBar {...searchBarProps} />
      </div>
    </section>
  )
}

