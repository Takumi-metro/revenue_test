import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Home() {
  const [bookingData, setBookingData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data)) { // dataが配列であることを確認
          //const slicedData = data.slice(0, 100);
          //const bookingDates =  slicedData.map(item => item.booking_date);
          //const guestRooms = slicedData.map(item => item.rooms_count);
          const bookingDates = data.map(item => item.booking_date);
          const guestRooms = data.map(item => item.rooms_count);
          setBookingData({
            labels: bookingDates,
            datasets: [
              {
                label: 'Rooms count',
                data: guestRooms,
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1
              }
            ]
          });
        } else {
          console.error('Invalid data format');
        }
      })
      .catch(error => console.error('Error fetching booking summary:', error));
  }, []);

  return (
    <div>
      <Line data={bookingData} />
    </div>
  );
}