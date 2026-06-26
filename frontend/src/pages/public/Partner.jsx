import React, { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { partnerApi } from '../../api/partnerApi'
import PartnerHero from './Partner/components/PartnerHero'
import StatsSection from './Partner/components/StatsSection'
import BenefitsSection from './Partner/components/BenefitsSection'
import HowItWorksSection from './Partner/components/HowItWorksSection'
import RegistrationForm from './Partner/components/RegistrationForm'
import '../../styles/Partner.css'

export default function Partner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      offset: 100
    })

    // Pre-fill form với thông tin user nếu đã đăng nhập
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      })
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Kiểm tra đăng nhập
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký làm đối tác')
      navigate('/login', { state: { from: '/partner' } })
      return
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ và tên')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email')
      return
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await partnerApi.createApplication({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      })

      if (result.success) {
        toast.success(result.message || 'Đơn đăng ký đã được gửi thành công!')
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: ""
        })
      } else {
        toast.error(result.message || 'Không thể gửi đơn đăng ký')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error(error.message || 'Không thể gửi đơn đăng ký. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScrollToForm = () => {
    document.getElementById('register-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="partner-page">
      <PartnerHero onScrollToForm={handleScrollToForm} />

      <StatsSection />

      <BenefitsSection />

      <HowItWorksSection />

      <RegistrationForm
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
