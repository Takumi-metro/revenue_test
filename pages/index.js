import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css'; // ag-Gridの基本スタイル
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css'; // ag-Gridのダークテーマ

export default function Home() {
  const [bookingSummary, setBookingSummary] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/booking_summary/')
      .then(response => response.json())
      .then(data => setBookingSummary(data))
      .catch(error => console.error('Error fetching booking summary:', error));
  }, []);

  // ag-Gridの列定義
  const columnDefs = [
    { headerName: "Booking Date", field: "booking_date" },
    { headerName: "Group Date", field: "group_date" },
    { headerName: "Rooms Count", field: "rooms_count" },
    { headerName: "New Added", field: "new_added" },
    { headerName: "New Cancelled", field: "new_cancelled" },
    { headerName: "Total Guest Rooms", field: "total_guest_rooms" }
  ];

  return (
    <div className="ag-theme-alpine-dark" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        rowData={bookingSummary}
        columnDefs={columnDefs}
      />
    </div>
  );
}
