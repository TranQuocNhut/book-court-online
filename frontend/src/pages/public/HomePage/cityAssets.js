/**
 * Mapping hình ảnh và gradient cho các thành phố phổ biến
 * Chỉnh sửa file này để thay đổi hình ảnh và màu sắc cho các thành phố
 */

export const cityAssets = {
  'Hồ Chí Minh': {
    image: 'https://cdn.thuvienphapluat.vn/uploads/tintuc/2024/01/19/dan-so-tphcm.jpg',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    district: 'TP.HCM'
  },
  'Hà Nội': {
    image: 'https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2024/01/dia-diem-du-lich-o-ha-noi-thumb.jpg',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    district: 'Thủ đô'
  },
  'Đà Nẵng': {
    image: 'https://daivietourist.vn/wp-content/uploads/2024/08/kinh-nghiem-du-lich-da-nang-1.jpg',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    district: 'Miền Trung'
  },
  'Cần Thơ': {
    image: 'https://ik.imagekit.io/tvlk/blog/2024/08/thoi-tiet-can-tho-6.jpg?tr=q-70,c-at_max,w-1000,h-600',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    district: 'Đồng bằng sông Cửu Long'
  },
  'Nha Trang': {
    image: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcS3r__-fVjcIDMSNR_CnAtZKAK1m7_HJkhjS34GJNxbR8bqWiwM7gNsdlNLVszChcp53BO9Sq8ll09uxTiPnT2whLU&s=19',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    district: 'Khánh Hòa'
  },
  'Hải Phòng': {
    image: 'https://truongchinhtritohieu.haiphong.gov.vn/upload/ccth/product/2024/2/LIEN-bb34c650face49aead55a8419d49d888.png?maxwidth=2048',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    district: 'Miền Bắc'
  }
}

// Default assets cho các thành phố không có trong mapping
export const defaultAssets = {
  image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  district: ''
}

