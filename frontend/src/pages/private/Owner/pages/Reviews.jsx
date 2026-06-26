import React, { useState, useMemo, useEffect } from "react";
import { reviewApi } from "../../../../api/reviewApi";
import { facilityApi } from "../../../../api/facilityApi";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "react-toastify";
import ReplyReviewModal from "../modals/ReplyReviewModal";
import ReportReviewModal from "../modals/ReportReviewModal";
import ReviewStats from "../components/Reviews/ReviewStats";
import ReviewFilters from "../components/Reviews/ReviewFilters";
import ReviewList from "../components/Reviews/ReviewList";

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [replyingReview, setReplyingReview] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch owner's facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user?._id) return; // Wait for user to be loaded
      
      try {
        const result = await facilityApi.getFacilities({ ownerId: user._id });
        if (result.success && result.data?.facilities) {
          setFacilities(result.data.facilities);
        }
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };
    fetchFacilities();
  }, [user]);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      if (facilities.length === 0) {
        setReviews([]);
        return;
      }

      try {
        setLoading(true);
        const allReviews = [];

        // If "all" selected, fetch reviews from all facilities
        const facilitiesToFetch = selectedFacilityId === "all" 
          ? facilities 
          : facilities.filter(f => f._id === selectedFacilityId || f.id === selectedFacilityId);

        for (const facility of facilitiesToFetch) {
          try {
            const facilityId = facility._id || facility.id;
            const result = await reviewApi.getFacilityReviews(facilityId, {
              page: 1,
              limit: 100, // Get all reviews for now
            });

            if (result.reviews) {
              // Transform API reviews to component format
              const transformedReviews = result.reviews.map(review => ({
                id: review._id || review.id,
                customer: review.user?.name || "Người dùng",
                court: review.court?.name || facility.name || "Sân",
                bookingId: review.booking?.bookingCode || review.booking?._id || "",
                rating: review.rating,
                comment: review.comment || "",
                date: review.createdAt || review.date,
                status: review.report?.status === "pending" ? "reported" : 
                        review.report?.status === "approved" ? "reported" : 
                        review.isDeleted ? "deleted" : "approved",
                isOwnerReplied: !!review.ownerReply?.reply,
                ownerReply: review.ownerReply?.reply || "",
                replyDate: review.ownerReply?.repliedAt || "",
                report: review.report ? {
                  reason: review.report.reason || "",
                  note: review.report.adminNotes || "",
                  date: review.report.reportedAt || "",
                } : null,
                facilityId: facilityId,
                _original: review, // Store original review data for API calls
              }));

              allReviews.push(...transformedReviews);
            }
          } catch (error) {
            console.error(`Error fetching reviews for facility ${facility._id}:`, error);
          }
        }

        // Sort by date (newest first)
        allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        setReviews(allReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        toast.error("Không thể tải đánh giá");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [facilities, selectedFacilityId, refreshKey]);

  // Combine status filter with search
  const finalSearchQuery = useMemo(() => {
    if (statusFilter !== "all") {
      return statusFilter;
    }
    return searchQuery;
  }, [searchQuery, statusFilter]);

  const filteredReviews = useMemo(
    () =>
      reviews.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) {
          return false;
        }
        if (statusFilter === "all" && searchQuery) {
          return [r.customer, r.court, r.comment, r.status].join(" ").toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      }),
    [searchQuery, statusFilter, reviews]
  );

  const reviewSlice = filteredReviews.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quản lý đánh giá và phản hồi</h1>
      </div>

      <ReviewStats reviews={reviews} />

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          marginBottom: 16,
        }}
      >
        <ReviewFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          totalCount={filteredReviews.length}
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={(facilityId) => {
            setSelectedFacilityId(facilityId);
            setPage(1);
          }}
          loading={loading}
        />
      </div>

      <ReviewList
        reviews={reviewSlice}
        page={page}
        pageSize={pageSize}
        total={filteredReviews.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onReply={(review) => {
          setReplyingReview(review);
          setIsReplyOpen(true);
        }}
        onReport={(review) => {
          setReplyingReview(review);
          setIsReportOpen(true);
        }}
        loading={loading}
      />

      <ReplyReviewModal
        isOpen={isReplyOpen}
        onClose={() => {
          setIsReplyOpen(false);
          setReplyingReview(null);
        }}
        review={replyingReview}
        onSubmit={async (replyText) => {
          try {
            const reviewId = replyingReview._original?._id || replyingReview._original?.id || replyingReview.id;
            await reviewApi.replyToReview(reviewId, replyText);
            toast.success("Phản hồi thành công!");
            setRefreshKey(prev => prev + 1); // Refresh reviews
            setIsReplyOpen(false);
            setReplyingReview(null);
          } catch (error) {
            console.error("Error replying to review:", error);
            toast.error(error.message || "Không thể gửi phản hồi");
          }
        }}
      />

      <ReportReviewModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setReplyingReview(null);
        }}
        review={replyingReview}
        onSubmit={async ({ reason, note }) => {
          try {
            const reviewId = replyingReview._original?._id || replyingReview._original?.id || replyingReview.id;
            await reviewApi.reportReview(reviewId, note || reason);
            toast.success("Báo cáo đã được gửi!");
            setRefreshKey(prev => prev + 1); // Refresh reviews
            setIsReportOpen(false);
            setReplyingReview(null);
          } catch (error) {
            console.error("Error reporting review:", error);
            toast.error(error.message || "Không thể gửi báo cáo");
          }
        }}
      />
    </div>
  );
};

export default Reviews;
