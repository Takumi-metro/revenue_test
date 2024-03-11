import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Home() {
  const [bookingData, setBookingData] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // 曜日ごとにデータをグループ化
          const groupedData = data.reduce((acc, item) => {
            const date = new Date(item.booking_date);
            const weekday = weekdays[date.getDay()];
            if (!acc[weekday]) {
              acc[weekday] = [];
            }
            acc[weekday].push(item);
            return acc;
          }, {});

          // 曜日ごとにデータを処理
          const processedData = {};
          for (const weekday in groupedData) {
            const sortedData = groupedData[weekday].sort((a, b) => new Date(a.group_date) - new Date(b.group_date));
            const groupDates = sortedData.map(item => item.group_date);
            const cumulativeRoomsCounts = sortedData.reduce((acc, curr) => {
              const lastSum = acc.length > 0 ? acc[acc.length - 1] : 0;
              acc.push(lastSum + curr.rooms_count);
              return acc;
            }, []);
            processedData[weekday] = {
              labels: groupDates,
              datasets: [
                {
                  label: `Cumulative Rooms Booked (${weekday})`,
                  data: cumulativeRoomsCounts,
                  fill: false,
                  borderColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                  tension: 0.1,
                },
              ],
            };
          }
          setBookingData(processedData);
        } else {
          console.error('Invalid data format');
        }
      })
      .catch(error => console.error('Error fetching booking summary:', error));
  }, []);

  return (
    <div>
      {Object.keys(bookingData).map(weekday => (
        <div key={weekday}>
          <h2>{weekday}</h2>
          <Line data={bookingData[weekday]} />
        </div>
      ))}
    </div>
  );
}