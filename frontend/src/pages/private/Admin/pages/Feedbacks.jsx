import React, { useState, useMemo, useEffect } from "react";
import { AlertCircle, MessageSquare, Flag } from "lucide-react";
import { toast } from "react-toastify";
import { feedbackApi } from "../../../../api/feedbackApi";
import { reviewApi } from "../../../../api/reviewApi";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import FeedbackStats from "../components/Feedbacks/FeedbackStats";
import FeedbackFilters from "../components/Feedbacks/FeedbackFilters";
import FeedbackTable from "../components/Feedbacks/FeedbackTable";
import FeedbackDetailModal from "../components/Feedbacks/FeedbackDetailModal";
import FeedbackResponseModal from "../components/Feedbacks/FeedbackResponseModal";

const Feedbacks = () => {
  const [activeTab, setActiveTab] = useState("feedback"); // "feedback" hoặc "review-reports"
  const [feedbacks, setFeedbacks] = useState([]);
  const [reviewReports, setReviewReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    complaints: 0,
    suggestions: 0,
  });
  const [reviewReportStats, setReviewReportStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewReportModalOpen, setIsReviewReportModalOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch feedbacks from API
  useEffect(() => {
    if (activeTab !== "feedback") return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pageSize,
          ...(typeFilter !== "all" && { type: typeFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery }),
        };

        const response = await feedbackApi.getFeedbacks(params);
        
        // Map API response to component format
        const mappedFeedbacks = response.feedbacks.map((fb) => ({
          id: fb._id,
          senderName: fb.senderName,
          senderEmail: fb.senderEmail,
          senderPhone: fb.senderPhone || "",
          senderRole: fb.senderRole,
          type: fb.type,
          subject: fb.subject,
          content: fb.content,
          relatedFacility: fb.relatedFacility?.name || null,
          relatedBooking: fb.relatedBooking?.bookingCode || null,
          status: fb.status,
          createdAt: fb.createdAt,
          createdTime: new Date(fb.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          resolvedAt: fb.resolvedAt || null,
          resolvedBy: fb.resolvedBy?.name || null,
          adminResponse: fb.adminResponse || null,
          // Keep original data for API calls
          _original: fb,
        }));

        setFeedbacks(mappedFeedbacks);
        setTotalItems(response.pagination?.total || 0);
        setStats(response.stats || stats);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        toast.error(error.message || "Không thể tải danh sách phản hồi");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [activeTab, page, pageSize, typeFilter, statusFilter, searchQuery]);

  // Fetch review reports from API
  useEffect(() => {
    if (activeTab !== "review-reports") return;

    const fetchReviewReports = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: pageSize,
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(searchQuery && { search: searchQuery }),
        };

        const response = await reviewApi.getReviewReports(params);
        
        // Map API response to component format
        const mappedReports = response.reviews.map((review) => ({
          id: review._id,
          senderName: review.user?.name || "Người dùng",
          senderEmail: review.user?.email || "",
          senderPhone: "",
          senderRole: "customer",
          type: "review-report",
          subject: `Báo cáo đánh giá - ${review.facility?.name || "Sân"}`,
          content: review.comment || "",
          reportReason: review.report?.reason || "",
          reportNote: review.report?.adminNotes || "",
          relatedFacility: review.facility?.name || null,
          relatedBooking: review.booking?.bookingCode || null,
          rating: review.rating,
          status: review.report?.status || "pending",
          createdAt: review.report?.reportedAt || review.createdAt,
          createdTime: new Date(review.report?.reportedAt || review.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          resolvedAt: review.report?.processedAt || null,
          resolvedBy: review.report?.processedBy?.name || null,
          adminResponse: review.report?.adminNotes || null,
          reportedBy: review.report?.reportedBy?.name || "Owner",
          // Keep original data for API calls
          _original: review,
        }));

        setReviewReports(mappedReports);
        setTotalItems(response.pagination?.total || 0);
        setReviewReportStats(response.stats || reviewReportStats);
      } catch (error) {
        console.error("Error fetching review reports:", error);
        toast.error(error.message || "Không thể tải danh sách báo cáo đánh giá");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewReports();
  }, [activeTab, page, pageSize, statusFilter, searchQuery]);

  // Maps
  const typeMap = {
    complaint: {
      label: "Khiếu nại",
      color: "#ef4444",
      bg: "#fee2e2",
      icon: AlertCircle,
    },
    feedback: {
      label: "Góp ý",
      color: "#3b82f6",
      bg: "#dbeafe",
      icon: MessageSquare,
    },
    "review-report": {
      label: "Báo cáo đánh giá",
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: Flag,
    },
  };

  const statusMap = {
    pending: { label: "Đang xử lý", color: "#f59e0b", bg: "#fef3c7" },
    resolved: { label: "Đã phản hồi", color: "#10b981", bg: "#e6f9f0" },
    approved: { label: "Đã duyệt", color: "#10b981", bg: "#e6f9f0" },
    rejected: { label: "Đã từ chối", color: "#ef4444", bg: "#fee2e2" },
  };

  // Data slice for current page (already filtered by API)
  const dataSlice = activeTab === "feedback" ? feedbacks : reviewReports;

  // Handlers
  const handleViewDetail = (feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleResolve = (feedback) => {
    if (feedback.type === "review-report") {
      // Xử lý review report
      setSelectedFeedback(feedback);
      setIsReviewReportModalOpen(true);
    } else {
      // Xử lý feedback thông thường
      setSelectedFeedback(feedback);
      setResponseText(feedback.adminResponse || "");
      setIsResponseModalOpen(true);
    }
  };

  const handleProcessReviewReport = async (status, adminNotes) => {
    if (!selectedFeedback?._original?._id) {
      toast.error("Không tìm thấy báo cáo");
      return;
    }

    try {
      setLoading(true);
      await reviewApi.updateReportStatus(
        selectedFeedback._original._id,
        status,
        adminNotes
      );

      // Update local state
      setReviewReports((current) =>
        current.map((r) =>
          r.id === selectedFeedback.id
            ? {
                ...r,
                status: status,
                adminResponse: adminNotes || "",
                resolvedAt: new Date().toISOString(),
                resolvedBy: "Admin",
              }
            : r
        )
      );

      // Refresh stats
      const response = await reviewApi.getReviewReports({ page: 1, limit: 1 });
      setReviewReportStats(response.stats || reviewReportStats);

      toast.success(`Báo cáo đã được ${status === "approved" ? "duyệt" : "từ chối"}`);
      setIsReviewReportModalOpen(false);
      setSelectedFeedback(null);
    } catch (error) {
      console.error("Error processing review report:", error);
      toast.error(error.message || "Không thể xử lý báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!responseText.trim()) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }

    if (!selectedFeedback?._original?._id) {
      toast.error("Không tìm thấy phản hồi");
      return;
    }

    try {
      setLoading(true);
      const updated = await feedbackApi.resolveFeedback(
        selectedFeedback._original._id,
        responseText.trim()
      );

      // Update local state
      setFeedbacks((current) =>
        current.map((f) =>
          f.id === selectedFeedback.id
            ? {
                ...f,
                status: "resolved",
                adminResponse: updated.adminResponse,
                resolvedAt: updated.resolvedAt,
                resolvedBy: updated.resolvedBy?.name || "Admin",
                _original: updated,
              }
            : f
        )
      );

      // Refresh stats
      const response = await feedbackApi.getFeedbacks({ page: 1, limit: 1 });
      setStats(response.stats || stats);

      toast.success("Phản hồi đã được cập nhật");
      setIsResponseModalOpen(false);
      setSelectedFeedback(null);
      setResponseText("");
    } catch (error) {
      console.error("Error resolving feedback:", error);
      toast.error(error.message || "Không thể cập nhật phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResponseModal = () => {
    setIsResponseModalOpen(false);
    setSelectedFeedback(null);
    setResponseText("");
  };

  const handleDelete = (feedback) => {
    setSelectedFeedback(feedback);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFeedback?._original?._id) {
      toast.error("Không tìm thấy phản hồi");
      return;
    }

    try {
      setLoading(true);
      await feedbackApi.deleteFeedback(selectedFeedback._original._id);

      // Remove from local state
      setFeedbacks((current) =>
        current.filter((f) => f.id !== selectedFeedback.id)
      );
      setTotalItems((prev) => prev - 1);

      // Refresh stats
      const response = await feedbackApi.getFeedbacks({ page: 1, limit: 1 });
      setStats(response.stats || stats);

      toast.success("Xóa phản hồi thành công");
      setIsDeleteModalOpen(false);
      setSelectedFeedback(null);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error(error.message || "Không thể xóa phản hồi");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const formatDate = (date, time) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.toLocaleDateString("vi-VN")} ${time || ""}`;
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>
          Quản lý phản hồi / khiếu nại
        </h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <button
          onClick={() => handleTabChange("feedback")}
          style={{
            padding: "12px 24px",
            background: activeTab === "feedback" ? "#3b82f6" : "transparent",
            color: activeTab === "feedback" ? "#fff" : "#6b7280",
            border: "none",
            borderBottom: activeTab === "feedback" ? "2px solid #3b82f6" : "2px solid transparent",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: -2,
          }}
        >
          <MessageSquare size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          Phản hồi / Khiếu nại
        </button>
        <button
          onClick={() => handleTabChange("review-reports")}
          style={{
            padding: "12px 24px",
            background: activeTab === "review-reports" ? "#3b82f6" : "transparent",
            color: activeTab === "review-reports" ? "#fff" : "#6b7280",
            border: "none",
            borderBottom: activeTab === "review-reports" ? "2px solid #3b82f6" : "2px solid transparent",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: -2,
          }}
        >
          <Flag size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
          Báo cáo đánh giá
        </button>
      </div>

      <FeedbackStats 
        stats={activeTab === "feedback" ? stats : {
          total: reviewReportStats.total,
          pending: reviewReportStats.pending,
          resolved: reviewReportStats.approved + reviewReportStats.rejected,
          complaints: 0,
          suggestions: 0,
        }} 
      />

      <FeedbackFilters
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onTypeChange={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onReset={resetFilters}
      />

      {loading && dataSlice.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          Đang tải...
        </div>
      ) : (
        <FeedbackTable
          feedbacks={dataSlice}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          typeMap={typeMap}
          statusMap={statusMap}
          formatDate={formatDate}
          truncateText={truncateText}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={handleViewDetail}
          onResolve={handleResolve}
        />
      )}

      <FeedbackDetailModal
        isOpen={isDetailModalOpen}
        feedback={selectedFeedback}
        typeMap={typeMap}
        statusMap={statusMap}
        formatDate={formatDate}
        onClose={handleCloseDetailModal}
        onResolve={handleResolve}
      />

      <FeedbackResponseModal
        isOpen={isResponseModalOpen}
        feedback={selectedFeedback}
        responseText={responseText}
        onResponseChange={setResponseText}
        onSave={handleSaveResponse}
        onClose={handleCloseResponseModal}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedFeedback(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa phản hồi"
        message="Bạn có chắc muốn xóa phản hồi này"
        itemName={selectedFeedback?.subject}
      />

      {/* Review Report Processing Modal */}
      {isReviewReportModalOpen && selectedFeedback && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsReviewReportModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Xử lý báo cáo đánh giá
            </h3>
            <div style={{ marginBottom: 16 }}>
              <strong>Người đánh giá:</strong> {selectedFeedback.senderName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Đánh giá:</strong> {selectedFeedback.content}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Lý do báo cáo:</strong> {selectedFeedback.reportReason}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 100,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
                placeholder="Nhập ghi chú..."
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setIsReviewReportModalOpen(false);
                  setSelectedFeedback(null);
                  setResponseText("");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleProcessReviewReport("rejected", responseText)}
                style={{
                  padding: "10px 20px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Từ chối
              </button>
              <button
                onClick={() => handleProcessReviewReport("approved", responseText)}
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedbacks;

