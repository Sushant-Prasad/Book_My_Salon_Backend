import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../utils/firebase'
import googleLogo from '../assets/google.png'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/api/auth'
import { setTokenToLocalstorage } from '../utils/features'
import { useSignupMutation } from '../redux/api/api'

const Signup = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [barberCodeError, setBarberCodeError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    gender: '',
    dateOfBirth: '',
    mobileNumber: ''
  })
  const [formData, setFormData] = useState({
    role: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    otp: '',
    barberCode: ''
  })
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // RTK Query hook
  const [signupUser] = useSignupMutation()

  const dispatch = useDispatch();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field errors when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
    
    // Clear barber code error when user starts typing
    if (field === 'barberCode') {
      setBarberCodeError('')
    }
  }

  const handleRoleSelection = (role) => {
    handleInputChange('role', role)
    setCurrentStep(2)
  }

  const handlePersonalDetailsSubmit = () => {
    // Reset all errors
    setFieldErrors({
      gender: '',
      dateOfBirth: '',
      mobileNumber: ''
    })
    setBarberCodeError('')
    
    let hasErrors = false
    const newErrors = {}
    
    // Validate required fields
    if (!formData.gender) {
      newErrors.gender = 'This field is required'
      hasErrors = true
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'This field is required'
      hasErrors = true
    }
    
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'This field is required'
      hasErrors = true
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number'
      hasErrors = true
    }
    
    // Additional validation for barbers
    if (formData.role === 'barber') {
      if (!formData.barberCode) {
        setBarberCodeError('This field is required')
        hasErrors = true
      } else {
        // Verify barber code against environment variable
        const correctBarberCode = import.meta.env.VITE_BARBER_SECRET_CODE
        if (formData.barberCode !== correctBarberCode) {
          setBarberCodeError('Invalid barber verification code. Please contact admin for the correct code.')
          hasErrors = true
        }
      }
    }
    
    // Set field errors
    setFieldErrors(newErrors)
    
    // Only proceed if no errors
    if (!hasErrors) {
      setCurrentStep(3)
    }
  }

  const handleSendOTP = async () => {
    if (formData.mobileNumber.length === 10) {
      setSendingOtp(true) // Disable button
      try {
        // Setup reCAPTCHA verifier
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible', // Use 'invisible' for production
            'callback': (response) => {
              // console.log('reCAPTCHA solved')
            },
            'expired-callback': () => {
              // console.log('reCAPTCHA expired')
            }
          })
        }

        const phoneNumber = `+91${formData.mobileNumber}`
        const appVerifier = window.recaptchaVerifier
        
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        
        // Store confirmation result for verification
        window.confirmationResult = confirmationResult
        
        setOtpSent(true)
        // console.log('OTP sent successfully via Firebase')
        
      } catch (error) {
        console.error('Error sending OTP:', error)
        alert('Error sending OTP: ' + error.message)
        
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear()
          window.recaptchaVerifier = null
        }
      } finally {
        setSendingOtp(false) // Re-enable button after success or error
      }
    } else {
      alert('Please enter a valid 10-digit mobile number')
    }
  }

  const handleVerifyOTP = async () => {
    if (formData.otp.length === 6) {
      setVerifyingOtp(true)
      try {
        const confirmationResult = window.confirmationResult
        
        if (!confirmationResult) {
          alert('Please send OTP first')
          return
        }
        
        const result = await confirmationResult.confirm(formData.otp)
        
        setCurrentStep(4)
        
      } catch (error) {
        console.error('Error verifying OTP:', error)
        alert('Invalid OTP. Please check and try again.')
      }
      finally {
        setVerifyingOtp(false)
      }
    } else {
      alert('Please enter a valid 6-digit OTP')
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      const user = result.user
      

      const userData = {
        name: user.displayName,
        email: user.email,
        profileUrl: user.photoURL,
        role: formData.role,
        gender: formData.gender,
        phone: formData.mobileNumber,
        DOB: formData.dateOfBirth
      }
      
      try {
            const data = await signupUser(userData).unwrap();
            dispatch(setUser(data?.user))
            setTokenToLocalstorage(data?.token)
        } catch (error) {
            console.error('Signup error:', error)
        } finally {
            // setIsLoading(false);
            
        }
      navigate('/')
      
    } catch (error) {
      console.error('Signup error:', error)
      
      
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= step
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-12 h-1 mx-2 ${
                currentStep > step ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Role</h2>
        <p className="text-gray-600">How do you plan to use our platform?</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => handleRoleSelection('customer')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
        >
          <div className="text-center">
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600">Customer</h3>
            <p className="text-sm text-gray-600">Book appointments and manage your visits</p>
          </div>
        </button>
        
        <button
          onClick={() => handleRoleSelection('barber')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
        >
          <div className="text-center">
            <div className="text-4xl mb-3">✂️</div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600">Barber/Beautician</h3>
            <p className="text-sm text-gray-600">Manage your schedule and serve customers</p>
          </div>
        </button>
      </div>
    </div>
  )

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Personal Details</h2>
        <p className="text-gray-600">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-4">
        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {['Male', 'Female', 'Other'].map((gender) => (
              <button
                key={gender}
                onClick={() => handleInputChange('gender', gender)}
                className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.gender === gender
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : fieldErrors.gender
                    ? 'border-red-500 hover:border-red-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
          {fieldErrors.gender && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.gender}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={`w-full bg-[#dfdfdf] cursor-pointer px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
              fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
            max={new Date().toISOString().split('T')[0]}
          />
          {fieldErrors.dateOfBirth && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.dateOfBirth}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              +91
            </span>
            <input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit mobile number"
              className={`flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                fieldErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {fieldErrors.mobileNumber && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.mobileNumber}</p>
          )}
        </div>

        {/* Barber Code Field - Only show for barbers */}
        {formData.role === 'barber' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barber Verification Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.barberCode}
              onChange={(e) => handleInputChange('barberCode', e.target.value)}
              placeholder="Enter barber verification code"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                barberCodeError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {barberCodeError && (
              <p className="text-xs text-red-500 mt-1">{barberCodeError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This is a secret code provided by the admin to verify barber registration
            </p>
          </div>
        )}

        <button
          onClick={handlePersonalDetailsSubmit}
          className="w-full bg-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-purple-600 transition-all duration-200"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderOTPVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Mobile Number</h2>
        <p className="text-gray-600">We'll send an OTP to +91 {formData.mobileNumber}</p>
      </div>

      <div className="space-y-4">
        {!otpSent ? (
          <button
            onClick={handleSendOTP}
            disabled={sendingOtp}
            className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
              sendingOtp 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
          </button>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={handleVerifyOTP}
              disabled={formData.otp.length !== 6 || verifyingOtp}
              className={`w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              onClick={handleSendOTP}
              disabled={sendingOtp}
              className={`w-full font-medium py-2 transition-colors ${
                sendingOtp 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-purple-600 hover:text-purple-800'
              }`}
            >
              {sendingOtp ? 'Sending...' : 'Resend OTP'}
            </button>
          </>
        )}
      </div>
    </div>
  )

  const renderFinalSignup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Signup</h2>
        <p className="text-gray-600">Review your details and create your account</p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Role:</span>
          <span className="font-medium capitalize">{formData.role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Gender:</span>
          <span className="font-medium">{formData.gender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date of Birth:</span>
          <span className="font-medium">{formData.dateOfBirth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Mobile:</span>
          <span className="font-medium">+91 {formData.mobileNumber}</span>
        </div>
        {formData.role === 'barber' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Barber Code:</span>
            <span className="font-medium text-green-600">✓ Verified</span>
          </div>
        )}
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-purple-500 hover:bg-purple-50 text-purple-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <img src={googleLogo} alt="Google" loading="lazy" className="w-5 h-5" />
        {loading ? 'Creating Account...' : 'Complete Signup with Google'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content based on current step */}
        {currentStep === 1 && renderRoleSelection()}
        {currentStep === 2 && renderPersonalDetails()}
        {currentStep === 3 && renderOTPVerification()}
        {currentStep === 4 && renderFinalSignup()}

        {/* Hidden reCAPTCHA container for Firebase phone auth */}
        <div id="recaptcha-container"></div>

        {/* Back Button */}
        {currentStep > 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Login Link */}
        <div className="text-center pt-6 border-t border-gray-200 mt-6">
          <p className="text-gray-600 mb-2">Already have an account?</p>
          <Link
            to="/login"
            className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-4">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Signup