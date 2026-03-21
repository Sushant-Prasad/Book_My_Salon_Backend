// Backend API Example (Node.js with Twilio)
const twilio = require('twilio')

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body
    const otp = Math.floor(100000 + Math.random() * 900000) // 6-digit OTP
    
    // Store OTP in database/cache with expiry
    await storeOTP(phoneNumber, otp, 5) // 5 minutes expiry
    
    // Send SMS
    await client.messages.create({
      body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
      from: '+1234567890', // Your Twilio number
      to: `+91${phoneNumber}`
    })
    
    res.json({ success: true, message: 'OTP sent successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify OTP endpoint
app.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body
    
    const storedOTP = await getStoredOTP(phoneNumber)
    
    if (storedOTP && storedOTP === otp) {
      await deleteOTP(phoneNumber) // Remove used OTP
      res.json({ success: true, message: 'OTP verified' })
    } else {
      res.status(400).json({ error: 'Invalid or expired OTP' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Frontend API calls
const sendOTP = async () => {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: formData.mobileNumber })
    })
    
    if (response.ok) {
      setOtpSent(true)
    } else {
      const error = await response.json()
      alert('Error: ' + error.message)
    }
  } catch (error) {
    alert('Network error: ' + error.message)
  }
}

const verifyOTP = async () => {
  try {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: formData.mobileNumber,
        otp: formData.otp 
      })
    })
    
    if (response.ok) {
      setCurrentStep(4) // Move to final step
    } else {
      const error = await response.json()
      alert('Error: ' + error.message)
    }
  } catch (error) {
    alert('Network error: ' + error.message)
  }
}