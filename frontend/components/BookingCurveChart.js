import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useSession, signIn } from "next-auth/react";

export default function BookingCurveChart() {
  const { data: session, status } = useSession();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    if (status !== "loading" && !session) signIn(); // セッションがない場合はサインインページにリダイレクト

    if (session) { // ユーザーがログインしている場合にのみデータを取得
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/booking_curve_data/`)
        .then(response => response.json())
        .then(data => setBookingData(data))
        .catch(error => console.error('Error fetching booking curve data:', error));
    }
  }, [session, status]);

  if (status === "loading") {
    return <p>Loading...</p>; // セッションステータスが "loading" の間はローディング表示
  }

  if (!session) {
    return null; // セッションがない場合は何も表示しない（signIn関数によってリダイレクトされる）
  }

  // 以下は認証されたユーザーにのみ表示されるコンテンツ
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
