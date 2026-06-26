// Custom hook to fetch facility data, reviews, and sport categories
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { facilityApi } from '../../../../api/facilityApi';
import { reviewApi } from '../../../../api/reviewApi';
import { categoryApi } from '../../../../api/categoryApi';
import { transformFacilityToVenue } from '../utils/dataTransformers';

/**
 * Custom hook to manage facility data, reviews, and sport categories
 * @param {string} venueId - Facility ID
 * @returns {Object} { venueData, loading, error, reviews, reviewsStats, reviewsTotal, sportCategories, timeSlotDuration }
 */
export const useFacilityData = (venueId) => {
  const [venueData, setVenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsStats, setReviewsStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [sportCategories, setSportCategories] = useState([]);
  const [timeSlotDuration, setTimeSlotDuration] = useState(60);

  useEffect(() => {
    const fetchData = async () => {
      if (!venueId) {
        setError('Không tìm thấy ID cơ sở');
        setLoading(false);
        toast.error('Không tìm thấy ID cơ sở');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch facility data
        const facilityResult = await facilityApi.getFacilityById(venueId);
        
        if (!facilityResult.success || !facilityResult.data) {
          setError('Không tìm thấy cơ sở');
          toast.error('Không tìm thấy cơ sở');
          return;
        }

        const transformedData = transformFacilityToVenue(facilityResult.data);
        setVenueData(transformedData);
        // Lưu timeSlotDuration vào state để sử dụng trong formatTimeSlots
        setTimeSlotDuration(transformedData.timeSlotDuration || 60);

        // Fetch reviews for this facility
        try {
          const reviewsResult = await reviewApi.getFacilityReviews(venueId, {
            page: 1,
            limit: 10
          });
          
          if (reviewsResult.reviews) {
            // Transform API reviews to component format
            const transformedReviews = reviewsResult.reviews.map(review => ({
              id: review._id || review.id,
              user: review.user?.name || 'Người dùng',
              rating: review.rating,
              date: review.createdAt || review.date,
              comment: review.comment || '',
              avatar: review.user?.avatar 
                ? review.user.avatar 
                : (review.user?.name?.charAt(0) || 'U').toUpperCase()
            }));
            
            setReviews(transformedReviews);
            
            // Update stats if available
            if (reviewsResult.stats) {
              const avgRating = reviewsResult.stats.averageRating || 0;
              const totalRev = reviewsResult.stats.totalReviews || 0;
              
              setReviewsStats({
                averageRating: avgRating,
                totalReviews: totalRev
              });
              setReviewsTotal(reviewsResult.pagination?.total || reviewsResult.reviews.length);
              
              // Update venueData rating from stats
              transformedData.rating = avgRating;
              transformedData.reviewCount = totalRev;
              setVenueData(transformedData);
            } else {
              // Fallback: calculate from reviews if no stats
              if (transformedReviews.length > 0) {
                const calculatedAvg = transformedReviews.reduce((sum, r) => sum + r.rating, 0) / transformedReviews.length;
                console.log('No stats, calculating average:', calculatedAvg);
                setReviewsStats({
                  averageRating: calculatedAvg,
                  totalReviews: transformedReviews.length
                });
                transformedData.rating = calculatedAvg;
                transformedData.reviewCount = transformedReviews.length;
                setVenueData(transformedData);
              }
            }
          }
        } catch (reviewsError) {
          // Silently fail reviews fetch, just show empty state
          console.error('Error fetching reviews:', reviewsError);
        }

        // Fetch sport categories and filter by facility types
        try {
          const categoriesResult = await categoryApi.getSportCategories({
            status: 'active'
          });
          
          if (categoriesResult.success && categoriesResult.data) {
            const categoriesList = Array.isArray(categoriesResult.data)
              ? categoriesResult.data
              : [];
            
            // Get facility types (array of sport names)
            const facilityTypes = facilityResult.data.types || [];
            
            // Filter categories to only include those that match facility types
            const matchingCategories = categoriesList
              .filter(cat => {
                const categoryName = cat.name || '';
                // Check if category name matches any facility type (case-insensitive)
                return facilityTypes.some(facilityType => 
                  categoryName.toLowerCase() === facilityType.toLowerCase()
                );
              })
              .map(cat => ({
                id: cat._id || cat.id,
                name: cat.name
              }));
            
            setSportCategories(matchingCategories);
          }
        } catch (categoriesError) {
          console.error('Error fetching sport categories:', categoriesError);
        }

      } catch (error) {
        setError('Không thể tải thông tin cơ sở');
        toast.error('Không thể tải thông tin cơ sở. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueId]);

  return {
    venueData,
    loading,
    error,
    reviews,
    reviewsStats,
    reviewsTotal,
    sportCategories,
    timeSlotDuration,
    setVenueData,
    setReviews,
    setReviewsStats,
    setReviewsTotal
  };
};

