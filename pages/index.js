import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Home() {
  const [bookingData, setBookingData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // 最小と最大のリードタイムを見つける
          const maxLeadTime = Math.max(...data.map(d => d.lead_time));
          const minLeadTime = Math.min(...data.map(d => d.lead_time));

          // リードタイムの全範囲をカバーするラベルを生成
          const labels = Array.from({ length: maxLeadTime - minLeadTime + 1 }, (_, i) => `Lead Time: ${i + minLeadTime} days`);

          // データを曜日ごとに整理
          const dataByWeekday = weekdays.map((weekday, index) => ({
            weekday,
            data: data.filter(d => d.weekday === index + 1)
          }));

          // 各曜日ごとにデータセットを作成し、累積和を計算
          const datasets = dataByWeekday.map(({ weekday, data }) => {
            let cumulativeSum = 0;
            const cumulativeData = labels.map(label => {
              const leadTime = parseInt(label.split(': ')[1], 10); // "Lead Time: X days"からリードタイムを抽出
              const dayData = data.find(d => d.lead_time === leadTime);
              if (dayData) {
                cumulativeSum += dayData.avg_rooms_booked;
              }
              return cumulativeSum; // 存在しないリードタイムでは累積値をそのまま使用
            });

            return {
              label: weekday,
              data: cumulativeData,
              fill: false,
              borderColor: `hsl(${Math.random() * 360}, 100%, 50%)`, // ランダムな色を生成
              tension: 0.1,
            };
          });

          setBookingData({ labels, datasets });
        } else {
          console.error('Invalid data format or no data available');
        }
      })
      .catch(error => console.error('Error fetching booking summary:', error));
  }, []);

  //return (
   // <div>
     // <Line data={bookingData} options={{ scales: { y: { beginAtZero: true } } }} />
    //</div>

    return (
      <div>
        {bookingData.datasets.map((dataset, index) => (
          <div key={index} style={{ width: '50%', float: 'left' }}>
            <h3>{dataset.label}</h3>
            <Line data={{ labels: bookingData.labels, datasets: [dataset] }} options={{ scales: { y: { beginAtZero: true } } }} />
          </div>
        ))}
      </div>
    );
}
