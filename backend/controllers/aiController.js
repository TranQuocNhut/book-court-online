import { analyzeIntent, generateResponse } from '../utils/responseHandler.js';
import { buildContext, buildBookingContext, buildSuggestContext } from '../utils/contextBuilder.js';
import { filterMessage } from '../utils/messageFilter.js';
import { checkAvailabilityWithQuery } from '../utils/availabilityService.js';
import {
  askFacilityTemplate,
  askDateTemplate,
  askTimeTemplate,
  askDateTimeTemplate,
  availableCourtsTemplate,
  noAvailableWithAlternativesTemplate,
  noCourtsFoundTemplate,
  facilityClosedTemplate
} from '../utils/availabilityTemplates.js';
import SportCategory from '../models/SportCategory.js';
import CourtType from '../models/CourtType.js';
import SystemConfig from '../models/SystemConfig.js';
import Facility from '../models/Facility.js';
import User from '../models/User.js';

/**
 * POST /api/ai/chat
 * Chat with AI assistant - Sử dụng câu trả lời có sẵn dựa trên dữ liệu database
 */
export const chat = async (req, res, next) => {
  try {
    const { message, conversationHistory = [], userLocation, sportCategoryId, radius } = req.body;
    const userId = req.user?._id?.toString() || null;
    
    // Removed verbose debug log for received AI chat params to reduce console noise

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn'
      });
    }

    // Lọc tin nhắn trước khi xử lý
    const filterResult = filterMessage(message);
    
    if (!filterResult.isValid) {
      return res.status(400).json({
        success: false,
        message: filterResult.reason || 'Tin nhắn không hợp lệ. Vui lòng nhập lại.'
      });
    }

    const filteredMessage = filterResult.filtered;

    // Phân tích intent từ tin nhắn đã lọc
    const intent = analyzeIntent(filteredMessage);

    // Nếu là intent kiểm tra sân trống, sử dụng availability service với template
    if (intent === 'check_availability') {
      const availabilityResult = await checkAvailabilityWithQuery({
        query: filteredMessage,
        sportCategoryId: sportCategoryId || null,
        facilityId: null,
        userLocation: userLocation || null
      });

      // Sử dụng template để tạo response
      let templateResponse = null;

      // Kiểm tra nếu cần thêm thông tin
      if (availabilityResult.needsMoreInfo) {
        const missing = availabilityResult.missing || [];
        
        if (missing.includes('time') && !availabilityResult.date) {
          // Thiếu cả date và time
          templateResponse = askDateTimeTemplate(availabilityResult.facilityName || null);
        } else if (missing.includes('time')) {
          // Chỉ thiếu time
          templateResponse = askTimeTemplate(availabilityResult.facilityName || null, availabilityResult.date);
        } else if (missing.includes('date')) {
          // Chỉ thiếu date
          templateResponse = askDateTemplate(availabilityResult.facilityName || null);
        } else if (missing.includes('facility')) {
          // Thiếu facility
          templateResponse = askFacilityTemplate();
        }
      } else if (availabilityResult.success) {
        // Có kết quả kiểm tra
        if (availabilityResult.templateType === 'available_courts') {
          // Có sân trống
          templateResponse = availableCourtsTemplate({
            courts: availabilityResult.availableCourts,
            date: availabilityResult.date,
            timeRange: availabilityResult.timeRange,
            facilityName: availabilityResult.facilityName
          });
        } else if (availabilityResult.templateType === 'no_available_with_alternatives') {
          // Hết sân nhưng có gợi ý
          templateResponse = noAvailableWithAlternativesTemplate({
            alternatives: availabilityResult.alternativeSlots,
            date: availabilityResult.date,
            timeRange: availabilityResult.timeRange,
            facilityName: availabilityResult.facilityName
          });
        }
      } else {
        // Không tìm thấy sân hoặc lỗi
        if (availabilityResult.templateType === 'no_courts_found') {
          templateResponse = noCourtsFoundTemplate(availabilityResult.facilityName || null);
        } else {
          // Lỗi hoặc không xác định
          templateResponse = {
            message: availabilityResult.error || 'Không thể kiểm tra sân trống. Vui lòng thử lại.',
            type: 'error',
            actions: []
          };
        }
      }

      if (templateResponse) {
        // Convert available courts to format compatible with response (nếu có)
        const facilities = [];
        const courts = [];
        const facilityMap = new Map();

        if (availabilityResult.availableCourts && availabilityResult.availableCourts.length > 0) {
          availabilityResult.availableCourts.forEach(item => {
            const facilityId = item.facility.id;
            if (!facilityMap.has(facilityId)) {
              facilityMap.set(facilityId, {
                id: item.facility.id,
                name: item.facility.name,
                address: item.facility.address,
                phoneNumber: item.facility.phoneNumber,
                courts: []
              });
            }
            
            facilityMap.get(facilityId).courts.push({
              id: item.court.id,
              name: item.court.name,
              type: item.court.type,
              price: item.court.price,
              availableSlots: item.availableSlots,
              totalPrice: item.totalPrice
            });

            courts.push({
              id: item.court.id,
              name: item.court.name,
              type: item.court.type,
              price: item.court.price,
              facility: {
                id: item.facility.id,
                name: item.facility.name,
                address: item.facility.address
              },
              availableSlots: item.availableSlots,
              totalPrice: item.totalPrice
            });
          });

          facilities.push(...Array.from(facilityMap.values()));
        }

        return res.json({
          success: true,
          data: {
            message: templateResponse.message,
            templateType: templateResponse.type,
            facilities: facilities,
            courts: courts,
            alternativeSlots: availabilityResult.alternativeSlots || [],
            date: availabilityResult.date,
            timeRange: availabilityResult.timeRange,
            facilityId: availabilityResult.facilityId,
            facilityName: availabilityResult.facilityName,
            needsMoreInfo: availabilityResult.needsMoreInfo || false,
            missing: availabilityResult.missing || [],
            actions: templateResponse.actions || [],
            templateData: templateResponse.data || {},
            needsSportSelection: false,
            context: {
              facilitiesCount: facilities.length,
              courtsCount: courts.length,
            }
          }
        });
      }
    }

    // Build context dựa trên user query đã lọc và intent
    const context = await buildContext({
      userQuery: filteredMessage,
      userLocation: userLocation || null,
      userId: userId,
      sportCategoryId: sportCategoryId || null,
      radius: radius || null
    });

    // Xử lý intent contact_support - lấy thông tin liên hệ
    if (intent === 'contact_support') {
      try {
        // Lấy thông tin hỗ trợ từ SystemConfig
        const systemConfig = await SystemConfig.getConfig();
        context.supportContactInfo = {
          email: systemConfig.supportEmail || 'support@datsanonline.com',
          phone: systemConfig.supportPhone || '1900123456'
        };

        // Thử tìm tên cơ sở trong tin nhắn hoặc conversation history
        let facilityName = null;
        
        // Tìm trong tin nhắn hiện tại - nhiều pattern khác nhau
        const facilityPatterns = [
          /(?:cơ sở|sân|facility|sân thể thao)\s+([^,.\n?]+)/i,
          /([^,.\n?]+)\s+(?:cơ sở|sân|facility)/i,
          /liên hệ\s+(?:với\s+)?([^,.\n?]+)/i
        ];
        
        for (const pattern of facilityPatterns) {
          const match = filteredMessage.match(pattern);
          if (match && match[1]) {
            facilityName = match[1].trim();
            // Loại bỏ các từ không cần thiết
            facilityName = facilityName.replace(/\b(của|với|tại|ở)\b/gi, '').trim();
            if (facilityName.length > 2) {
              break;
            }
          }
        }
        
        // Tìm trong conversation history
        if (!facilityName && conversationHistory && conversationHistory.length > 0) {
          const reversedHistory = [...conversationHistory].reverse();
          for (const msg of reversedHistory) {
            const content = msg.content || '';
            for (const pattern of facilityPatterns) {
              const match = content.match(pattern);
              if (match && match[1]) {
                facilityName = match[1].trim().replace(/\b(của|với|tại|ở)\b/gi, '').trim();
                if (facilityName.length > 2) {
                  break;
                }
              }
            }
            if (facilityName && facilityName.length > 2) break;
          }
        }

        // Nếu tìm thấy tên cơ sở, lấy thông tin chủ sân
        if (facilityName) {
          const facility = await Facility.findOne({
            name: { $regex: facilityName, $options: 'i' },
            status: 'opening'
          })
          .populate('owner', 'email phone name')
          .lean();

          if (facility && facility.owner) {
            context.facilityName = facility.name;
            context.ownerContactInfo = {
              phoneNumber: facility.phoneNumber || facility.owner.phone || null,
              email: facility.owner.email || null,
              ownerName: facility.owner.name || null
            };
          }
        }

        // Nếu không tìm thấy cơ sở cụ thể, kiểm tra xem có facilityId trong context không
        if (!context.ownerContactInfo && context.facilities && context.facilities.length > 0) {
          // Lấy facility đầu tiên từ context
          const firstFacility = context.facilities[0];
          if (firstFacility.id) {
            const facility = await Facility.findById(firstFacility.id)
              .populate('owner', 'email phone name')
              .lean();

            if (facility && facility.owner) {
              context.facilityName = facility.name;
              context.ownerContactInfo = {
                phoneNumber: facility.phoneNumber || facility.owner.phone || null,
                email: facility.owner.email || null,
                ownerName: facility.owner.name || null
              };
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
        // Fallback: vẫn trả về thông tin support từ SystemConfig
        const systemConfig = await SystemConfig.getConfig().catch(() => null);
        if (systemConfig) {
          context.supportContactInfo = {
            email: systemConfig.supportEmail || 'support@datsanonline.com',
            phone: systemConfig.supportPhone || '1900123456'
          };
        }
      }
    }

    // Tạo câu trả lời dựa trên intent và context
    const response = generateResponse(intent, context);

    res.json({
      success: true,
      data: {
        message: response.message,
        facilities: response.facilities || [],
        courts: response.courts || [],
        needsSportSelection: response.needsSportSelection || false,
        needsRadiusSelection: response.needsRadiusSelection || false,
        radiusOptions: response.radiusOptions || [],
        supportContactInfo: response.supportContactInfo || null,
        ownerContactInfo: response.ownerContactInfo || null,
        context: {
          facilitiesCount: response.facilities?.length || 0,
          courtsCount: response.courts?.length || 0,
        }
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    next(error);
  }
};

/**
 * GET /api/ai/suggest-facilities
 * Get facility suggestions based on query
 */
export const suggestFacilities = async (req, res, next) => {
  try {
    const { query, lat, lng, maxDistance = 10000 } = req.query;
    const userId = req.user?._id?.toString() || null;

    const userLocation = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

    const context = await buildContext({
      userQuery: query || '',
      userLocation: userLocation,
      userId: userId
    });

    res.json({
      success: true,
      data: {
        facilities: context.facilities || [],
        courts: context.courts || [],
        hasLocation: !!userLocation
      }
    });
  } catch (error) {
    console.error('Suggest Facilities Error:', error);
    next(error);
  }
};

/**
 * GET /api/ai/booking-data
 * Get sport categories and court types for booking flow
 */
export const getBookingData = async (req, res, next) => {
  try {
    const { sportCategoryId } = req.query;

    // Get sport categories
    const sportCategories = await SportCategory.find({ status: 'active' })
      .sort({ order: 1, name: 1 })
      .select('_id name')
      .lean();

    let courtTypes = [];
    if (sportCategoryId) {
      // Get court types for specific sport category
      courtTypes = await CourtType.find({
        sportCategory: sportCategoryId,
        status: 'active'
      })
        .populate('sportCategory', 'name')
        .sort({ order: 1, name: 1 })
        .select('_id name sportCategory')
        .lean();
    }

    res.json({
      success: true,
      data: {
        sportCategories: sportCategories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name
        })),
        courtTypes: courtTypes.map(ct => ({
          id: ct._id.toString(),
          name: ct.name,
          sportCategory: ct.sportCategory?.name || ''
        }))
      }
    });
  } catch (error) {
    console.error('Get Booking Data Error:', error);
    next(error);
  }
};

/**
 * POST /api/ai/booking-search
 * Search facilities for booking with sport, court type, time slots
 */
export const searchBookingFacilities = async (req, res, next) => {
  try {
    const { sportCategoryId, courtTypeId, timeSlots, date, userLocation } = req.body;
    const userId = req.user?._id?.toString() || null;

    const context = await buildBookingContext({
      sportCategoryId,
      courtTypeId,
      timeSlots: timeSlots || [],
      date: date || new Date(),
      userLocation: userLocation || null,
      userId
    });

    res.json({
      success: true,
      data: {
        facilities: context.facilities || [],
        courts: context.courts || [],
        availableSlots: context.availableSlots || []
      }
    });
  } catch (error) {
    console.error('Search Booking Facilities Error:', error);
    next(error);
  }
};

/**
 * POST /api/ai/suggest-search
 * Search facilities with suggestions (price range, radius, time slots)
 */
export const searchSuggestFacilities = async (req, res, next) => {
  try {
    const { sportCategoryId, timeSlots, date, userLocation, priceMin, priceMax, radius } = req.body;
    const userId = req.user?._id?.toString() || null;

    const context = await buildSuggestContext({
      sportCategoryId,
      timeSlots: timeSlots || [],
      date: date || new Date(),
      userLocation: userLocation || null,
      userId,
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      radius: radius || null
    });

    res.json({
      success: true,
      data: {
        facilities: context.facilities || [],
        courts: context.courts || []
      }
    });
  } catch (error) {
    console.error('Search Suggest Facilities Error:', error);
    next(error);
  }
};

/**
 * POST /api/ai/check-availability
 * Kiểm tra sân trống từ câu hỏi tự nhiên với gợi ý thông minh
 * Example: "Tối thứ 3 tuần sau còn sân không?", "Chiều nay tầm 5h-7h có sân nào trống?"
 */
export const checkAvailability = async (req, res, next) => {
  try {
    const { query, sportCategoryId, facilityId, userLocation } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi về sân trống'
      });
    }

    // Lọc tin nhắn trước khi xử lý
    const filterResult = filterMessage(query);
    
    if (!filterResult.isValid) {
      return res.status(400).json({
        success: false,
        message: filterResult.reason || 'Câu hỏi không hợp lệ. Vui lòng nhập lại.'
      });
    }

     const filteredQuery = filterResult.filtered;
     const userLocationObj = userLocation || null;

     // Kiểm tra sân trống với availability service
     const result = await checkAvailabilityWithQuery({
       query: filteredQuery,
       sportCategoryId: sportCategoryId || null,
       facilityId: facilityId || null,
       userLocation: userLocationObj
     });

     // Sử dụng template để tạo response
     let templateResponse = null;

     if (result.needsMoreInfo) {
       const missing = result.missing || [];
       
       if (missing.includes('time') && !result.date) {
         templateResponse = askDateTimeTemplate(result.facilityName || null);
       } else if (missing.includes('time')) {
         templateResponse = askTimeTemplate(result.facilityName || null, result.date);
       } else if (missing.includes('date')) {
         templateResponse = askDateTemplate(result.facilityName || null);
       } else if (missing.includes('facility')) {
         templateResponse = askFacilityTemplate();
       }
     } else if (result.success) {
       if (result.templateType === 'available_courts') {
         templateResponse = availableCourtsTemplate({
           courts: result.availableCourts,
           date: result.date,
           timeRange: result.timeRange,
           facilityName: result.facilityName
         });
       } else if (result.templateType === 'no_available_with_alternatives') {
         templateResponse = noAvailableWithAlternativesTemplate({
           alternatives: result.alternativeSlots,
           date: result.date,
           timeRange: result.timeRange,
           facilityName: result.facilityName
         });
       }
     } else {
       if (result.templateType === 'no_courts_found') {
         templateResponse = noCourtsFoundTemplate(result.facilityName || null);
       } else {
         templateResponse = {
           message: result.error || 'Không thể kiểm tra sân trống. Vui lòng thử lại.',
           type: 'error',
           actions: []
         };
       }
     }

     if (templateResponse) {
       // Convert available courts to response format (nếu có)
       const facilities = [];
       const courts = [];
       const facilityMap = new Map();

       if (result.availableCourts && result.availableCourts.length > 0) {
         result.availableCourts.forEach(item => {
           const facilityId = item.facility.id;
           if (!facilityMap.has(facilityId)) {
             facilityMap.set(facilityId, {
               id: item.facility.id,
               name: item.facility.name,
               address: item.facility.address,
               phoneNumber: item.facility.phoneNumber,
               courts: []
             });
           }
           
           facilityMap.get(facilityId).courts.push({
             id: item.court.id,
             name: item.court.name,
             type: item.court.type,
             price: item.court.price,
             availableSlots: item.availableSlots,
             totalPrice: item.totalPrice
           });

           courts.push({
             id: item.court.id,
             name: item.court.name,
             type: item.court.type,
             price: item.court.price,
             facility: {
               id: item.facility.id,
               name: item.facility.name,
               address: item.facility.address
             },
             availableSlots: item.availableSlots,
             totalPrice: item.totalPrice
           });
         });

         facilities.push(...Array.from(facilityMap.values()));
       }

       res.json({
         success: true,
         data: {
           message: templateResponse.message,
           templateType: templateResponse.type,
           facilities: facilities,
           courts: courts,
           alternativeSlots: result.alternativeSlots || [],
           date: result.date,
           timeRange: result.timeRange,
           facilityId: result.facilityId,
           facilityName: result.facilityName,
           needsMoreInfo: result.needsMoreInfo || false,
           missing: result.missing || [],
           actions: templateResponse.actions || [],
           templateData: templateResponse.data || {}
         }
       });
     } else {
       res.json({
         success: false,
         message: 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
         facilities: [],
         courts: [],
         alternativeSlots: []
       });
     }
  } catch (error) {
    console.error('Check Availability Error:', error);
    next(error);
  }
};

