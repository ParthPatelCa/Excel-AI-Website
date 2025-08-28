import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Star, MessageSquare, Bug, Lightbulb, Send, X } from 'lucide-react'
import apiService from '@/services/api'

const FeedbackWidget = ({ feature = null, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const feedbackTypes = [
    { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-600' },
    { value: 'bug_report', label: 'Bug Report', icon: Bug, color: 'text-red-600' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-green-600' },
    { value: 'rating', label: 'Rate Experience', icon: Star, color: 'text-yellow-600' }
  ]

  const handleSubmit = async () => {
    if (!feedbackType || (!message && feedbackType !== 'rating') || (feedbackType === 'rating' && !rating)) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        feedback_type: feedbackType,
        message: message || `${rating}-star rating`,
        rating: feedbackType === 'rating' ? rating : null,
        feature_used: feature,
        page_url: window.location.pathname,
        metadata: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      }

      await apiService.submitFeedback(payload)
      setSubmitted(true)
      
      // Track analytics
      apiService.trackEvent('feedback_submitted', {
        feedback_type: feedbackType,
        feature_used: feature
      })

      setTimeout(() => {
        setIsOpen(false)
        resetForm()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFeedbackType('')
    setMessage('')
    setRating(0)
    setSubmitted(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
  }

  const FeedbackContent = () => (
    <div className="space-y-6">
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
          <p className="text-gray-600">Your feedback helps us improve DataSense AI.</p>
        </div>
      ) : (
        <>
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback do you have?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    feedbackType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-5 h-5 ${type.color} mx-auto mb-2`} />
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating (for rating feedback) */}
          {feedbackType === 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate your experience?
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {rating === 5 && "Excellent! 🎉"}
                  {rating === 4 && "Great! 👍"}
                  {rating === 3 && "Good 👌"}
                  {rating === 2 && "Could be better 🤔"}
                  {rating === 1 && "Needs improvement 😕"}
                </p>
              )}
            </div>
          )}

          {/* Message (required for non-rating feedback) */}
          {feedbackType && feedbackType !== 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us more
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  feedbackType === 'feature_request'
                    ? "What feature would you like to see?"
                    : feedbackType === 'bug_report'
                    ? "Please describe the issue you encountered..."
                    : "Share your thoughts about DataSense AI..."
                }
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {/* Optional message for ratings */}
          {feedbackType === 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any additional comments? (optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you liked or what could be improved..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Context Info */}
          {feature && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Feature:</strong> {feature}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              !feedbackType ||
              (!message && feedbackType !== 'rating') ||
              (feedbackType === 'rating' && !rating) ||
              isSubmitting
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )

  if (inline) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Share Feedback
          </CardTitle>
          <CardDescription>
            Help us improve your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackContent />
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg">
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Share Your Feedback
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us build a better DataSense AI experience
          </DialogDescription>
        </DialogHeader>
        <FeedbackContent />
      </DialogContent>
    </Dialog>
  )
}

// Quick Rating Component
export const QuickRating = ({ feature, onComplete }) => {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const handleRatingSubmit = async (selectedRating) => {
    try {
      await apiService.submitQuickRating({
        rating: selectedRating,
        feature_used: feature
      })
      setRating(selectedRating)
      setSubmitted(true)
      onComplete?.(selectedRating)
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-green-600">Thank you for rating! ⭐</p>
      </div>
    )
  }

  return (
    <div className="text-center py-2">
      <p className="text-sm text-gray-600 mb-2">How was your experience?</p>
      <div className="flex justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingSubmit(star)}
            className="transition-transform hover:scale-110"
          >
            <Star className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default FeedbackWidget
