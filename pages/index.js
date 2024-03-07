import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Home() {
  const [bookingData, setBookingData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // 2024年3月8日の宿泊に対する予約データのみをフィルタリング
          const filteredData = data.filter(item => item.booking_date === '2024-03-08');
          // group_dateを基準に予約データをソート
          const sortedData = filteredData.sort((a, b) => new Date(a.group_date) - new Date(b.group_date));
          const groupDates = sortedData.map(item => item.group_date);
          // 累積和を計算
          const cumulativeRoomsCounts = sortedData.reduce((acc, curr) => {
            const lastSum = acc.length > 0 ? acc[acc.length - 1] : 0;
            acc.push(lastSum + curr.rooms_count);
            return acc;
          }, []);

          setBookingData({
            labels: groupDates,
            datasets: [
              {
                label: 'Cumulative Rooms Booked',
                data: cumulativeRoomsCounts,
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
