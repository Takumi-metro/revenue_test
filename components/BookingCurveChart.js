import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookingCurveChart() {
  const [bookingData, setBookingData] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // リードタイムごとにデータを集計
          const leadTimeData = {};
          data.forEach(item => {
            const bookingDate = new Date(item.booking_date);
            const groupDate = new Date(item.group_date);
            const leadTime = Math.ceil((bookingDate - groupDate) / (1000 * 60 * 60 * 24));
            if (!leadTimeData[leadTime]) {
              leadTimeData[leadTime] = [];
            }
            leadTimeData[leadTime].push(item);
          });

          // 曜日ごとにデータを観測
          const observationData = {};
          for (const leadTime in leadTimeData) {
            leadTimeData[leadTime].forEach(item => {
              const observationDate = new Date(item.group_date);
              const weekday = weekdays[observationDate.getDay()];
              if (!observationData[weekday]) {
                observationData[weekday] = {};
              }
              if (!observationData[weekday][leadTime]) {
                observationData[weekday][leadTime] = {
                  totalRoomsCount: 0,
                  observationCount: 0,
                };
              }
              observationData[weekday][leadTime].totalRoomsCount += item.rooms_count;
              observationData[weekday][leadTime].observationCount += 1;
            });
          }

          // 曜日ごとに平均を計算
          const processedData = {};
          for (const weekday in observationData) {
            const averagedLeadTimeData = {};
            for (const leadTime in observationData[weekday]) {
              const { totalRoomsCount, observationCount } = observationData[weekday][leadTime];
              averagedLeadTimeData[leadTime] = totalRoomsCount / observationCount;
            }

            const labels = Object.keys(averagedLeadTimeData).sort((a, b) => b - a);
            const averagedRoomsCounts = labels.map(leadTime => averagedLeadTimeData[leadTime]);
            const cumulativeRoomsCounts = averagedRoomsCounts.reduce((acc, count) => {
              acc.unshift((acc.length > 0 ? acc[0] : 0) + count);
              return acc;
            }, []);

            processedData[weekday] = {
              labels: labels.map(leadTime => `Lead Time: ${leadTime} days`),
              datasets: [
                {
                  label: `Averaged Cumulative Rooms Booked (Observed on ${weekday}s)`,
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