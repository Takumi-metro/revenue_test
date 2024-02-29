import { useEffect, useState } from 'react';

export default function Home() {
  const [bookingSummary, setBookingSummary] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => setBookingSummary(data))
      .catch(error => console.error('Error fetching booking summary:', error));
  }, []);

  return (
    <div>
      <h1>Booking Summary</h1>
      {bookingSummary.length > 0 ? (
        <ul>
          {bookingSummary.map((item, index) => (
            <li key={index}>
              Booking Date: {item.booking_date}, Group Date: {item.group_date}, Rooms Count: {item.rooms_count}, New Added: {item.new_added}, New Cancelled: {item.new_cancelled}, Total Guest Rooms: {item.total_guest_rooms}
            </li>
          ))}
        </ul>
      ) : (
        <p>No booking summary data available.</p>
      )}
    </div>
  );
}
