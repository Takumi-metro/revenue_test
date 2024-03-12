import React from 'react';
import BookingCurveChart from '../components/BookingCurveChart';
import BookingSummaryTable from '../components/BookingSummaryTable';

export default function Home() {
  return (
    <div>
      <h1>Booking Summary</h1>
      <BookingCurveChart />
      <BookingSummaryTable />
    </div>
  );
}