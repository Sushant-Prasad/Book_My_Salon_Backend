// Example Firebase Phone Auth Implementation
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../utils/firebase'

// In your Signup component, add these methods:

const setupRecaptcha = () => {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved
      console.log('reCAPTCHA verified')
    },
    'expired-callback': () => {
      // Response expired
      console.log('reCAPTCHA expired')
    }
  })
}

const sendOTPWithFirebase = async () => {
  try {
    setupRecaptcha()
    const phoneNumber = `+91${formData.mobileNumber}`
    const appVerifier = window.recaptchaVerifier
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    window.confirmationResult = confirmationResult
    
    setOtpSent(true)
    console.log('OTP sent successfully')
  } catch (error) {
    console.error('Error sending OTP:', error)
    alert('Error sending OTP: ' + error.message)
  }
}

const verifyOTPWithFirebase = async () => {
  try {
    const confirmationResult = window.confirmationResult
    const result = await confirmationResult.confirm(formData.otp)
    
    console.log('Phone number verified:', result.user)
    setCurrentStep(4) // Move to final step
  } catch (error) {
    console.error('Error verifying OTP:', error)
    alert('Invalid OTP. Please try again.')
  }
}

// In your JSX, add recaptcha container:
// <div id="recaptcha-container"></div>