import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Carousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const [animationID, setAnimationID] = useState(null);
  const sliderRef = useRef(null);

  // Default images if none provided
  const defaultImages = [
    'https://res.cloudinary.com/ddxwcwxhl/image/upload/v1765899982/Elite_Barber_Shop/menu1_zlt8v6.jpg',
    'https://res.cloudinary.com/ddxwcwxhl/image/upload/v1765899898/Elite_Barber_Shop/menu3_calngl.jpg',
    'https://res.cloudinary.com/ddxwcwxhl/image/upload/v1765899784/Elite_Barber_Shop/menu2_dko4sx.jpg',
    'https://res.cloudinary.com/ddxwcwxhl/image/upload/v1765899781/Elite_Barber_Shop/menu4_kdj6rj.jpg'
  ];

  const slides = images.length > 0 ? images : defaultImages;

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  // Touch/Mouse events for drag
  const touchStart = (index) => (e) => {
    setCurrentIndex(index);
    setIsDragging(true);
    const touch = e.type.includes('mouse') ? e : e.touches[0];
    setStartPos(touch.clientX);
    const animation = requestAnimationFrame(animation => setAnimationID(animation));
    sliderRef.current.style.cursor = 'grabbing';
  };

  const touchMove = (e) => {
    if (!isDragging) return;
    const touch = e.type.includes('mouse') ? e : e.touches[0];
    const currentPosition = touch.clientX;
    const diff = currentPosition - startPos;
    setCurrentTranslate(prevTranslate + diff);
  };

  const touchEnd = () => {
    setIsDragging(false);
    cancelAnimationFrame(animationID);
    
    const movedBy = currentTranslate - prevTranslate;
    
    // Swipe threshold
    if (movedBy < -100 && currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    if (movedBy > 100 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    setPrevTranslate(currentTranslate);
    sliderRef.current.style.cursor = 'grab';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-lg">
      {/* Carousel Container */}
      <div
        ref={sliderRef}
        className="relative h-64 sm:h-80 md:h-96 cursor-grab select-none"
        onMouseDown={touchStart(currentIndex)}
        onMouseMove={touchMove}
        onMouseUp={touchEnd}
        onMouseLeave={() => isDragging && touchEnd()}
        onTouchStart={touchStart(currentIndex)}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
      >
        {/* Slides */}
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {slides.map((image, index) => (
            <div
              key={index}
              className="min-w-full h-full flex-shrink-0"
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable="false"
              />
            </div>
          ))}
        </div>

        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
