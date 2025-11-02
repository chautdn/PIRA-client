import React from 'react';
import { useNavigate } from 'react-router-dom';

const RentalOrderFormTest = () => {
  const navigate = useNavigate();

  console.log('RentalOrderFormTest: Basic component loaded');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Rental Order Form</h1>
        <p>This is a test version to check if basic React components work.</p>
        
        <button
          onClick={() => navigate('/cart')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Cart
        </button>
      </div>
    </div>
  );
};

export default RentalOrderFormTest;