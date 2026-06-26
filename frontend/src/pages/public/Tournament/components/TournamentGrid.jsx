import React from 'react'
import TournamentCard from './TournamentCard'

const TournamentGrid = ({ tournaments, onRegister, onViewDetails }) => {
  return (
    <div className="tournament-grid">
      {tournaments.map(tournament => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onRegister={onRegister}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}

export default TournamentGrid

