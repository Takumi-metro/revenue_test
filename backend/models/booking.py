# models/booking.py
from pydantic import BaseModel
from datetime import date
from typing import Optional  # この行を追加

class BookingQueryParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None