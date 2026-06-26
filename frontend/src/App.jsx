import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Layouts
import Header from "./components/header/header.jsx";
import Footer from "./components/footer/footer.jsx";

// Components
import ProtectedRoute, { AdminRoute, OwnerRoute } from "./components/ProtectedRoute.jsx";
import ChatButton from "./components/chat/ChatButton.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import PendingBookingNotification from "./components/PendingBookingNotification.jsx";

// Admin Layout & Routes
import AdminLayout from "./layouts/AdminLayout";
import AdminRoutes from "./pages/private/Admin/AdminRoutes";

// Owner Layout & Routes
import OwnerLayout from "./layouts/OwnerLayout";
import OwnerRoutes from "./pages/private/Owner/OwnerRoutes";
import OwnerSetup from "./pages/private/Owner/OwnerSetup.jsx";

// Public pages
import HomePage from "./pages/public/HomePage.jsx";
import ProfilePage from "./pages/public/ProfilePage";
import ProfileRoutes from "./pages/public/ProfilePage/ProfileRoutes";
import Booking from "./pages/public/Booking";
import Payment from "./pages/public/Payment.jsx";
import Chat from "./pages/public/Chat.jsx";
import Wallet from "./pages/public/Wallet";
import WalletSuccess from "./pages/public/Wallet/WalletSuccess.jsx";
import WalletFailed from "./pages/public/Wallet/WalletFailed.jsx";
import Partner from "./pages/public/Partner.jsx";
import Facilities from "./pages/public/Facilities.jsx";
import Promotion from "./pages/public/Promotion.jsx";
import Tournament from "./pages/public/Tournament.jsx";
import Feedback from "./pages/public/Feedback.jsx";
import TournamentDetail from "./pages/public/Tournament/TournamentDetail.jsx";
import CreateTournament from "./pages/public/Tournament/CreateTournament.jsx";
import CreateInternalTournament from "./pages/public/Tournament/CreateInternalTournament.jsx";
import InternalTournamentPayment from "./pages/public/Tournament/InternalTournamentPayment.jsx";
import NotificationsPage from "./pages/public/Notifications.jsx";
import RedeemPoints from "./pages/public/Loyalty/RedeemPoints.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AuthCallback from "./pages/auth/AuthCallback.jsx";
import AuthError from "./pages/auth/AuthError.jsx";
import NotFound from "./pages/public/NotFoud.jsx";



function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
        <ScrollToTop />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <ChatButton />
        <PendingBookingNotification />
        <Routes>
          {/* Auth callback routes-No layout */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthError />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminLayout>
                <AdminRoutes />
              </AdminLayout>
            </AdminRoute>
          } />

          {/* Owner Setup Route - Protected, separate page */}
          <Route path="/owner/setup" element={
            <OwnerRoute>
              <OwnerSetup />
            </OwnerRoute>
          } />

          {/* Owner Routes - Protected */}
          <Route path="/owner/*" element={
            <OwnerRoute>
              <OwnerLayout>
                <OwnerRoutes />
              </OwnerLayout>
            </OwnerRoute>
          } />

          {/* Booking Route - With Footer */}
          <Route path="/booking" element={
            <div className="layout">
              <Header />
              <Booking />
              <Footer />
            </div>
          } />

          {/* Payment Route - With Footer */}
          <Route path="/payment" element={
            <div className="layout">
              <Header />
              <Payment />
              <Footer />
            </div>
          } />

          {/* Chat Route - With Header only */}
          <Route path="/chat" element={
            <div className="layout">
              <Header />
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            </div>
          } />

          {/* Wallet Routes - With Footer */}
          <Route path="/wallet" element={
            <div className="layout">
              <Header />
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
              <Footer />
            </div>
          } />
          <Route path="/wallet-success" element={
            <div className="layout">
              <Header />
              <ProtectedRoute>
                <WalletSuccess />
              </ProtectedRoute>
              <Footer />
            </div>
          } />
          <Route path="/wallet-failed" element={
            <div className="layout">
              <Header />
              <ProtectedRoute>
                <WalletFailed />
              </ProtectedRoute>
              <Footer />
            </div>
          } />

          {/* Public Routes - With Header/Footer */}
          <Route path="/*" element={
            <div className="layout">
              <Header />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile/*" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }>
                  <Route path="*" element={<ProfileRoutes />} />
                </Route>

                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/loyalty/redeem" element={
                  <ProtectedRoute>
                    <RedeemPoints />
                  </ProtectedRoute>
                } />
                <Route path="/partner" element={<Partner />} />
                <Route path="/facilities" element={<Facilities />} />
                <Route path="/promotion" element={<Promotion />} />
                <Route path="/tournament" element={<Tournament />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/tournament/create" element={<CreateTournament />} />
                <Route path="/tournament/create/internal" element={<CreateInternalTournament />} />
                <Route path="/tournament/payment/internal" element={<InternalTournamentPayment />} />
                <Route path="/tournament/:id/*" element={<TournamentDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
          } />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
