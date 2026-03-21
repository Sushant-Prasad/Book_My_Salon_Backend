import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiEdit2, FiSearch, FiTrash2 } from 'react-icons/fi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import toast from 'react-hot-toast';
import axios from 'axios';
import { server } from '../constants/config';
import { getTokenFromStorage } from '../utils/features';
import '../pages/loader.css'

const CustomerReviews = ({ availableBarbers = [], user,  }) => {
  const [selectedBarber, setSelectedBarber] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [userReviewsLoading, setUserReviewsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal filters
  const [modalBarberFilter, setModalBarberFilter] = useState('all');
  const [modalStarFilter, setModalStarFilter] = useState('all');
  const [modalPage, setModalPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    barberId: '',
    rating: 0,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Refs
  const scrollContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch reviews on component mount and when selectedBarber changes
  useEffect(() => {
    fetchReviews();
  }, [selectedBarber]);

  // Fetch user's own reviews
  useEffect(() => {
    if (user) {
      fetchUserReviews();
    }
  }, [user]);

  // Debounced search effect for modal
  useEffect(() => {
    if (showAllReviewsModal) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        setModalPage(1);
        setReviews([]);
        fetchModalReviews(1, true);
      }, 500);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [searchQuery, modalBarberFilter, modalStarFilter, showAllReviewsModal]);

  // Scroll listener for infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !showAllReviewsModal) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is 100px from bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && !modalLoading && hasMoreReviews) {
        setModalPage(prev => prev + 1);
        fetchModalReviews(modalPage + 1, false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [showAllReviewsModal, modalLoading, hasMoreReviews, modalPage]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = selectedBarber === 'all' 
        ? `${server}/api/v1/review/reviews?limit=10`
        : `${server}/api/v1/review/barber/${selectedBarber}?limit=10`;
      
      const { data } = await axios.get(url);
      setReviews(data.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModalReviews = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setModalLoading(true);
      }

      let url = `${server}/api/v1/review/reviews?page=${page}&limit=10`;
      
      if (searchQuery) {
        url += `&searchWord=${encodeURIComponent(searchQuery)}`;
      }
      
      if (modalBarberFilter !== 'all') {
        url += `&barberId=${modalBarberFilter}`;
      }
      
      if (modalStarFilter !== 'all') {
        url += `&rating=${modalStarFilter}`;
      }

      const { data } = await axios.get(url);
      const newReviews = data.data || [];
      
      if (reset) {
        setReviews(newReviews);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }
      
      setHasMoreReviews(newReviews.length === 10);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setModalLoading(false);
    }
  };

  const openAllReviewsModal = () => {
    setSearchQuery('');
    setModalBarberFilter('all');
    setModalStarFilter('all');
    setModalPage(1);
    setReviews([]);
    setHasMoreReviews(true);
    setShowAllReviewsModal(true);
    fetchModalReviews(1, true);
  };

  const fetchUserReviews = async () => {
    try {
      setUserReviewsLoading(true);
      const { data } = await axios.get(`${server}/api/v1/review/my-review`, {
        headers: {
          'Authorization': `Bearer ${getTokenFromStorage()}`
        },
        withCredentials: true
      });
      setUserReviews(data.data || []);
    } catch (error) {
      console.error('Failed to fetch your reviews:', error);
    } finally {
      setUserReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await axios.delete(`${server}/api/v1/review/delete/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${getTokenFromStorage()}`
        },
        withCredentials: true
      });
      toast.success('Review deleted successfully!');
      fetchUserReviews();
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!reviewForm.barberId) {
      toast.error('Please select a barber');
      return;
    }

    if (reviewForm.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${server}/api/v1/review/create`, reviewForm, {
        headers: {
          'Authorization': `Bearer ${getTokenFromStorage()}`
        },
        withCredentials: true
      });
      
      toast.success('Review submitted successfully!');
      setShowModal(false);
      setReviewForm({ barberId: '', rating: 0, comment: '' });
      fetchReviews();
      fetchUserReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRate, interactive = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            {star <= rating ? (
              <AiFillStar className="text-orange-500 text-xl" />
            ) : (
              <AiOutlineStar className="text-orange-300 text-xl" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Customer <span className="text-gray-500">Reviews</span>
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer"
          title="Write a review"
        >
          <FiEdit2 size={20} />
        </button>
      </div>

      {/* Your Reviews Section */}
      {user && (
        <div className="mb-4 bg-transparent rounded-lg ">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Your Reviews</h3>
          {userReviewsLoading ? (
            <div className="text-center py-4 text-gray-500">Loading your reviews...</div>
          ) : userReviews.length === 0 ? (
            <div className="text-center py-4 text-gray-500">You haven't written any reviews yet</div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <div className="flex gap-4 min-w-max">
                {userReviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-purple-200 w-80 flex-shrink-0"
                  >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {review.barber && (
                        <div className="text-sm text-purple-600 font-medium mb-1">
                          Review for: {review.barber.name}
                        </div>
                      )}
                      <StarRating rating={review.rating} />
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt || review.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-red-500 hover:text-red-700 transition-colors px-3 py-1 border border-red-500 rounded-lg hover:bg-red-50"
                      title="Delete review"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barber Filter - Horizontal Scroll */}
      <div className="mb-2 overflow-x-auto custom-scrollbar pb-2">
        <div className="flex gap-3 min-w-max">
          <button
            onClick={() => setSelectedBarber('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedBarber === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Barbers
          </button>
          {availableBarbers.map((barber) => (
            <button
              key={barber._id}
              onClick={() => setSelectedBarber(barber._id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedBarber === barber._id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {barber.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews - Horizontal Scroll */}
      <div className="relative">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No reviews yet</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="flex gap-4 min-w-max">
              {reviews.slice(0, 3).map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 w-80 flex-shrink-0"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={review.user?.profileUrl || '/default-avatar.png'}
                      alt={review.user?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(review.createdAt || review.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  {review.barber && (
                    <div className="mb-2 text-sm text-purple-600 font-medium">
                      For: {review.barber.name}
                    </div>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-3">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Button */}
        {reviews.length > 0 && (
          <div className="text-right mt-2">
            <button
              onClick={openAllReviewsModal}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm cursor-pointer"
            >
              More...
            </button>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#00000030] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>

            {/* Barber Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Barber
              </label>
              <select
                value={reviewForm.barberId}
                onChange={(e) => setReviewForm({ ...reviewForm, barberId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select Barber --</option>
                {availableBarbers.map((barber) => (
                  <option key={barber._id} value={barber._id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <StarRating
                rating={reviewForm.rating}
                onRate={(rating) => setReviewForm({ ...reviewForm, rating })}
                interactive
              />
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setReviewForm({ barberId: '', rating: 0, comment: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div className="fixed inset-0 bg-[#00000030] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">All Reviews</h3>
              <button
                onClick={() => setShowAllReviewsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              {/* Barber Filter */}
              <select
                value={modalBarberFilter}
                onChange={(e) => setModalBarberFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Barbers</option>
                {availableBarbers.map((barber) => (
                  <option key={barber._id} value={barber._id}>
                    {barber.name}
                  </option>
                ))}
              </select>

              {/* Star Filter */}
              <select
                value={modalStarFilter}
                onChange={(e) => setModalStarFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Reviews Grid with Scroll */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={review.user?.profileUrl || '/default-avatar.png'}
                        alt={review.user?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {review.user?.name || 'Anonymous'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt || review.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    {review.barber && (
                      <div className="mb-2 text-sm text-purple-600 font-medium">
                        For: {review.barber.name}
                      </div>
                    )}
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>

              {modalLoading && (
                <div className="text-center py-4 text-gray-500">
                  Loading more reviews...
                </div>
              )}

              {reviews.length === 0 && !modalLoading && (
                <div className="text-center py-8 text-gray-500">No reviews found</div>
              )}

              {!hasMoreReviews && reviews.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No more reviews to load
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReviews;
