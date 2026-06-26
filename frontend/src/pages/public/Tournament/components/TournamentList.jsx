import React from 'react'
import TournamentCard from './TournamentCard'

const TournamentList = ({ tournaments, onRegister, onViewDetails }) => {
  return (
    <div className="tournament-list">
      {tournaments.map(tournament => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onRegister={onRegister}
          onViewDetails={onViewDetails}
          listView={true}
        />
      ))}
    </div>
  )
}

export default TournamentList

