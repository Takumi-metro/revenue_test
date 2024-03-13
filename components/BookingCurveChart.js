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
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {bookingData ? (
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayOfWeek => (
          bookingData[dayOfWeek] && (
            <div key={dayOfWeek} style={{ width: '50%', padding: '10px', boxSizing: 'border-box' }}>
              <h2>Booking Curve ({dayOfWeek})</h2>
              <Line data={bookingData[dayOfWeek]} />
            </div>
          )
        ))
      ) : (
        <p>Loading booking curve data...</p>
      )}
    </div>
  );
}