import Facility from '../models/Facility.js';
import Court from '../models/Court.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import SportCategory from '../models/SportCategory.js';
import CourtType from '../models/CourtType.js';
import mongoose from 'mongoose';

/**
 * Build context for AI based on user query and intent
 * @param {Object} params
 * @param {string} params.userQuery - User's query
 * @param {Object} params.userLocation - User location {lat, lng}
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.sportCategoryId - Sport category ID (optional)
 * @param {number} params.radius - Search radius in meters (optional)
 * @returns {Promise<Object>} Context object
 */
export const buildContext = async ({ userQuery, userLocation, userId, sportCategoryId, radius }) => {
  const context = {
    timestamp: new Date().toISOString(),
    userLocation: userLocation || null,
    sportCategoryId: sportCategoryId || null,
    radius: radius || null,
    facilities: [],
    courts: [],
    userBookings: [],
  };

  try {
    // Extract intent from query (simple keyword matching, can be improved)
    const queryLower = userQuery.toLowerCase();
    
    // Find nearest facilities by sport category if user has location and sportCategoryId
    // Also trigger if we have all required info (sportCategoryId, location, radius) even without keywords
    const hasNearbyKeywords = queryLower.includes('gần') || queryLower.includes('gần nhất') || queryLower.includes('gần đây') || queryLower.includes('tìm cơ sở');
    const hasRequiredInfo = !!(userLocation && sportCategoryId && radius);
    
    // Debug: Nearby search check logging removed to reduce console noise
    
    if (userLocation && sportCategoryId && (hasNearbyKeywords || hasRequiredInfo)) {
      // Get sport category info
      const sportCategory = await SportCategory.findById(sportCategoryId).lean();
      
      if (sportCategory) {
        // Get court types for this sport category
        const courtTypes = await CourtType.find({
          sportCategory: sportCategoryId,
          status: 'active'
        }).select('name _id').lean();
        
        if (courtTypes.length > 0) {
          const courtTypeNames = courtTypes.map(ct => ct.name);
          const courtTypeIds = courtTypes.map(ct => ct._id);
          
          // Find facilities that have courts for this sport category
          // First, get all courts for this sport
          const courts = await Court.find({
            status: 'active',
            $or: [
              { type: { $in: courtTypeNames } },
              { courtType: { $in: courtTypeIds } },
              { sportCategory: new mongoose.Types.ObjectId(sportCategoryId) }
            ]
          })
          .populate({
            path: 'facility',
            match: { status: 'opening' },
            select: 'name address location types pricePerHour phoneNumber images'
          })
          .lean();
          
          // Get unique facilities from courts
          const facilityIds = new Set();
          const facilitiesWithDistance = [];
          
          // Default radius is 10km (10000 meters) if not specified
          // Convert radius to number if it's a string
          let maxDistance = 10000; // Default 10km
          if (radius) {
            maxDistance = typeof radius === 'number' ? radius : Number(radius);
            if (isNaN(maxDistance)) {
              console.warn('[BuildContext] Invalid radius value:', radius, 'using default 10km');
              maxDistance = 10000;
            }
          }
          
          // verbose logs about maxDistance and court count removed
          
          let facilitiesWithinRadius = 0;
          let facilitiesOutsideRadius = 0;
          const outsideRadiusFacilities = [];
          
          for (const court of courts) {
            if (court.facility && court.facility.location?.coordinates) {
              const facilityId = court.facility._id.toString();
              
              // Calculate distance (returns distance in km)
              const distanceInKm = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                court.facility.location.coordinates[1],
                court.facility.location.coordinates[0]
              );
              
              // Convert distance to meters for comparison
              const distanceInMeters = distanceInKm * 1000;
              
              // Only process unique facilities
              if (!facilityIds.has(facilityId)) {
                facilityIds.add(facilityId);
                
                // Only include facilities within the specified radius (maxDistance is in meters)
                if (distanceInMeters <= maxDistance) {
                  facilitiesWithinRadius++;
                  facilitiesWithDistance.push({
                    id: facilityId,
                    name: court.facility.name,
                    address: court.facility.address,
                    types: court.facility.types,
                    pricePerHour: court.facility.pricePerHour,
                    phoneNumber: court.facility.phoneNumber,
                    location: {
                      lat: court.facility.location.coordinates[1],
                      lng: court.facility.location.coordinates[0]
                    },
                    images: court.facility.images?.slice(0, 1) || [],
                    distance: distanceInMeters // Store distance in meters
                  });
                } else {
                  facilitiesOutsideRadius++;
                  outsideRadiusFacilities.push({
                    name: court.facility.name,
                    distance: (distanceInMeters / 1000).toFixed(2) + 'km',
                    distanceMeters: Math.round(distanceInMeters)
                  });
                }
              }
            }
          }
          
          // verbose facilities stats logging removed
          
          // Sort by distance
          facilitiesWithDistance.sort((a, b) => a.distance - b.distance);
          
          // detailed found facilities logging removed
          
          // Return all facilities within radius (not limited to 10)
          // Frontend can limit display if needed
          context.facilities = facilitiesWithDistance;
        }
      }
    }
    
    // Find nearest facilities if user has location (old logic for backward compatibility)
    if (userLocation && !sportCategoryId && (queryLower.includes('gần') || queryLower.includes('gần nhất') || queryLower.includes('gần đây'))) {
      const facilities = await Facility.find({
        status: 'opening',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [userLocation.lng, userLocation.lat]
            },
            $maxDistance: 10000 // 10km
          }
        }
      })
      .limit(10)
      .populate('owner', 'name')
      .lean();

      context.facilities = facilities.map(f => ({
        id: f._id.toString(),
        name: f.name,
        address: f.address,
        types: f.types,
        pricePerHour: f.pricePerHour,
        phoneNumber: f.phoneNumber,
        location: f.location?.coordinates ? {
          lat: f.location.coordinates[1],
          lng: f.location.coordinates[0]
        } : null,
        images: f.images?.slice(0, 1) || []
      }));
    }

    // Find cheap courts
    if (queryLower.includes('giá rẻ') || queryLower.includes('rẻ') || queryLower.includes('giá thấp') || queryLower.includes('rẻ nhất')) {
      const courts = await Court.find({
        status: 'active'
      })
      .populate({
        path: 'facility',
        match: { status: 'opening' },
        select: 'name address location types pricePerHour'
      })
      .sort({ price: 1 })
      .limit(10)
      .lean();

      context.courts = courts
        .filter(c => c.facility) // Only include courts with active facilities
        .map(c => ({
          id: c._id.toString(),
          name: c.name,
          type: c.type,
          price: c.price,
          capacity: c.capacity,
          facility: {
            id: c.facility._id.toString(),
            name: c.facility.name,
            address: c.facility.address,
            types: c.facility.types,
            location: c.facility.location?.coordinates ? {
              lat: c.facility.location.coordinates[1],
              lng: c.facility.location.coordinates[0]
            } : null
          }
        }));
    }

    // Get user's recent bookings if logged in
    if (userId) {
      const bookings = await Booking.find({ user: userId })
        .populate('court', 'name type price')
        .populate('facility', 'name address')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      context.userBookings = bookings.map(b => ({
        id: b._id.toString(),
        bookingCode: b.bookingCode,
        date: b.date,
        timeSlots: b.timeSlots,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        court: {
          name: b.court?.name,
          type: b.court?.type
        },
        facility: {
          name: b.facility?.name,
          address: b.facility?.address
        }
      }));
    }

    // Search facilities by type or name
    if (queryLower.match(/(bóng đá|tennis|cầu lông|bóng rổ|bóng chuyền|bóng bàn)/)) {
      const sportTypes = [];
      if (queryLower.includes('bóng đá')) sportTypes.push('Bóng đá');
      if (queryLower.includes('tennis')) sportTypes.push('Tennis');
      if (queryLower.includes('cầu lông')) sportTypes.push('Cầu lông');
      if (queryLower.includes('bóng rổ')) sportTypes.push('Bóng rổ');
      if (queryLower.includes('bóng chuyền')) sportTypes.push('Bóng chuyền');
      if (queryLower.includes('bóng bàn')) sportTypes.push('Bóng bàn');

      if (sportTypes.length > 0) {
        const facilities = await Facility.find({
          status: 'opening',
          types: { $in: sportTypes }
        })
        .limit(10)
        .populate('owner', 'name')
        .lean();

        context.facilities = facilities.map(f => ({
          id: f._id.toString(),
          name: f.name,
          address: f.address,
          types: f.types,
          pricePerHour: f.pricePerHour,
          phoneNumber: f.phoneNumber,
          location: f.location?.coordinates ? {
            lat: f.location.coordinates[1],
            lng: f.location.coordinates[0]
          } : null
        }));
      }
    }

    // General search if no specific intent found
    if (context.facilities.length === 0 && context.courts.length === 0) {
      // Try to find facilities by name or address
      if (queryLower.length > 2) {
        const facilities = await Facility.find({
          status: 'opening',
          $or: [
            { name: { $regex: queryLower, $options: 'i' } },
            { address: { $regex: queryLower, $options: 'i' } }
          ]
        })
        .limit(5)
        .populate('owner', 'name')
        .lean();

        context.facilities = facilities.map(f => ({
          id: f._id.toString(),
          name: f.name,
          address: f.address,
          types: f.types,
          pricePerHour: f.pricePerHour,
          phoneNumber: f.phoneNumber,
          location: f.location?.coordinates ? {
            lat: f.location.coordinates[1],
            lng: f.location.coordinates[0]
          } : null
        }));
      }
    }

  } catch (error) {
    console.error('Error building context:', error);
  }

  return context;
};

/**
 * Build context for booking flow - find facilities with available courts
 * @param {Object} params
 * @param {string} params.sportCategoryId - Sport category ID
 * @param {string} params.courtTypeId - Court type ID
 * @param {Array<string>} params.timeSlots - Time slots array (e.g., ["18:00-19:00", "19:00-20:00"])
 * @param {Date|string} params.date - Booking date
 * @param {Object} params.userLocation - User location {lat, lng}
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<Object>} Context object with available facilities
 */
export const buildBookingContext = async ({ sportCategoryId, courtTypeId, timeSlots = [], date, userLocation, userId }) => {
  const context = {
    timestamp: new Date().toISOString(),
    userLocation: userLocation || null,
    facilities: [],
    courts: [],
    availableSlots: [],
  };

  try {
    // Get sport category and court type info
    let sportCategory = null;
    let courtType = null;

    if (sportCategoryId) {
      sportCategory = await SportCategory.findById(sportCategoryId).lean();
    }

    if (courtTypeId) {
      courtType = await CourtType.findById(courtTypeId)
        .populate('sportCategory', 'name')
        .lean();
    }

    // Parse date
    const bookingDate = date ? new Date(date) : new Date();
    bookingDate.setHours(0, 0, 0, 0);

    // Build query for courts
    const courtQuery = {
      status: 'active'
    };

    // Filter by court type if provided
    if (courtType) {
      // Try both type (string) and courtType (ObjectId reference)
      const queryOr = [{ type: courtType.name }];
      if (mongoose.Types.ObjectId.isValid(courtTypeId)) {
        queryOr.push({ courtType: new mongoose.Types.ObjectId(courtTypeId) });
      }
      courtQuery.$or = queryOr;
    } else if (sportCategory) {
      // If only sport category, get all court types for that sport
      const courtTypes = await CourtType.find({
        sportCategory: sportCategoryId,
        status: 'active'
      }).select('name _id').lean();
      
      if (courtTypes.length > 0) {
        const courtTypeNames = courtTypes.map(ct => ct.name);
        const courtTypeIds = courtTypes.map(ct => ct._id);
        const queryOr = [
          { type: { $in: courtTypeNames } },
          { courtType: { $in: courtTypeIds } }
        ];
        if (mongoose.Types.ObjectId.isValid(sportCategoryId)) {
          queryOr.push({ sportCategory: new mongoose.Types.ObjectId(sportCategoryId) });
        }
        courtQuery.$or = queryOr;
      } else {
        // Fallback: query by sportCategory reference
        if (mongoose.Types.ObjectId.isValid(sportCategoryId)) {
          courtQuery.sportCategory = new mongoose.Types.ObjectId(sportCategoryId);
        }
      }
    }

    // Get courts matching criteria
    let courts = await Court.find(courtQuery)
      .populate({
        path: 'facility',
        match: { status: 'opening' },
        select: 'name address location types pricePerHour phoneNumber images'
      })
      .lean();

    // Filter out courts without active facilities
    courts = courts.filter(c => c.facility);

    // If user location provided, sort by distance
    if (userLocation && courts.length > 0) {
      const facilitiesWithLocation = courts
        .filter(c => c.facility.location?.coordinates)
        .map(c => ({
          court: c,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            c.facility.location.coordinates[1],
            c.facility.location.coordinates[0]
          )
        }))
        .sort((a, b) => a.distance - b.distance);

      const facilitiesWithoutLocation = courts
        .filter(c => !c.facility.location?.coordinates)
        .map(c => ({ court: c, distance: Infinity }));

      courts = [...facilitiesWithLocation, ...facilitiesWithoutLocation]
        .map(item => item.court);
    }

    // Check availability for each court if time slots provided
    if (timeSlots.length > 0) {
      const availableCourts = [];

      for (const court of courts.slice(0, 20)) { // Limit to 20 courts for performance
        // Check if all requested time slots are available
        const isAvailable = await Booking.checkAvailability(
          court._id,
          bookingDate,
          timeSlots
        );

        if (isAvailable) {
          availableCourts.push(court);
        }
      }

      courts = availableCourts;
    }

    // Limit results
    courts = courts.slice(0, 10);

    // Group courts by facility
    const facilityMap = new Map();

    for (const court of courts) {
      const facilityId = court.facility._id.toString();
      
      if (!facilityMap.has(facilityId)) {
        facilityMap.set(facilityId, {
          id: facilityId,
          name: court.facility.name,
          address: court.facility.address,
          types: court.facility.types,
          pricePerHour: court.facility.pricePerHour,
          phoneNumber: court.facility.phoneNumber,
          location: court.facility.location?.coordinates ? {
            lat: court.facility.location.coordinates[1],
            lng: court.facility.location.coordinates[0]
          } : null,
          images: court.facility.images?.slice(0, 1) || [],
          courts: []
        });
      }

      const facility = facilityMap.get(facilityId);
      facility.courts.push({
        id: court._id.toString(),
        name: court.name,
        type: court.type,
        price: court.price,
        capacity: court.capacity
      });
    }

    context.facilities = Array.from(facilityMap.values());
    context.courts = courts.map(c => ({
      id: c._id.toString(),
      name: c.name,
      type: c.type,
      price: c.price,
      capacity: c.capacity,
      facility: {
        id: c.facility._id.toString(),
        name: c.facility.name,
        address: c.facility.address,
        types: c.facility.types,
        location: c.facility.location?.coordinates ? {
          lat: c.facility.location.coordinates[1],
          lng: c.facility.location.coordinates[0]
        } : null
      }
    }));

  } catch (error) {
    console.error('Error building booking context:', error);
  }

  return context;
};

/**
 * Build context for suggest flow - find facilities with filters (price, radius, time slots)
 * @param {Object} params
 * @param {string} params.sportCategoryId - Sport category ID
 * @param {Array<string>} params.timeSlots - Time slots array
 * @param {Date|string} params.date - Booking date
 * @param {Object} params.userLocation - User location {lat, lng}
 * @param {string} params.userId - User ID (optional)
 * @param {number} params.priceMin - Minimum price
 * @param {number} params.priceMax - Maximum price
 * @param {number} params.radius - Radius in meters
 * @returns {Promise<Object>} Context object with available facilities
 */
export const buildSuggestContext = async ({ sportCategoryId, timeSlots = [], date, userLocation, userId, priceMin, priceMax, radius }) => {
  const context = {
    timestamp: new Date().toISOString(),
    userLocation: userLocation || null,
    facilities: [],
    courts: [],
  };

  try {
    // Get sport category info
    let sportCategory = null;
    if (sportCategoryId) {
      sportCategory = await SportCategory.findById(sportCategoryId).lean();
    }

    // Parse date
    const bookingDate = date ? new Date(date) : new Date();
    bookingDate.setHours(0, 0, 0, 0);

    // Build query for courts
    const courtQuery = {
      status: 'active'
    };

    // Filter by sport category if provided
    if (sportCategory) {
      const courtTypes = await CourtType.find({
        sportCategory: sportCategoryId,
        status: 'active'
      }).select('name _id').lean();
      
      if (courtTypes.length > 0) {
        const courtTypeNames = courtTypes.map(ct => ct.name);
        const courtTypeIds = courtTypes.map(ct => ct._id);
        courtQuery.$or = [
          { type: { $in: courtTypeNames } },
          { courtType: { $in: courtTypeIds } }
        ];
        if (mongoose.Types.ObjectId.isValid(sportCategoryId)) {
          courtQuery.$or.push({ sportCategory: new mongoose.Types.ObjectId(sportCategoryId) });
        }
      } else {
        if (mongoose.Types.ObjectId.isValid(sportCategoryId)) {
          courtQuery.sportCategory = new mongoose.Types.ObjectId(sportCategoryId);
        }
      }
    }

    // Filter by price range if provided
    if (priceMin !== null || priceMax !== null) {
      const priceQuery = {};
      if (priceMin !== null) priceQuery.$gte = priceMin;
      if (priceMax !== null) priceQuery.$lte = priceMax;
      courtQuery.price = priceQuery;
    }

    // Get courts matching criteria
    let courts = await Court.find(courtQuery)
      .populate({
        path: 'facility',
        match: { status: 'opening' },
        select: 'name address location types pricePerHour phoneNumber images'
      })
      .lean();

    // Filter out courts without active facilities
    courts = courts.filter(c => c.facility);

    // Filter by location and radius if provided
    if (userLocation && radius) {
      courts = courts.filter(c => {
        if (!c.facility.location?.coordinates) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          c.facility.location.coordinates[1],
          c.facility.location.coordinates[0]
        ) * 1000; // Convert to meters
        return distance <= radius;
      });

      // Sort by distance
      courts.sort((a, b) => {
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.facility.location.coordinates[1],
          a.facility.location.coordinates[0]
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.facility.location.coordinates[1],
          b.facility.location.coordinates[0]
        );
        return distA - distB;
      });
    } else if (userLocation) {
      // Sort by distance even without radius limit
      courts.sort((a, b) => {
        if (!a.facility.location?.coordinates) return 1;
        if (!b.facility.location?.coordinates) return -1;
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.facility.location.coordinates[1],
          a.facility.location.coordinates[0]
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.facility.location.coordinates[1],
          b.facility.location.coordinates[0]
        );
        return distA - distB;
      });
    }

    // Check availability for each court if time slots provided
    if (timeSlots.length > 0) {
      const availableCourts = [];

      for (const court of courts.slice(0, 20)) { // Limit to 20 courts for performance
        // Check if all requested time slots are available
        const isAvailable = await Booking.checkAvailability(
          court._id,
          bookingDate,
          timeSlots
        );

        if (isAvailable) {
          availableCourts.push(court);
        }
      }

      courts = availableCourts;
    }

    // Limit results
    courts = courts.slice(0, 10);

    // Group courts by facility
    const facilityMap = new Map();

    for (const court of courts) {
      const facilityId = court.facility._id.toString();
      
      if (!facilityMap.has(facilityId)) {
        facilityMap.set(facilityId, {
          id: facilityId,
          name: court.facility.name,
          address: court.facility.address,
          types: court.facility.types,
          pricePerHour: court.facility.pricePerHour,
          phoneNumber: court.facility.phoneNumber,
          location: court.facility.location?.coordinates ? {
            lat: court.facility.location.coordinates[1],
            lng: court.facility.location.coordinates[0]
          } : null,
          images: court.facility.images?.slice(0, 1) || [],
          courts: []
        });
      }

      const facility = facilityMap.get(facilityId);
      facility.courts.push({
        id: court._id.toString(),
        name: court.name,
        type: court.type,
        price: court.price,
        capacity: court.capacity
      });
    }

    context.facilities = Array.from(facilityMap.values());
    context.courts = courts.map(c => ({
      id: c._id.toString(),
      name: c.name,
      type: c.type,
      price: c.price,
      capacity: c.capacity,
      facility: {
        id: c.facility._id.toString(),
        name: c.facility.name,
        address: c.facility.address,
        types: c.facility.types,
        location: c.facility.location?.coordinates ? {
          lat: c.facility.location.coordinates[1],
          lng: c.facility.location.coordinates[0]
        } : null
      }
    }));

  } catch (error) {
    console.error('Error building suggest context:', error);
  }

  return context;
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default { buildContext, buildBookingContext, buildSuggestContext };

