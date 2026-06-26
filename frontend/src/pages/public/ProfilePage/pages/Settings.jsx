import React, { useState, useEffect } from 'react'
import SettingsTab from '../tabs/SettingsTab'
import { userApi } from '@/api/userApi'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({
    booking: true,
    promotion: true,
    email: user?.emailNotifications !== undefined ? user.emailNotifications : true
  })

  // Load emailNotifications từ user profile
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const result = await userApi.getCurrentUser()
        if (result.success && result.data?.user) {
          setNotifications(prev => ({
            ...prev,
            email: result.data.user.emailNotifications !== undefined 
              ? result.data.user.emailNotifications 
              : true // Default true nếu chưa có
          }))
        }
      } catch (error) {
        console.error('Error loading user settings:', error)
      }
    }
    loadUserSettings()
  }, [])

  return (
    <SettingsTab 
      notifications={notifications} 
      setNotifications={setNotifications} 
    />
  )
}

