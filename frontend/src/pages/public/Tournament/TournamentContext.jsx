import React, { createContext, useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { leagueApi } from '../../../api/leagueApi'

const TournamentContext = createContext(null)

const useTournament = () => {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider')
  }
  return context
}

const TournamentProvider = ({ children }) => {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTournament = async () => {
    try {
      setLoading(true)
      const result = await leagueApi.getLeagueById(id)
      
      if (result.success && result.data) {
        const league = result.data
        
        // Map API data to component format
        const mappedTournament = {
          id: league._id || league.id,
          name: league.name,
          format: league.format,
          sport: league.sport,
          creator: league.creator || null, // Include creator object
          creatorName: league.creatorName || (league.creator?.name || league.creator?.email),
          image: league.image || '/sports-meeting.webp',
          banner: league.banner || league.image || '/sports-meeting.webp',
          startDate: league.startDate,
          endDate: league.endDate,
          location: league.location || '',
          address: league.address || '',
          facility: league.facility || null, // Include facility with owner
          courtId: league.courtId || null, // Include court with name
          courtType: league.courtType || null, // Include courtType (loại sân đã chọn)
          approvalStatus: league.approvalStatus || null,
          participants: league.participants || 0,
          maxParticipants: league.maxParticipants || 0,
          prize: league.prize || '',
          status: league.status || 'upcoming',
          description: league.description || '',
          fullDescription: league.fullDescription || league.description || '',
          registrationDeadline: league.registrationDeadline,
          views: league.views || 0,
          phone: league.phone || '',
          tournamentType: league.tournamentType,
          membersPerTeam: league.membersPerTeam,
          type: league.type || 'PRIVATE', // Map type from backend
          teams: league.teams || [],
          matches: league.matches || [],
          champion: league.champion || null // Đội vô địch
        }
        
        setTournament(mappedTournament)
      } else {
        setTournament(null)
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
      setTournament(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchTournament()
    } else {
      setLoading(false)
      setTournament(null)
    }
  }, [id])

  const updateTournament = (updates) => {
    setTournament(prev => ({ ...prev, ...updates }))
  }

  const refreshTournament = () => {
    if (id) {
      fetchTournament()
    }
  }

  return (
    <TournamentContext.Provider value={{ tournament, loading, updateTournament, refreshTournament }}>
      {children}
    </TournamentContext.Provider>
  )
}

export { useTournament, TournamentProvider }
