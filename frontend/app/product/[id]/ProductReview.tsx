'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Trash2 } from 'lucide-react';

type Review = {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
};

interface ProductReviewsProps {
  productId: string;
  productName: string;
  productRating?: number;
}

const API_BASE_URL = "http://localhost:8000";

export function ProductReviews({ productId, productName, productRating = 0 }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newReview, setNewReview] = useState({ comment: '', rating: 0 });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Fetch reviews for this product
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`📥 Fetching reviews for product ${productId}`);
      const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("Reviews response status:", res.status);
      const data = await res.json();
      console.log("Reviews response data:", data);

      if (res.ok) {
        // Backend returns array directly
        const reviewsList = Array.isArray(data) ? data : [];
        setReviews(reviewsList);
        console.log(`✅ Loaded ${reviewsList.length} reviews`);
      } else {
        const errorMsg = data.message || "Failed to load reviews";
        setError(errorMsg);
        console.error("Backend error:", data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  // Create new review
  const handleSubmitReview = async () => {
    if (!newReview.comment.trim() || newReview.rating === 0) {
      setError("Please fill all fields and select a rating");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("📤 Posting new review:", newReview);
      const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      console.log("Post review response status:", res.status);
      const data = await res.json();
      console.log("Post review response:", data);

      if (res.ok) {
        console.log("✅ Review posted successfully");
        setNewReview({ comment: '', rating: 0 });
        setShowForm(false);
        setError(null);
        await fetchReviews(); // Refresh list
      } else {
        const errorMsg = data.message || "Failed to post review";
        setError(errorMsg);
        console.error("Backend error:", data);
      }
    } catch (err: any) {
      console.error("Error posting review:", err);
      setError(err.message || "Error posting review");
    } finally {
      setLoading(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`🗑️ Deleting review ${reviewId}`);
      const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("Delete review response status:", res.status);
      const data = await res.json();
      console.log("Delete review response:", data);

      if (res.ok) {
        console.log("✅ Review deleted successfully");
        setReviews(reviews.filter(r => r.id !== reviewId));
        setError(null);
      } else {
        const errorMsg = data.message || "Failed to delete review";
        setError(errorMsg);
        console.error("Backend error:", data);
      }
    } catch (err: any) {
      console.error("Error deleting review:", err);
      setError(err.message || "Error deleting review");
    } finally {
      setLoading(false);
    }
  };

  // Format date consistently
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // Get reviewer name from customer object or fallback
  const getReviewerName = (review: Review) => {
    if (review.customer) {
      return `${review.customer.firstName} ${review.customer.lastName}`;
    }
    return "Anonymous";
  };

  // Render star rating
  const renderStars = (rating: number, setRating?: (n: number) => void) => {
    const rounded = Math.round(rating);
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      const filled = i <= rounded;
      stars.push(
        <Star
          key={i}
          onClick={() => setRating && setRating(i)}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
        />
      );
    }

    return <div className="flex gap-1">{stars}</div>;
  };

  return (
    <section className="mt-16 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>
          <p className="text-sm text-gray-600 mt-1">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} for {productName}
          </p>
        </div>
        <Button
          variant="default"
          className="text-sm"
          onClick={() => {
            if (showForm) {
              setNewReview({ comment: '', rating: 0 });
            }
            setShowForm((prev) => !prev);
          }}
        >
          {showForm ? 'Cancel' : 'Add Review'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Review Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Card
              key={review.id}
              className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 bg-white relative"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteReview(review.id)}
                className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <CardHeader>
                <div className="flex items-center justify-between pr-8">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {getReviewerName(review)}
                  </CardTitle>
                  {renderStars(review.rating)}
                </div>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  {formatDate(review.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No reviews yet. Be the first to review!
          </div>
        )}
      </div>

      {/* Add Review Form */}
      {showForm && (
        <Card className="rounded-2xl border border-gray-300 shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Rating:</p>
              {renderStars(newReview.rating, (val) => setNewReview({ ...newReview, rating: val }))}
            </div>

            <Textarea
              placeholder="Write your review here..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              rows={4}
              disabled={loading}
            />

            <Button 
              onClick={handleSubmitReview}
              disabled={loading}
              className="mt-2 bg-[#febd69] hover:bg-[#f5a623] text-black"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}



