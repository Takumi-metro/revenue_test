import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useSession, signIn } from "next-auth/react";
import 'ag-grid-community/styles/ag-grid.css'; // ag-Gridの基本スタイル
import 'ag-grid-community/styles/ag-theme-alpine.css'; // ag-Gridのダークテーマ

export default function BookingSummaryTable() {
  const { data: session, status } = useSession();
  const [bookingSummary, setBookingSummary] = useState([]);

  useEffect(() => {
    if (status !== "loading" && !session) signIn(); // セッションがない場合はサインインページにリダイレクト

    if (session) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/booking_summary/`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Booking summary data:', data); // デバッグ用のログ
          setBookingSummary(data);
        })
        .catch(error => console.error('Error fetching booking summary:', error));
    }
  }, [session, status]);

  if (status === "loading") {
    return <p>Loading...</p>; // セッションステータスが "loading" の間はローディング表示
  }

  if (!session) {
    return null; // セッションがない場合は何も表示しない（signIn関数によってリダイレクトされる）
  }

  // 以下は認証されたユーザーにのみ表示されるコンテンツ
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
