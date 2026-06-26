# Flow Kiểm Tra Lịch Trống với Template System

## Tổng quan

Hệ thống kiểm tra lịch trống sử dụng **template-based approach** - AI chỉ lọc và gợi ý dữ liệu, không tự tạo nội dung. Tất cả messages đều được tạo từ các template có sẵn.

## Kiến trúc

```
User Query 
  → Message Filter
  → Intent Analysis (check_availability)
  → Availability Service (parse time, check DB)
  → Template Selection
  → Response với Template Message + Structured Data
```

## Flow chi tiết

### 1. User gửi câu hỏi về sân trống

**Ví dụ:**
- "Tối thứ 3 tuần sau còn sân không?"
- "Chiều nay tầm 5h-7h có sân nào trống?"
- "Còn sân không?"

### 2. Parse và xác định thông tin

Service sẽ:
- Parse thời gian từ câu hỏi (date, time range)
- Xác định facility (nếu có trong query)
- Xác định sport category (nếu có)
- Xác định thông tin còn thiếu

### 3. Xử lý theo trạng thái

#### 3.1. Thiếu thông tin (`needsMoreInfo: true`)

**Template được sử dụng:**
- `askFacilityTemplate()` - Thiếu facility
- `askDateTemplate()` - Thiếu date
- `askTimeTemplate()` - Thiếu time
- `askDateTimeTemplate()` - Thiếu cả date và time

**Response format:**
```json
{
  "success": true,
  "data": {
    "message": "...", // Từ template
    "templateType": "ask_facility|ask_date|ask_time|ask_datetime",
    "needsMoreInfo": true,
    "missing": ["facility"] | ["date"] | ["time"] | ["date", "time"],
    "actions": [
      {
        "type": "date|time|datetime|button",
        "label": "...",
        "value": "...",
        "action": "open_datepicker" // optional
      }
    ],
    "facilityId": null,
    "facilityName": null,
    "date": null,
    "timeRange": null
  }
}
```

#### 3.2. Đủ thông tin - Có sân trống (`templateType: 'available_courts'`)

**Template:** `availableCourtsTemplate()`

**Response format:**
```json
{
  "success": true,
  "data": {
    "message": "...", // Từ template với danh sách sân
    "templateType": "available_courts",
    "facilities": [...],
    "courts": [
      {
        "id": "...",
        "name": "...",
        "type": "...",
        "price": 100000,
        "facility": {...},
        "availableSlots": ["18:00-19:00", "19:00-20:00"],
        "totalPrice": 200000
      }
    ],
    "date": "2024-01-15T00:00:00.000Z",
    "timeRange": { "start": "18:00", "end": "20:00" },
    "actions": [
      {
        "type": "button",
        "label": "Đặt sân ngay",
        "action": "book_court",
        "courtId": "..."
      }
    ]
  }
}
```

#### 3.3. Đủ thông tin - Hết sân, có gợi ý (`templateType: 'no_available_with_alternatives'`)

**Template:** `noAvailableWithAlternativesTemplate()`

**Response format:**
```json
{
  "success": true,
  "data": {
    "message": "...", // Từ template với gợi ý
    "templateType": "no_available_with_alternatives",
    "alternativeSlots": [
      {
        "court": {...},
        "facility": {...},
        "date": "2024-01-15T00:00:00.000Z",
        "slots": ["17:00-18:00", "20:30-21:30"]
      }
    ],
    "actions": [
      {
        "type": "button",
        "label": "Chọn khung giờ thay thế",
        "action": "select_alternative"
      }
    ]
  }
}
```

#### 3.4. Không tìm thấy sân (`templateType: 'no_courts_found'`)

**Template:** `noCourtsFoundTemplate()`

**Response format:**
```json
{
  "success": false,
  "data": {
    "message": "...", // Từ template
    "templateType": "no_courts_found",
    "actions": [
      {
        "type": "button",
        "label": "Tìm cơ sở khác",
        "action": "search_other_facility"
      }
    ]
  }
}
```

## Template Messages

Tất cả templates được định nghĩa trong `backend/utils/availabilityTemplates.js`:

### 1. `askFacilityTemplate()`
Yêu cầu user chọn facility.

### 2. `askDateTemplate(facilityName)`
Yêu cầu user chọn ngày, có quick actions:
- Hôm nay
- Ngày mai
- Chọn ngày khác (mở date picker)

### 3. `askTimeTemplate(facilityName, date)`
Yêu cầu user chọn khung giờ, có quick actions:
- Sáng (6h-12h)
- Chiều (12h-18h)
- Tối (18h-22h)
- Chọn khung giờ khác

### 4. `askDateTimeTemplate(facilityName)`
Yêu cầu cả ngày và giờ, có quick actions kết hợp.

### 5. `availableCourtsTemplate(data)`
Hiển thị danh sách sân còn trống với format:
```
✅ Tìm thấy X sân còn trống...

1. Tên sân - Tên cơ sở
   📍 Địa chỉ
   💰 Giá
   ⏰ Khung giờ
   🔖 ID sân
```

### 6. `noAvailableWithAlternativesTemplate(data)`
Hiển thị gợi ý thay thế khi hết sân:
```
😔 Tiếc quá, không còn sân trống...

💡 Nhưng tôi có một số gợi ý thay thế:

1. Tên sân
   ⏰ Ngày khác: ...
   🎯 Khung giờ có sẵn: ...
   💰 Giá
```

### 7. `noCourtsFoundTemplate(facilityName)`
Thông báo không tìm thấy sân phù hợp.

## Actions (Quick Replies / Buttons)

Mỗi template có thể kèm theo `actions` array để frontend hiển thị quick replies hoặc buttons:

```javascript
{
  "type": "date|time|datetime|button|text",
  "label": "Hiển thị cho user",
  "value": "Giá trị gửi lại khi user click",
  "action": "open_datepicker|book_court|select_alternative" // optional
}
```

## Cách sử dụng API

### Endpoint: `POST /api/ai/chat`

**Request:**
```json
{
  "message": "Tối thứ 3 tuần sau còn sân không?",
  "sportCategoryId": "optional",
  "userLocation": { "lat": 10.8231, "lng": 106.6297 }
}
```

**Response:**
Xem các format ở trên tùy theo trạng thái.

### Endpoint: `POST /api/ai/check-availability`

**Request:**
```json
{
  "query": "Chiều nay tầm 5h-7h có sân nào trống?",
  "sportCategoryId": "optional",
  "facilityId": "optional",
  "userLocation": { "lat": 10.8231, "lng": 106.6297 }
}
```

**Response:**
Tương tự như `/api/ai/chat`.

## Frontend Integration

### 1. Hiển thị message từ template
```javascript
const response = await api.post('/api/ai/chat', { message });
const { message, templateType, actions } = response.data.data;

// Hiển thị message
displayMessage(message);

// Hiển thị quick replies/buttons nếu có
if (actions && actions.length > 0) {
  displayQuickReplies(actions);
}
```

### 2. Xử lý actions
```javascript
function handleQuickReply(action) {
  switch(action.type) {
    case 'date':
      if (action.action === 'open_datepicker') {
        openDatePicker();
      } else {
        // Gửi lại với value của action
        sendMessage(action.value);
      }
      break;
    
    case 'button':
      if (action.action === 'book_court') {
        navigateToBooking(action.courtId);
      } else if (action.action === 'select_alternative') {
        showAlternatives(action.alternatives);
      }
      break;
  }
}
```

### 3. Hiển thị structured data
```javascript
// Hiển thị danh sách sân
if (response.data.data.courts) {
  displayCourtsList(response.data.data.courts);
}

// Hiển thị gợi ý thay thế
if (response.data.data.alternativeSlots) {
  displayAlternatives(response.data.data.alternativeSlots);
}
```

## Ưu điểm của Template System

1. **Consistency**: Tất cả messages có format nhất quán
2. **Maintainability**: Dễ chỉnh sửa văn bản, không cần thay đổi logic
3. **Localization**: Dễ dàng thêm đa ngôn ngữ
4. **Testability**: Dễ test vì messages được định nghĩa rõ ràng
5. **No AI Generation**: Không phụ thuộc vào AI để tạo nội dung, tránh lỗi

## Notes

- AI chỉ làm nhiệm vụ **parse** và **filter** dữ liệu
- Tất cả messages đều từ **template** có sẵn
- Frontend có thể tùy chỉnh hiển thị dựa trên `templateType` và `actions`
- Structured data (`courts`, `alternatives`) được cung cấp riêng để frontend có thể render custom UI

