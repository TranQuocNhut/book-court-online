// Custom hook to fetch court types and courts
import { useState, useEffect } from 'react';
import { courtApi } from '../../../../api/courtApi';
import { categoryApi } from '../../../../api/categoryApi';

/**
 * Custom hook to manage court types and courts data
 * @param {string} venueId - Facility ID
 * @param {string} selectedSportCategory - Selected sport category
 * @param {string} selectedFieldType - Selected field type
 * @returns {Object} { courts, courtTypes, setSelectedCourt }
 */
export const useCourtData = (venueId, selectedSportCategory, selectedFieldType) => {
  const [courts, setCourts] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);

  // Fetch court types when sport category is selected
  useEffect(() => {
    const fetchCourtTypes = async () => {
      if (!selectedSportCategory) {
        setCourtTypes([]);
        return;
      }

      try {
        const courtTypesResult = await categoryApi.getCourtTypes({
          sportCategory: selectedSportCategory,
          status: 'active'
        });
        
        if (courtTypesResult.success && courtTypesResult.data) {
          const typesList = Array.isArray(courtTypesResult.data)
            ? courtTypesResult.data
            : courtTypesResult.data.courtTypes || [];
          
          const types = typesList.map(type => ({
            id: type._id || type.id,
            name: type.name,
            description: type.description
          }));
          setCourtTypes(types);
        }
      } catch (typesError) {
        console.error('Error fetching court types:', typesError);
        setCourtTypes([]);
      }
    };

    fetchCourtTypes();
  }, [selectedSportCategory]);

  // Fetch courts when sport category or field type changes
  useEffect(() => {
    if (!venueId || !selectedSportCategory) {
      setCourts([]);
      setSelectedCourt(null);
      return;
    }

    const fetchCourtsByType = async () => {
      try {
        // Build query params
        const params = {
          facility: venueId,
          sportCategory: selectedSportCategory,
          status: 'active',
          limit: 100
        };

        // Add typeId filter if field type is selected
        if (selectedFieldType) {
          // Find courtType object from courtTypes array by name
          const selectedCourtType = courtTypes.find(ct => ct.name === selectedFieldType);
          if (selectedCourtType && selectedCourtType.id) {
            // Use typeId (preferred method - by reference)
            params.typeId = selectedCourtType.id;
          } else {
            // Fallback: use type name (backward compatible)
            params.type = selectedFieldType;
          }
        }

        const courtsResult = await courtApi.getCourts(params);
        
        if (courtsResult.success && courtsResult.data && courtsResult.data.courts) {
          const courtsList = courtsResult.data.courts.map(court => ({
            id: court._id || court.id,
            name: court.name,
            type: court.type,
            price: court.price,
            capacity: court.capacity,
            status: court.status
          }));
          
          setCourts(courtsList);
          
          // Auto-select first court if available
          if (courtsList.length > 0) {
            setSelectedCourt(prev => {
              // Check if current selected court is still valid
              const isValid = prev && courtsList.some(c => (c.id || c._id) === prev);
              if (!isValid) {
                // Reset to first available court if current selection is invalid
                return courtsList[0].id || courtsList[0]._id;
              }
              // Keep current selection if valid, or select first if none
              return prev || courtsList[0].id || courtsList[0]._id;
            });
          } else {
            // Clear selection if no courts available
            setSelectedCourt(null);
            setCourts([]);
          }
        } else {
          setCourts([]);
          setSelectedCourt(null);
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        setCourts([]);
        setSelectedCourt(null);
      }
    };

    fetchCourtsByType();
  }, [selectedFieldType, selectedSportCategory, venueId, courtTypes]);

  return {
    courts,
    courtTypes,
    selectedCourt,
    setSelectedCourt
  };
};

