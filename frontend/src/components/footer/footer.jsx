import React from 'react'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="logo-row">
            <span className="logo-circle small" />
            <span className="logo-circle small" />
            <span className="logo-circle small" />
          </div>
          <p>Phần mềm quản lý đặt sân thể thao dễ tiện lợi tại Việt Nam</p>
        </div>
        <div className="footer-cols">
          <div className="col">
            <h4>Sport Booking</h4>
            <a href="#">Giới thiệu</a>
            <a href="#">Tin tức</a>
            <a href="#">Tuyển dụng</a>
          </div>
          <div className="col">
            <h4>Hỗ trợ</h4>
            <a href="#">Trung tâm trợ giúp</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản</a>
          </div>
          <div className="col">
            <h4>Liên hệ</h4>
            <p>Email: support@datsanthethao.vn</p>
            <p>Hotline: 0345.111.454</p>
            <p>Địa chỉ: Thành phố HCM</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 2025 Đặt Sân Thể Thao</div>
    </footer>
  )
}

export default Footer

