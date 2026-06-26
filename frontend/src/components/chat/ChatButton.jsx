import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useMobile from '../../hook/use-mobile';
import useToggle from '../../hook/use-toggle';
import { useAuth } from '../../contexts/AuthContext';
import useUserLocation from '../../hook/use-user-location';
import { aiApi } from '../../api/aiApi';
import FacilityCard from './FacilityCard';
import CourtCard from './CourtCard';
import chatbotAvatar from '../../assets/chatbot.png';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ChatButton.css';

// Quick Replies - Common questions
const QUICK_REPLIES = [
  { text: 'Tìm cơ sở gần nhất', message: 'Tìm các cơ sở gần tôi' },
  { text: 'Gợi ý sân phù hợp', message: 'Gợi ý sân phù hợp' },
];

const ChatButton = () => {
  const location = useLocation();
  const isMobile = useMobile(768);
  const [isOpen, { toggle: toggleChat }] = useToggle(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { userLocation } = useUserLocation();

  // Booking flow state
  const [bookingStep, setBookingStep] = useState(null); // 'sport' | 'courtType' | 'date' | 'timeSlots' | 'search' | 'suggest' | 'priceRange' | 'radius'
  const [flowType, setFlowType] = useState(null); // 'booking' | 'suggest' | 'find_nearby' | 'find_nearby'
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedCourtType, setSelectedCourtType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [dynamicQuickReplies, setDynamicQuickReplies] = useState([]);
  const [sportCategories, setSportCategories] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  
  // Date/Time picker states for availability check
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(null);
  const [tempSelectedTime, setTempSelectedTime] = useState(null);
  const [currentMessageId, setCurrentMessageId] = useState(null); // Track which message triggered picker

  // Hide chat button on auth pages, admin pages, owner pages, and chat page
  const authPages = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password', '/auth/callback', '/auth/error'];
  const isAuthPage = authPages.some(path => location.pathname.startsWith(path));
  const isAdminPage = location.pathname.startsWith('/admin');
  const isOwnerPage = location.pathname.startsWith('/owner');
  const isChatPage = location.pathname.startsWith('/chat');

  // Initialize with welcome message and reset booking flow
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        role: 'bot',
        content: 'Chào bạn! Chào mừng bạn đến với hệ thống đặt sân thể thao.\n\nTôi có thể giúp bạn tìm kiếm sân, kiểm tra lịch trống hoặc đặt sân ngay bây giờ không?',
        timestamp: new Date()
      }]);
      // Reset booking flow
      setBookingStep(null);
      setFlowType(null);
      setSelectedSport(null);
      setSelectedCourtType(null);
      setSelectedDate(null);
      setSelectedTimeSlots([]);
      setSelectedPriceRange(null);
      setSelectedRadius(null);
      setDynamicQuickReplies([]);
    }
  }, [isOpen]);

  // Clear chat history and start new conversation
  const handleClearChat = () => {
    // Reset all state
    setMessages([{
      id: Date.now(),
      role: 'bot',
      content: 'Chào bạn! Chào mừng bạn đến với hệ thống đặt sân thể thao.\n\nTôi có thể giúp bạn tìm kiếm sân, kiểm tra lịch trống hoặc đặt sân ngay bây giờ không?',
      timestamp: new Date()
    }]);
    setBookingStep(null);
    setFlowType(null);
    setSelectedSport(null);
    setSelectedCourtType(null);
    setSelectedDate(null);
    setSelectedTimeSlots([]);
    setSelectedPriceRange(null);
    setSelectedRadius(null);
    setDynamicQuickReplies([]);
  };

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (messageText, sportCategoryId = null) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }));

      // Get user location if available
      const location = userLocation ? {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      } : null;

      // Use sportCategoryId from parameter or from selectedSport if in find_nearby flow
      const finalSportCategoryId = sportCategoryId || (flowType === 'find_nearby' && selectedSport?.id) || null;

      // Check if message is about finding nearby facilities
      const isFindNearbyMessage = messageText.toLowerCase().includes('tìm') && 
        (messageText.toLowerCase().includes('gần') || messageText.toLowerCase().includes('cơ sở'));

      // Call AI API
      const response = await aiApi.chat(
        userMessage.content,
        conversationHistory,
        location,
        finalSportCategoryId
      );

      if (response.success) {
        const botMessage = {
          id: Date.now() + 1,
          role: 'bot',
          content: response.data.message,
          facilities: response.data.facilities || [],
          courts: response.data.courts || [],
          alternativeSlots: response.data.alternativeSlots || [],
          templateType: response.data.templateType,
          actions: response.data.actions || [],
          needsMoreInfo: response.data.needsMoreInfo,
          missing: response.data.missing || [],
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);

        // Handle template actions (for availability check)
        if (response.data.actions && response.data.actions.length > 0) {
          setDynamicQuickReplies(response.data.actions.map(action => ({
            text: action.label,
            message: action.value || action.label,
            data: {
              type: action.type,
              action: action.action,
              value: action.value
            }
          })));
        }

        // If needs radius selection (after sport selection in find_nearby flow)
        if (response.data.needsRadiusSelection && response.data.radiusOptions) {
          setFlowType('find_nearby');
          setBookingStep('radius');
          const radiusQuickReplies = response.data.radiusOptions.map(option => ({
            text: option.text,
            message: option.text,
            data: {
              type: 'radius',
              value: option.value,
              text: option.text
            }
          }));
          setDynamicQuickReplies(radiusQuickReplies);
          return;
        }

        // If needs sport selection, start find_nearby flow
        if (response.data.needsSportSelection || (isFindNearbyMessage && !finalSportCategoryId)) {
          // Don't add another message, just start the flow
          setFlowType('find_nearby');
          setBookingStep('sport');
          
          // Load sport categories
          try {
            const sportResponse = await aiApi.getBookingData();
            if (sportResponse.success) {
              setSportCategories(sportResponse.data.sportCategories || []);
              const quickReplies = (sportResponse.data.sportCategories || []).map(cat => ({
                text: cat.name,
                message: `Chọn ${cat.name}`,
                data: { type: 'sport', id: cat.id, name: cat.name }
              }));
              setDynamicQuickReplies(quickReplies);
            }
          } catch (error) {
            console.error('Error loading sport categories:', error);
          }
        }
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        content: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await sendMessage(inputMessage);
  };

  const handleQuickReply = async (message, data = null) => {
    // Handle special actions (datepicker, timepicker)
    if (data && data.action) {
      if (data.action === 'open_datepicker') {
        setShowDatePicker(true);
        setCurrentMessageId(messages[messages.length - 1]?.id || null);
        return;
      } else if (data.action === 'open_timepicker') {
        setShowTimePicker(true);
        setCurrentMessageId(messages[messages.length - 1]?.id || null);
        return;
      } else if (data.action === 'open_datetimepicker') {
        setShowDatePicker(true);
        setCurrentMessageId(messages[messages.length - 1]?.id || null);
        return;
      }
    }

    // Handle date/time quick replies (from template actions)
    if (data && data.type) {
      if (data.type === 'date' || data.type === 'datetime') {
        // Quick reply for date (e.g., "Hôm nay", "Ngày mai")
        // Send message with the value directly
        sendMessage(message || data.value);
        return;
      } else if (data.type === 'time') {
        // Quick reply for time (e.g., "Sáng", "Chiều", "Tối")
        // Convert to time range format
        let timeValue = message || data.value;
        if (timeValue === 'sáng') timeValue = 'tầm 6h-12h';
        else if (timeValue === 'chiều') timeValue = 'tầm 12h-18h';
        else if (timeValue === 'tối') timeValue = 'tầm 18h-22h';
        sendMessage(timeValue);
        return;
      }
    }

    // Check flow type
    if (message === 'Hướng dẫn tôi cách đặt sân' || (bookingStep && flowType === 'booking')) {
      await handleBookingFlow(message, data);
    } else if (message === 'Gợi ý sân phù hợp' || (bookingStep && flowType === 'suggest')) {
      await handleSuggestFlow(message, data);
    } else if (message === 'Tìm các cơ sở gần tôi' || message === 'Tìm cơ sở gần nhất' || (bookingStep && flowType === 'find_nearby')) {
      await handleFindNearbyFlow(message, data);
    } else {
      sendMessage(message);
    }
  };

  // Handle date selection from picker
  const handleDateSelect = (date) => {
    setTempSelectedDate(date);
    setShowDatePicker(false);
    
    // Format date for Vietnamese to match timeParser format
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = dayNames[date.getDay()];
    const dateStr = `${dayName}, ngày ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    
    // If time picker is also open, just set date and keep time picker open
    if (showTimePicker) {
      // Send combined date and time
      sendMessage(`${dateStr} tầm ${tempSelectedTime || '18h-20h'}`);
    } else {
      // Send message with selected date
      sendMessage(dateStr);
    }
  };

  // Handle time selection
  const handleTimeSelect = (timeRange) => {
    setTempSelectedTime(timeRange);
    setShowTimePicker(false);
    
    // Format time range
    let timeStr;
    if (typeof timeRange === 'string') {
      // Convert "18:00-20:00" to "18h-20h" format for parser
      timeStr = timeRange.replace(/:/g, 'h');
    } else if (timeRange.start && timeRange.end) {
      timeStr = `${timeRange.start.replace(':', 'h')}-${timeRange.end.replace(':', 'h')}`;
    } else {
      timeStr = timeRange;
    }
    
    // If date was already selected, send combined
    if (tempSelectedDate) {
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayName = dayNames[tempSelectedDate.getDay()];
      const dateStr = `${dayName}, ngày ${tempSelectedDate.getDate()}/${tempSelectedDate.getMonth() + 1}/${tempSelectedDate.getFullYear()}`;
      sendMessage(`${dateStr} tầm ${timeStr}`);
    } else {
      // Send message with selected time
      sendMessage(`tầm ${timeStr}`);
    }
    
    // Reset temp values
    setTempSelectedDate(null);
    setTempSelectedTime(null);
  };

  const handleBookingFlow = async (message, data = null) => {
    if (!bookingStep) {
      // Start booking flow
      setFlowType('booking');
      setBookingStep('sport');

      // Load sport categories
      try {
        const response = await aiApi.getBookingData();
        if (response.success) {
          setSportCategories(response.data.sportCategories || []);
          const quickReplies = (response.data.sportCategories || []).map(cat => ({
            text: cat.name,
            message: `Chọn ${cat.name}`,
            data: { type: 'sport', id: cat.id, name: cat.name }
          }));
          setDynamicQuickReplies(quickReplies);

          // Add bot message
          const botMessage = {
            id: Date.now(),
            role: 'bot',
            content: 'Bạn muốn đặt sân cho môn thể thao nào?',
            timestamp: new Date(),
            quickReplies: quickReplies
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Error loading sport categories:', error);
      }
      return;
    }

    // Handle booking step
    if (bookingStep === 'sport' && data && data.type === 'sport') {
      setSelectedSport(data);
      setBookingStep('courtType');

      // Load court types for selected sport
      try {
        const response = await aiApi.getBookingData(data.id);
        if (response.success) {
          setCourtTypes(response.data.courtTypes || []);
          const quickReplies = (response.data.courtTypes || []).map(ct => ({
            text: ct.name,
            message: `Chọn ${ct.name}`,
            data: { type: 'courtType', id: ct.id, name: ct.name }
          }));
          setDynamicQuickReplies(quickReplies);

          // Add user and bot messages
          const userMsg = {
            id: Date.now(),
            role: 'user',
            content: data.name,
            timestamp: new Date()
          };
          const botMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: `Bạn đã chọn ${data.name}. Vui lòng chọn loại sân:`,
            timestamp: new Date(),
            quickReplies: quickReplies
          };
          setMessages(prev => [...prev, userMsg, botMsg]);
        }
      } catch (error) {
        console.error('Error loading court types:', error);
      }
      return;
    }

    if (bookingStep === 'courtType' && data && data.type === 'courtType') {
      setSelectedCourtType(data);
      setBookingStep('date');

      // Generate date options (today, tomorrow, and next 6 days)
      const dateOptions = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = dayNames[date.getDay()];
        const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

        let label = '';
        if (i === 0) {
          label = `Hôm nay (${dateStr})`;
        } else if (i === 1) {
          label = `Ngày mai (${dateStr})`;
        } else {
          label = `${dayName} (${dateStr})`;
        }

        dateOptions.push({
          text: label,
          message: label,
          data: {
            type: 'date',
            date: date.toISOString().split('T')[0],
            dateObj: date
          }
        });
      }

      setDynamicQuickReplies(dateOptions);

      // Add user and bot messages
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.name,
        timestamp: new Date()
      };
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: `Bạn đã chọn ${data.name}. Vui lòng chọn ngày muốn đặt sân:`,
        timestamp: new Date(),
        quickReplies: dateOptions
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    if (bookingStep === 'date' && data && data.type === 'date') {
      setSelectedDate(data.dateObj);
      setBookingStep('timeSlots');

      // Generate time slot options
      const timeSlots = [];
      for (let hour = 6; hour <= 22; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        timeSlots.push({
          text: `${startTime}-${endTime}`,
          message: startTime,
          data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
        });
      }
      setDynamicQuickReplies(timeSlots);

      // Format date for display
      const dateDisplay = data.dateObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric'
      });

      // Add user and bot messages
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        timestamp: new Date()
      };
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: `Bạn đã chọn ${dateDisplay}. Vui lòng chọn khung giờ muốn chơi (có thể chọn nhiều):`,
        timestamp: new Date(),
        quickReplies: timeSlots,
        allowMultiple: true
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    if (bookingStep === 'timeSlots' && data && data.type === 'timeSlot') {
      // Toggle time slot selection (no message, just visual feedback)
      setSelectedTimeSlots(prev => {
        const exists = prev.includes(data.slot);
        const newSlots = exists
          ? prev.filter(s => s !== data.slot)
          : [...prev, data.slot];

        // Update quick replies to show search button if slots selected
        if (newSlots.length > 0) {
          const timeSlots = [];
          for (let hour = 6; hour <= 22; hour++) {
            const startTime = `${String(hour).padStart(2, '0')}:00`;
            const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
            timeSlots.push({
              text: `${startTime}-${endTime}`,
              message: startTime,
              data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
            });
          }
          timeSlots.push({ text: 'Tìm sân', message: 'Tìm sân', data: { type: 'search' } });
          setDynamicQuickReplies(timeSlots);
        } else {
          // Remove search button if no slots selected
          const timeSlots = [];
          for (let hour = 6; hour <= 22; hour++) {
            const startTime = `${String(hour).padStart(2, '0')}:00`;
            const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
            timeSlots.push({
              text: `${startTime}-${endTime}`,
              message: startTime,
              data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
            });
          }
          setDynamicQuickReplies(timeSlots);
        }

        return newSlots;
      });

      // Don't add user message - just visual feedback via selected state
      return;
    }

    if (bookingStep === 'timeSlots' && data && data.type === 'search') {
      // Validate that time slots are selected
      if (selectedTimeSlots.length === 0) {
        const errorMsg = {
          id: Date.now(),
          role: 'bot',
          content: 'Vui lòng chọn ít nhất một khung giờ trước khi tìm sân.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      // Search facilities
      setBookingStep('search');
      setIsTyping(true);
      setIsLoading(true);

      // Add user message showing selected time slots
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: `Tìm sân cho các khung giờ: ${selectedTimeSlots.join(', ')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        const location = userLocation ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        } : null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingDate = selectedDate || today;
        bookingDate.setHours(0, 0, 0, 0);

        const response = await aiApi.searchBookingFacilities({
          sportCategoryId: selectedSport?.id,
          courtTypeId: selectedCourtType?.id,
          timeSlots: selectedTimeSlots,
          date: bookingDate.toISOString(),
          userLocation: location
        });

        if (response.success) {

          const facilities = response.data.facilities || [];
          const botMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: facilities.length > 0
              ? `Tôi tìm thấy ${facilities.length} cơ sở phù hợp với yêu cầu của bạn:`
              : 'Không tìm thấy cơ sở nào phù hợp. Vui lòng thử lại với khung giờ khác.',
            facilities: facilities,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, userMsg, botMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setSelectedCourtType(null);
          setSelectedDate(null);
          setSelectedTimeSlots([]);
          setSelectedPriceRange(null);
          setSelectedRadius(null);
          setDynamicQuickReplies([]);
        }
      } catch (error) {
        console.error('Error searching facilities:', error);
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: 'Xin lỗi, có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    }
  };

  // Handle suggest flow - Gợi ý sân phù hợp
  const handleSuggestFlow = async (message, data = null) => {
    if (!bookingStep) {
      // Start suggest flow
      setFlowType('suggest');
      setBookingStep('sport');

      // Load sport categories
      try {
        const response = await aiApi.getBookingData();
        if (response.success) {
          setSportCategories(response.data.sportCategories || []);
          const quickReplies = (response.data.sportCategories || []).map(cat => ({
            text: cat.name,
            message: `Chọn ${cat.name}`,
            data: { type: 'sport', id: cat.id, name: cat.name }
          }));
          setDynamicQuickReplies(quickReplies);

          // Add bot message
          const botMessage = {
            id: Date.now(),
            role: 'bot',
            content: 'Bạn muốn tìm sân cho môn thể thao nào?',
            timestamp: new Date(),
            quickReplies: quickReplies
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Error loading sport categories:', error);
      }
      return;
    }

    // Handle sport selection
    if (bookingStep === 'sport' && data && data.type === 'sport') {
      setSelectedSport(data);
      setBookingStep('priceRange');

      // Price range options
      const priceRanges = [
        { text: 'Dưới 100k/giờ', min: 0, max: 100000 },
        { text: '100k - 200k/giờ', min: 100000, max: 200000 },
        { text: '200k - 300k/giờ', min: 200000, max: 300000 },
        { text: '300k - 500k/giờ', min: 300000, max: 500000 },
        { text: 'Trên 500k/giờ', min: 500000, max: null },
        { text: 'Không quan tâm', min: null, max: null }
      ];

      const quickReplies = priceRanges.map(pr => ({
        text: pr.text,
        message: pr.text,
        data: { type: 'priceRange', min: pr.min, max: pr.max, text: pr.text }
      }));
      setDynamicQuickReplies(quickReplies);

      // Add user and bot messages
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.name,
        timestamp: new Date()
      };
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: `Bạn đã chọn ${data.name}. Vui lòng chọn khoảng giá phù hợp:`,
        timestamp: new Date(),
        quickReplies: quickReplies
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    // Handle price range selection
    if (bookingStep === 'priceRange' && data && data.type === 'priceRange') {
      setSelectedPriceRange(data);
      setBookingStep('radius');

      // Radius options (in km)
      const radiusOptions = [
        { text: '1 km', value: 1 },
        { text: '3 km', value: 3 },
        { text: '5 km', value: 5 },
        { text: '10 km', value: 10 },
        { text: '15 km', value: 15 },
        { text: 'Không giới hạn', value: null }
      ];

      const quickReplies = radiusOptions.map(r => ({
        text: r.text,
        message: r.text,
        data: { type: 'radius', value: r.value, text: r.text }
      }));
      setDynamicQuickReplies(quickReplies);

      // Add user and bot messages
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.text,
        timestamp: new Date()
      };
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: `Bạn đã chọn ${data.text}. Vui lòng chọn bán kính tìm kiếm:`,
        timestamp: new Date(),
        quickReplies: quickReplies
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    // Handle radius selection
    if (bookingStep === 'radius' && data && data.type === 'radius') {
      setSelectedRadius(data);
      setBookingStep('timeSlots');

      // Generate time slot options
      const timeSlots = [];
      for (let hour = 6; hour <= 22; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        timeSlots.push({
          text: `${startTime}-${endTime}`,
          message: startTime,
          data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
        });
      }
      setDynamicQuickReplies(timeSlots);

      // Add user and bot messages
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.text,
        timestamp: new Date()
      };
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: `Bạn đã chọn ${data.text}. Vui lòng chọn giờ trống muốn tìm (có thể chọn nhiều):`,
        timestamp: new Date(),
        quickReplies: timeSlots,
        allowMultiple: true
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      return;
    }

    // Handle time slots selection (same as booking flow)
    if (bookingStep === 'timeSlots' && data && data.type === 'timeSlot') {
      // Toggle time slot selection (no message, just visual feedback)
      setSelectedTimeSlots(prev => {
        const exists = prev.includes(data.slot);
        const newSlots = exists
          ? prev.filter(s => s !== data.slot)
          : [...prev, data.slot];

        // Update quick replies to show search button if slots selected
        if (newSlots.length > 0) {
          const timeSlots = [];
          for (let hour = 6; hour <= 22; hour++) {
            const startTime = `${String(hour).padStart(2, '0')}:00`;
            const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
            timeSlots.push({
              text: `${startTime}-${endTime}`,
              message: startTime,
              data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
            });
          }
          timeSlots.push({ text: 'Tìm sân', message: 'Tìm sân', data: { type: 'search' } });
          setDynamicQuickReplies(timeSlots);
        } else {
          // Remove search button if no slots selected
          const timeSlots = [];
          for (let hour = 6; hour <= 22; hour++) {
            const startTime = `${String(hour).padStart(2, '0')}:00`;
            const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
            timeSlots.push({
              text: `${startTime}-${endTime}`,
              message: startTime,
              data: { type: 'timeSlot', slot: `${startTime}-${endTime}` }
            });
          }
          setDynamicQuickReplies(timeSlots);
        }

        return newSlots;
      });

      // Don't add user message - just visual feedback via selected state
      return;
    }

    // Handle search
    if (bookingStep === 'timeSlots' && data && data.type === 'search') {
      // Validate that time slots are selected
      if (selectedTimeSlots.length === 0) {
        const errorMsg = {
          id: Date.now(),
          role: 'bot',
          content: 'Vui lòng chọn ít nhất một khung giờ trước khi tìm sân.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      // Search facilities
      setBookingStep('search');
      setIsTyping(true);
      setIsLoading(true);

      // Add user message showing selected criteria
      const criteria = [];
      if (selectedSport) criteria.push(`Môn: ${selectedSport.name}`);
      if (selectedPriceRange) criteria.push(`Giá: ${selectedPriceRange.text}`);
      if (selectedRadius) criteria.push(`Bán kính: ${selectedRadius.text}`);
      if (selectedTimeSlots.length > 0) criteria.push(`Giờ: ${selectedTimeSlots.join(', ')}`);

      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: `Tìm sân với: ${criteria.join(', ')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        const location = userLocation ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        } : null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const response = await aiApi.searchSuggestFacilities({
          sportCategoryId: selectedSport?.id,
          timeSlots: selectedTimeSlots,
          date: today.toISOString(),
          userLocation: location,
          priceMin: selectedPriceRange?.min,
          priceMax: selectedPriceRange?.max,
          radius: selectedRadius?.value ? selectedRadius.value * 1000 : null // Convert km to meters
        });

        if (response.success) {
          const facilities = response.data.facilities || [];
          const botMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: facilities.length > 0
              ? `Tôi tìm thấy ${facilities.length} cơ sở phù hợp với yêu cầu của bạn:`
              : 'Không tìm thấy cơ sở nào phù hợp. Vui lòng thử lại với tiêu chí khác.',
            facilities: facilities,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setSelectedPriceRange(null);
          setSelectedRadius(null);
          setSelectedTimeSlots([]);
          setDynamicQuickReplies([]);
        }
      } catch (error) {
        console.error('Error searching facilities:', error);
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: 'Xin lỗi, có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    }
  };

  // Handle find nearby flow - Tìm cơ sở gần nhất
  const handleFindNearbyFlow = async (message, data = null) => {
    if (!bookingStep) {
      // Start find nearby flow
      setFlowType('find_nearby');
      setBookingStep('sport');

      // Load sport categories
      try {
        const response = await aiApi.getBookingData();
        if (response.success) {
          setSportCategories(response.data.sportCategories || []);
          const quickReplies = (response.data.sportCategories || []).map(cat => ({
            text: cat.name,
            message: `Chọn ${cat.name}`,
            data: { type: 'sport', id: cat.id, name: cat.name }
          }));
          setDynamicQuickReplies(quickReplies);

          // Add bot message
          const botMessage = {
            id: Date.now(),
            role: 'bot',
            content: 'Bạn muốn tìm cơ sở cho môn thể thao nào?',
            timestamp: new Date(),
            quickReplies: quickReplies
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Error loading sport categories:', error);
      }
      return;
    }

    // Handle sport selection
    if (bookingStep === 'sport' && data && data.type === 'sport') {
      setSelectedSport(data);
      setIsTyping(true);
      setIsLoading(true);

      // Add user message
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.name,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        // Get user location
        const location = userLocation ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        } : null;

        if (!location) {
          const errorMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: 'Để tìm cơ sở gần nhất, vui lòng cung cấp vị trí của bạn.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setDynamicQuickReplies([]);
          setIsTyping(false);
          setIsLoading(false);
          return;
        }

        // Call AI API with sport category and location (without radius to trigger radius selection)
        const response = await aiApi.chat(
          'Tìm các cơ sở gần tôi',
          [],
          location,
          data.id
        );

        if (response.success) {
          // If needs radius selection, show quick replies for radius selection
          if (response.data.needsRadiusSelection && response.data.radiusOptions) {
            setBookingStep('radius');
            const radiusQuickReplies = response.data.radiusOptions.map(option => ({
              text: option.text,
              message: option.text,
              data: {
                type: 'radius',
                value: option.value,
                text: option.text
              }
            }));
            setDynamicQuickReplies(radiusQuickReplies);
            
            // Add bot message asking for radius
            const botMsg = {
              id: Date.now() + 1,
              role: 'bot',
              content: response.data.message,
              timestamp: new Date(),
              quickReplies: radiusQuickReplies
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            setIsLoading(false);
            return;
          }

          // Otherwise, show results
          const botMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: response.data.message,
            facilities: response.data.facilities || [],
            courts: response.data.courts || [],
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setSelectedRadius(null);
          setDynamicQuickReplies([]);
        }
      } catch (error) {
        console.error('Error finding nearby facilities:', error);
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: 'Xin lỗi, có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    }

    // Handle radius selection
    if (bookingStep === 'radius' && data && data.type === 'radius') {
      setSelectedRadius(data);
      setBookingStep('search');
      setIsTyping(true);
      setIsLoading(true);

      // Add user message
      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: data.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      try {
        // Get user location
        const location = userLocation ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        } : null;

        if (!location) {
          const errorMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: 'Để tìm cơ sở gần nhất, vui lòng cung cấp vị trí của bạn.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setSelectedRadius(null);
          setDynamicQuickReplies([]);
          setIsTyping(false);
          setIsLoading(false);
          return;
        }

        // Call AI API with sport category, location, and radius
        const response = await aiApi.chat(
          'Tìm các cơ sở gần tôi',
          [],
          location,
          selectedSport?.id,
          data.value
        );

        if (response.success) {
          const botMsg = {
            id: Date.now() + 1,
            role: 'bot',
            content: response.data.message,
            facilities: response.data.facilities || [],
            courts: response.data.courts || [],
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMsg]);
          setBookingStep(null);
          setFlowType(null);
          setSelectedSport(null);
          setSelectedRadius(null);
          setDynamicQuickReplies([]);
        }
      } catch (error) {
        console.error('Error finding nearby facilities:', error);
        const errorMsg = {
          id: Date.now() + 1,
          role: 'bot',
          content: 'Xin lỗi, có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
        setIsLoading(false);
      }
    }
  };

  // Check if should show quick replies
  const shouldShowQuickReplies = () => {
    if (messages.length === 0) return false;
    if (isTyping || isLoading) return false;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'bot') return false;

    // Show dynamic quick replies if in booking/suggest flow
    if (dynamicQuickReplies.length > 0 && bookingStep) {
      return true;
    }

    // Show static quick replies if not in any flow (user hasn't selected a Quick Reply yet)
    if (!bookingStep) {
      return true;
    }

    return false;
  };

  // Get quick replies to show
  const getQuickReplies = () => {
    if (dynamicQuickReplies.length > 0) {
      return dynamicQuickReplies;
    }
    return QUICK_REPLIES;
  };

  // Don't render chat button on auth pages, admin pages, owner pages, or chat page
  if (isAuthPage || isAdminPage || isOwnerPage || isChatPage) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        title="Chat với AI Assistant"
      >
        <svg
          className="chat-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
            fill="currentColor"
          />
          <path
            d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="chat-window"
          style={isMobile ? {
            width: 'calc(100vw - 40px)',
            height: 'calc(100vh - 120px)',
            bottom: '80px',
            right: '20px',
            left: '20px'
          } : undefined}
        >
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <img src={chatbotAvatar} alt="Chatbot Avatar" />
              </div>
              <div className="chat-header-text">
                <h4>AI Assistant</h4>
                <span className="status">Đang hoạt động</span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button 
                className="clear-button" 
                onClick={handleClearChat}
                title="Xóa lịch sử chat"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="close-button" onClick={toggleChat} title="Đóng chat">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                <div className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  {message.role === 'bot' && (
                    <div className="message-avatar">
                      <img src={chatbotAvatar} alt="Chatbot Avatar" />
                    </div>
                  )}
                  <div className="message-content">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                {/* Display facilities list */}
                {message.role === 'bot' && message.facilities && message.facilities.length > 0 && (
                  <div className="chat-results-container">
                    <div className="chat-results-title">Cơ sở tìm thấy:</div>
                    <div className="chat-facilities-list">
                      {message.facilities.map((facility) => (
                        <FacilityCard
                          key={facility.id}
                          facility={facility}
                          userLocation={userLocation}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Display courts list */}
                {message.role === 'bot' && message.courts && message.courts.length > 0 && (
                  <div className="chat-results-container">
                    <div className="chat-results-title">Sân tìm thấy:</div>
                    <div className="chat-facilities-list">
                      {message.courts.map((court) => (
                        <CourtCard
                          key={court.id}
                          court={court}
                          userLocation={userLocation}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {isTyping && (
              <div className="message bot-message typing-message">
                <div className="message-avatar">
                  <img src={chatbotAvatar} alt="Chatbot Avatar" />
                </div>
                <div className="message-content typing-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies */}
            {shouldShowQuickReplies() && (
              <div className="chat-quick-replies">
                {getQuickReplies().map((reply, index) => {
                  const isSelected = reply.data?.type === 'timeSlot' && selectedTimeSlots.includes(reply.data.slot);
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`quick-reply-button ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleQuickReply(reply.message, reply.data)}
                      disabled={isLoading}
                    >
                      {reply.text}
                    </button>
                  );
                })}
                {bookingStep === 'timeSlots' && selectedTimeSlots.length > 0 && (
                  <div className="selected-time-slots">
                    <span>Đã chọn: {selectedTimeSlots.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Date Picker Modal */}
            {showDatePicker && (
              <div 
                className="chat-datepicker-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowDatePicker(false);
                  }
                }}
              >
                <div className="chat-datepicker-modal">
                  <div className="chat-datepicker-header">
                    <h3>Chọn ngày</h3>
                    <button 
                      className="chat-datepicker-close"
                      onClick={() => setShowDatePicker(false)}
                    >
                      ×
                    </button>
                  </div>
                  <DatePicker
                    selected={tempSelectedDate || new Date()}
                    onChange={handleDateSelect}
                    minDate={new Date()}
                    inline
                    locale="vi"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
            )}

            {/* Time Picker */}
            {showTimePicker && (
              <div 
                className="chat-timepicker-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowTimePicker(false);
                  }
                }}
              >
                <div className="chat-timepicker-modal">
                  <div className="chat-timepicker-header">
                    <h3>Chọn khung giờ</h3>
                    <button 
                      className="chat-timepicker-close"
                      onClick={() => setShowTimePicker(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="chat-timepicker-options">
                    {/* Quick time ranges */}
                    <div className="time-range-group">
                      <h4>Sáng</h4>
                      <div className="time-slots-grid">
                        {['06:00-12:00', '07:00-09:00', '09:00-11:00'].map(slot => (
                          <button
                            key={slot}
                            className="time-slot-button"
                            onClick={() => handleTimeSelect(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-range-group">
                      <h4>Chiều</h4>
                      <div className="time-slots-grid">
                        {['12:00-18:00', '14:00-16:00', '16:00-18:00'].map(slot => (
                          <button
                            key={slot}
                            className="time-slot-button"
                            onClick={() => handleTimeSelect(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-range-group">
                      <h4>Tối</h4>
                      <div className="time-slots-grid">
                        {['18:00-22:00', '18:00-20:00', '20:00-22:00'].map(slot => (
                          <button
                            key={slot}
                            className="time-slot-button"
                            onClick={() => handleTimeSelect(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Custom time range */}
                    <div className="time-range-group">
                      <h4>Khung giờ khác</h4>
                      <div className="custom-time-input">
                        <input
                          type="time"
                          id="start-time"
                          style={{ marginRight: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                        />
                        <span>đến</span>
                        <input
                          type="time"
                          id="end-time"
                          style={{ marginLeft: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                        />
                        <button
                          className="apply-time-button"
                          onClick={() => {
                            const start = document.getElementById('start-time').value;
                            const end = document.getElementById('end-time').value;
                            if (start && end) {
                              handleTimeSelect(`${start}-${end}`);
                            }
                          }}
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <div className="input-container">
              <input
                type="text"
                placeholder="Nhập tin nhắn của bạn..."
                className="message-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!inputMessage.trim() || isLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatButton;
