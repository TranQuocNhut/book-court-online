import React from 'react'
import { 
  FiSmartphone, 
  FiCreditCard, 
  FiDollarSign, 
  FiShield,
  FiInfo,
  FiAlertTriangle
} from 'react-icons/fi'
import '../../../../styles/Payment.css'

export default function PaymentInstructions({ selectedMethod }) {
  if (!selectedMethod) return null

  const instructions = {
    momo: {
      icon: <FiSmartphone className="instruction-icon" size={32} />,
      title: 'Hướng dẫn thanh toán MoMo',
      steps: [
        'Bấm "Xác nhận thanh toán" để hiển thị mã QR',
        'Mở ứng dụng MoMo trên điện thoại',
        'Chọn "Quét mã" hoặc "Thanh toán" trong ứng dụng',
        'Quét mã QR trên màn hình',
        'Xác nhận thông tin giao dịch và nhập mã PIN để hoàn tất'
      ],
      note: {
        icon: <FiInfo size={20} />,
        text: 'Giao dịch được mã hóa và bảo mật tuyệt đối. Vui lòng quét mã QR trong vòng 5 phút.'
      }
    },
    vnpay: {
      icon: <FiCreditCard className="instruction-icon" size={32} />,
      title: 'Hướng dẫn thanh toán VNPay',
      steps: [
        'Bấm "Xác nhận thanh toán" để chuyển đến cổng VNPay',
        'Chọn ngân hàng hoặc ví điện tử',
        'Nhập thông tin thẻ/tài khoản',
        'Xác thực OTP để hoàn tất thanh toán'
      ],
      note: {
        icon: <FiShield size={20} />,
        text: 'Hỗ trợ hơn 40 ngân hàng và ví điện tử tại Việt Nam'
      }
    },
    wallet: {
      icon: (
        <img 
          src="/pngtree-vector-wallet-icon-png-image_4869029.jpg" 
          alt="Ví tiền" 
          className="instruction-icon"
          style={{ width: '32px', height: '32px', objectFit: 'contain' }}
        />
      ),
      title: 'Thanh toán bằng ví tiền',
      steps: [
        'Kiểm tra số dư ví của bạn',
        'Bấm "Xác nhận thanh toán" để trừ tiền từ ví',
        'Giao dịch được xử lý ngay lập tức',
        'Bạn sẽ nhận được xác nhận thanh toán thành công'
      ],
      note: {
        icon: <FiInfo size={20} />,
        text: 'Thanh toán nhanh chóng và tiện lợi, không cần chuyển hướng',
        warning: false
      }
    },
    cash: {
      icon: <FiDollarSign className="instruction-icon" size={32} />,
      title: 'Thanh toán tiền mặt tại sân',
      steps: [
        'Bấm "Xác nhận thanh toán" để hoàn tất đặt sân',
        'Bạn sẽ nhận được mã đặt sân qua SMS/Email',
        'Đến sân đúng giờ đã đặt',
        'Xuất trình mã đặt sân và thanh toán trực tiếp'
      ],
      note: {
        icon: <FiAlertTriangle size={20} />,
        text: 'Vui lòng đến sớm 10 phút và mang theo đủ tiền mặt',
        warning: true
      }
    }
  }

  const instruction = instructions[selectedMethod]
  if (!instruction) return null

  return (
    <div className="payment-info-section">
      <div className={`payment-instructions ${selectedMethod}-info`}>
        <div className="instruction-header">
          {instruction.icon}
          <h4>{instruction.title}</h4>
        </div>
        <ol>
          {instruction.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <div className={`info-note ${instruction.note.warning ? 'warning' : ''}`}>
          {instruction.note.icon}
          <p>{instruction.note.text}</p>
        </div>
      </div>
    </div>
  )
}

