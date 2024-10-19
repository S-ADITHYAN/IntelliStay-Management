import React, { useState } from 'react';
import './Gallery.css'; // Assuming you have a separate CSS file for styles

const Gallery = () => {
  const images = [
    'https://upavanresort.com/uploads/gallery/main/18.jpg',
    'https://upavanresort.com/uploads/gallery/main/131.JPG',
    'https://upavanresort.com/uploads/gallery/main/21.JPG',
    'https://upavanresort.com/uploads/gallery/main/1.jpg',
    'https://upavanresort.com/uploads/gallery/main/2.JPG',
    'https://upavanresort.com/uploads/gallery/main/5.JPG',
    'https://upavanresort.com/uploads/gallery/main/1.jpg',
    'https://upavanresort.com/uploads/gallery/main/2.JPG',
    'https://upavanresort.com/uploads/gallery/main/5.JPG',
  ];

  const [visibleImages, setVisibleImages] = useState(6); // Start by showing 6 images

  const handleSeeMore = () => {
    setVisibleImages((prev) => prev + 3); // Show 3 more images
  };

  return (
    <section className="explore" id="gallery">
      <p className="section__subheader">GALLERY</p>
      <h2 className="section__header">Capture the Essence of Our Experience</h2>
      <div className="gallery">
        {images.slice(0, visibleImages).map((image, index) => (
          <div className="gallery__item" key={index}>
            <img src={image} alt={`Gallery Image ${index + 1}`} />
          </div>
        ))}
      </div>
      {visibleImages < images.length && ( // Show button only if there are more images
       <div className="see-more-container">
       <button className="btn" onClick={handleSeeMore}>
         See More
       </button>
     </div>
      )}
    </section>
  );
};

export default Gallery;
