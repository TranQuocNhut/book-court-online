import React, { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { courtReviewsData } from "../data/mockData";
import ReviewStats from "./CourtReviews/ReviewStats";
import ReviewFilters from "./CourtReviews/ReviewFilters";
import ReviewTable from "./CourtReviews/ReviewTable";

const CourtReviews = () => {
  const [reviews, setReviews] = useState(courtReviewsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Lấy danh sách cơ sở duy nhất
  const uniqueFacilities = useMemo(() => {
    return [...new Set(reviews.map((r) => r.facility))].sort();
  }, [reviews]);

  // Tính toán thống kê
  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / total || 0;
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return { total, approved, pending, avgRating, ratingDistribution };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch = [r.facility, r.customer, r.comment]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;

      const matchesFacility =
        facilityFilter === "all" || r.facility === facilityFilter;

      const matchesRating =
        ratingFilter === "all" || r.rating === Number(ratingFilter);

      return matchesSearch && matchesStatus && matchesFacility && matchesRating;
    });
  }, [reviews, searchQuery, statusFilter, facilityFilter, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const reviewSlice = filteredReviews.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#fbbf24" : "#e5e7eb"}
        color={i < rating ? "#fbbf24" : "#e5e7eb"}
        style={{ marginRight: 2 }}
      />
    ));
  };

  const handleApprove = (review) => {
    setReviews((current) =>
      current.map((r) =>
        r.id === review.id ? { ...r, status: "approved" } : r
      )
    );
  };

  const handleReject = (review) => {
    if (
      window.confirm(
        `Bạn có chắc muốn từ chối đánh giá này? Đánh giá sẽ bị xóa khỏi hệ thống.`
      )
    ) {
      setReviews((current) => current.filter((r) => r.id !== review.id));
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setFacilityFilter("all");
    setRatingFilter("all");
    setSearchQuery("");
    setPage(1);
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
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Đánh giá cơ sở</h1>
      </div>

      <ReviewStats stats={stats} />

      <ReviewFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        facilityFilter={facilityFilter}
        ratingFilter={ratingFilter}
        uniqueFacilities={uniqueFacilities}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onFacilityChange={(value) => {
          setFacilityFilter(value);
          setPage(1);
        }}
        onRatingChange={(value) => {
          setRatingFilter(value);
          setPage(1);
        }}
        onReset={resetFilters}
      />

      <ReviewTable
        reviews={reviewSlice}
        page={page}
        pageSize={pageSize}
        totalItems={filteredReviews.length}
        renderStars={renderStars}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default CourtReviews;

