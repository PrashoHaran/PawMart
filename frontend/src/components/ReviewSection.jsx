import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

const PAGE_SIZE = 10;
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function StarDisplay({ rating, size = 'h-4 w-4' }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(rating) ? 'fill-secondary text-secondary' : 'text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-2">Your rating</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHovered(n)}>
            <input
              type="radio"
              name="review-rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only peer"
            />
            <span className="sr-only">{`${n} star${n > 1 ? 's' : ''} – ${RATING_LABELS[n - 1]}`}</span>
            <Star
              className={`h-7 w-7 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-primary transition-colors ${
                n <= shown ? 'fill-secondary text-secondary' : 'text-gray-300'
              }`}
              aria-hidden="true"
            />
          </label>
        ))}
        <span className="ml-2 text-sm text-gray-500" aria-hidden="true">
          {shown ? RATING_LABELS[shown - 1] : 'Select a rating'}
        </span>
      </div>
    </fieldset>
  );
}

function ReviewForm({ productId, token, onCreated }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await apiRequest(`/products/${productId}/reviews`, {
        method: 'POST',
        token,
        body: { rating, comment },
      });
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
      <h3 className="font-heading font-semibold text-gray-900">Write a review</h3>
      <StarPicker value={rating} onChange={setRating} />
      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your review <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          className="input-field min-h-[100px]"
          maxLength={1000}
          placeholder="What did you and your pet think?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

export default function ReviewSection({ productId, rating, reviewCount, onReviewsChanged }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  const loadPage = useCallback(
    (pageToLoad, signal) => {
      setLoading(true);
      setError(null);
      return apiRequest(`/products/${productId}/reviews?page=${pageToLoad}&limit=${PAGE_SIZE}`, { signal })
        .then(({ data, meta }) => {
          setReviews((prev) => (pageToLoad === 1 ? data : [...prev, ...data]));
          setTotal(meta.total);
          setPage(pageToLoad);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setError(err);
        })
        .finally(() => setLoading(false));
    },
    [productId]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadPage(1, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  const loadEligibility = useCallback(
    (signal) => {
      if (!token) {
        setEligibility(null);
        return;
      }
      apiRequest(`/products/${productId}/reviews/eligibility`, { token, signal })
        .then(({ data }) => setEligibility(data))
        .catch(() => setEligibility(null));
    },
    [productId, token]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadEligibility(controller.signal);
    return () => controller.abort();
  }, [loadEligibility]);

  const handleCreated = () => {
    loadPage(1);
    loadEligibility();
    onReviewsChanged();
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE', token });
      loadPage(1);
      loadEligibility();
      onReviewsChanged();
    } catch (err) {
      window.alert(`Couldn't delete review: ${err.message}`);
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Customer Reviews
          </h2>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-3">
              <StarDisplay rating={rating} size="h-5 w-5" />
              <span className="font-semibold text-gray-900">{rating.toFixed(1)} out of 5</span>
              <span className="text-gray-500 text-sm">
                ({reviewCount} review{reviewCount === 1 ? '' : 's'})
              </span>
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        {!user ? (
          <p className="text-sm text-gray-600">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>{' '}
            to review this product.
          </p>
        ) : eligibility?.canReview ? (
          <ReviewForm productId={productId} token={token} onCreated={handleCreated} />
        ) : eligibility?.reason ? (
          <p className="text-sm text-gray-500">{eligibility.reason}.</p>
        ) : null}
      </div>

      {error && (
        <div className="alert alert-warning mb-6" role="alert">
          <p className="text-sm text-orange-700">Couldn&apos;t load reviews: {error.message}</p>
        </div>
      )}

      <ul className="divide-y divide-gray-100">
        {reviews.map((review) => {
          const canDelete = user && (review.userId === user._id || user.role === 'admin');
          return (
            <li key={review._id} className="py-6 first:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">{review.userName}</span>
                    <span className="badge badge-success">Verified purchase</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <StarDisplay rating={review.rating} />
                    <time dateTime={review.createdAt} className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(review._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg"
                    aria-label={`Delete review by ${review.userName}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              {review.comment && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{review.comment}</p>}
            </li>
          );
        })}
      </ul>

      {loading && <p className="text-center text-gray-500 py-4">Loading reviews...</p>}

      {!loading && reviews.length < total && (
        <div className="text-center mt-4">
          <button type="button" onClick={() => loadPage(page + 1)} className="btn-outline">
            Show more reviews
          </button>
        </div>
      )}
    </section>
  );
}
