import toast from 'react-hot-toast';
import jsPDF from 'jspdf'
import Logo from '../assets/Logo.png'

const setTokenToLocalstorage = (token) => {
  const expirationTime = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds

  const now = new Date();
  const expirationDate = new Date(now.getTime() + expirationTime);

  const tokenWithExpiration = {
    chatToken: token,
    expiresAt: expirationDate.getTime()
  };
  localStorage.setItem("customer-token", JSON.stringify(tokenWithExpiration));
}

const getTokenFromStorage = ()=>{
  const token = localStorage.getItem("customer-token");
  // console.log(token)
  if(token){
    const {chatToken, expiresAt} = JSON.parse(token);
    const now = new Date();
    if(now.getTime() > expiresAt){
      localStorage.removeItem("customer-token");
      return null;
    }
    // console.log(chatToken)
    return chatToken;
  }
  return null;
}

const expireLoginToken =()=>{
  localStorage.removeItem("customer-token");
}

const setBarberToken = (token) => {
  const expirationTime = 15 * 60 * 1000; // 15 days in milliseconds

  const now = new Date();
  const expirationDate = new Date(now.getTime() + expirationTime);

  const tokenWithExpiration = {
    chatAdminToken: token,
    expiresAt: expirationDate.getTime()
  };
  localStorage.setItem("barber-token", JSON.stringify(tokenWithExpiration));
}

const getBarberToken = ()=>{
  const token = localStorage.getItem("barber-token");
  // console.log(token)
  if(token){
    const {chatAdminToken, expiresAt} = JSON.parse(token);
    const now = new Date();
    if(now.getTime() > expiresAt){
      localStorage.removeItem("barber-token");
      return null;
    }
    // console.log(chatToken)
    return chatAdminToken;
  }
  return null;
}

const expireBarberToken =()=>{
  localStorage.removeItem("barber-token");
}

// Generate and download PDF receipt
  const generateReceipt = (booking, calculateTotalPrice, getFormattedDate, getTimeRange, getServicePrice, shop = 'Sathi Family Salon', shopLogoUrl = Logo) => {
    const pricing = calculateTotalPrice(booking);
    console.log("Generating receipt for booking:", booking);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Receipt paper size (80mm wide, increased height for multi-barber)
    });

    // Set font
    doc.setFont('courier', 'normal');
    
    let yPos = 10;
    const lineHeight = 4;
    const margin = 5;

    // Shop Logo and Name (side by side)
    if (shopLogoUrl) {
      try {
        const logoSize = 12;
        const logoX = 4; // Position logo on the left
        doc.addImage(shopLogoUrl, 'PNG', logoX, yPos, logoSize, logoSize);
        
        // Shop Name next to logo
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(shop, logoX + logoSize + 3, yPos + 8); // Align vertically with logo center
        doc.setFont('courier', 'normal');
        yPos += logoSize + 2;
      } catch (error) {
        console.error('Error adding logo:', error);
        // Fallback: just show shop name centered
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(shop, 40, yPos, { align: 'center' });
        doc.setFont('courier', 'normal');
        yPos += 8;
      }
    } else {
      // No logo, just centered shop name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(shop, 40, yPos, { align: 'center' });
      doc.setFont('courier', 'normal');
      yPos += 8;
    }

    // Header
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.text('BOOKING RECEIPT', 40, yPos, { align: 'center' });
    doc.setFont('courier', 'normal');
    yPos += lineHeight * 1;
    
    // Draw line
    doc.line(margin, yPos, 75, yPos);
    yPos += lineHeight;

    // Booking details
    doc.setFontSize(8);
    doc.text(`Booking ID: #${booking._id.slice(-5)}`, margin, yPos);
    yPos += lineHeight;
    
    doc.text(`Date: ${getFormattedDate(booking.date)}`, margin, yPos);
    yPos += lineHeight * 2;

    // Customer details
    const customerName = booking.customerdetails?.customer_name || 'Unknown Customer';
    const customerPhone = booking.customerdetails?.customer_phone || 'N/A';
    
    doc.text(`Customer: ${customerName}`, margin, yPos);
    yPos += lineHeight;
    
    doc.text(`Phone: ${customerPhone}`, margin, yPos);
    yPos += lineHeight * 2;

    // Check if new structure (serviceProviders) or old structure
    if (booking.serviceProviders && booking.serviceProviders.length > 0) {
      // New structure: Multi-barber booking
      doc.text('Services:', margin, yPos);
      yPos += lineHeight;
      
      booking.serviceProviders.forEach((provider, index) => {
        const barberName = provider.barber_id?.name || 'Unknown';
        const barberGender = provider.barber_id?.gender || 'Male';
        const barberLabel = barberGender === 'Male' ? 'Barber' : 'Beautician';
        
        // Barber name
        doc.setFontSize(8);
        doc.text(`${barberLabel}: ${barberName}`, margin + 2, yPos);
        yPos += lineHeight;
        
        // Time range if available
        if (provider.start_time && provider.end_time) {
          doc.text(`Time: ${provider.start_time} - ${provider.end_time}`, margin + 2, yPos);
          yPos += lineHeight;
        }
        
        // Services for this barber
        provider.services.forEach(serviceName => {
          const price = getServicePrice(serviceName, provider.barber_id._id || provider.barber_id);
          const serviceLine = `  - ${serviceName}`;
          const priceText = `Rs. ${price}`;
          
          doc.text(serviceLine, margin + 4, yPos);
          doc.text(priceText, 65, yPos, { align: 'right' });
          yPos += lineHeight;
        });
        
        // Add space between barbers
        if (index < booking.serviceProviders.length - 1) {
          yPos += lineHeight / 2;
        }
      });
    } else {
      // Old structure: Single barber booking
      const barberName = booking.barber_id?.name || 'Unknown Barber';
      doc.text(`${booking.barber_id?.gender === "Male" ? "Barber" : "Beautician"}: ${barberName}`, margin, yPos);
      yPos += lineHeight;
      
      if (booking.start_time && booking.end_time) {
        doc.text(`Time: ${getTimeRange(booking.start_time, booking.end_time)}`, margin, yPos);
        yPos += lineHeight;
      }
      yPos += lineHeight;
      
      doc.text('Services:', margin, yPos);
      yPos += lineHeight;
      
      booking.services.forEach(serviceName => {
        const price = getServicePrice(serviceName, booking.barber_id._id);
        const serviceLine = `- ${serviceName}`;
        const priceText = `Rs. ${price}`;
        
        doc.text(serviceLine, margin + 2, yPos);
        doc.text(priceText, 65, yPos, { align: 'right' });
        yPos += lineHeight;
      });
    }
    
    yPos += lineHeight;

    // Draw line before pricing
    doc.line(margin, yPos, 75, yPos);
    yPos += lineHeight;

    // Pricing
    doc.text(`Subtotal:`, margin, yPos);
    doc.text(`Rs. ${pricing.subtotal}`, 65, yPos, { align: 'right' });
    yPos += lineHeight;
    
    if (booking.discount_applied > 0) {
      doc.text(`Discount (${booking.discount_applied}%):`, margin, yPos);
      doc.text(`-Rs. ${pricing.discountAmount.toFixed(0)}`, 65, yPos, { align: 'right' });
      yPos += lineHeight;
    }
    
    doc.setFontSize(9);
    doc.text(`Total Paid:`, margin, yPos);
    doc.text(`Rs. ${Math.round(booking.total_amount_paid || pricing.total)}`, 65, yPos, { align: 'right' });
    yPos += lineHeight * 2;

    // Payment status
    doc.setFontSize(8);
    const paymentStatus = booking.payment === 'paid' || booking.payment === 'completed' ? 'Paid' : 'Pending';
    doc.text(`Payment: ${paymentStatus}`, margin, yPos);
    yPos += lineHeight * 2;

    // Footer
    doc.text('Thank you for visiting!', 40, yPos, { align: 'center' });
    yPos += lineHeight;
    
    // Draw bottom border
    doc.line(margin, yPos, 75, yPos);

    // Generate filename and download
    const fileName = `${customerName}_Receipt.pdf`;
    doc.save(fileName);
    
    toast.success('Receipt downloaded successfully!');
  };


export {
  setTokenToLocalstorage,
  getTokenFromStorage,
    expireLoginToken,
    setBarberToken,
    getBarberToken,
    expireBarberToken,
    generateReceipt
}