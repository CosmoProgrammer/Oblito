'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export function ProductReviews() {
  // Static mock reviews (pre-existing)
  const [reviews] = useState([
    {
      id: 1,
      name: 'John Doe',
      rating: 4.7,
      date: '2025-10-09',
      comment: 'Absolutely love this product! Great quality and fast delivery.',
    },
    {
      id: 2,
      name: 'Sarah Lee',
      rating: 3.4,
      date: '2025-10-08',
      comment: 'Good product overall, but packaging could be improved.',
    },
  ]);

  // State for add-review form visibility and input
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 0 });

  // Format date consistently (SSR-safe)
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(dateString)
    );

  // Renders filled/unfilled stars dynamically
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
        <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>
        <Button
        variant="default"
        className="text-sm"
        onClick={() => {
        if (showForm) {
          // Reset form when closing
          setNewReview({ name: '', comment: '', rating: 0 });
        }
        setShowForm((prev) => !prev);
        }}
        >
        {showForm ? 'Cancel' : 'Add Review'}
        </Button>
      </div>

      {/* Review Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 bg-white"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {review.name}
                </CardTitle>
                {renderStars(review.rating)}
              </div>
              <CardDescription className="text-xs text-gray-500 mt-1">
                {formatDate(review.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Review Form (Inline Card) */}
      {showForm && (
        <Card className="rounded-2xl border border-gray-300 shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your Name"
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
            />

            <div>
              <p className="text-sm text-gray-600 mb-1">Your Rating:</p>
              {renderStars(newReview.rating, (val) => setNewReview({ ...newReview, rating: val }))}
            </div>

            <Textarea
              placeholder="Write your review here..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              rows={4}
            />

            <Button variant="secondary" className="mt-2 bg-yellow-500">
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}



