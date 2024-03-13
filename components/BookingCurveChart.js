import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function BookingCurveChart() {
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/booking_curve_data/')
      .then(response => response.json())
      .then(data => setBookingData(data))
      .catch(error => console.error('Error fetching booking curve data:', error));
  }, []);

  return (
    <div>
      {bookingData ? (
        <div>
          <h2>Booking Curve</h2>
          <Line data={bookingData} />
        </div>
      ) : (
        <p>Loading booking curve data...</p>
      )}
    </div>
  );
}