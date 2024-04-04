# main.py

from fastapi import FastAPI, HTTPException, Depends
from databases import Database
from collections import defaultdict
import os
from dotenv import load_dotenv
import json
from itertools import accumulate
import sqlite3
from models.booking import BookingQueryParams
#from datetime import date
import time

MAX_RETRIES = 3
RETRY_DELAY = 1  # 秒


# 環境変数をロード
load_dotenv()

# 環境変数からデータベース接続URLを取得
DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE_URL:", DATABASE_URL)  # この行がデバッグ出力を行います

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware
database = Database(DATABASE_URL)

# CORSを設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Next.jsアプリのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

def get_db_connection():
    conn = sqlite3.connect('database/cache.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            day_of_week TEXT,
            lead_time INTEGER,
            total_rooms_count INTEGER,
            count INTEGER
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS last_query (
            start_date TEXT,
            end_date TEXT
        )
    ''')
    conn.commit()
    conn.close()

create_tables()

@app.get("/booking_summary/")
async def read_booking_summary():
    query = """
    SELECT
        booking_date,
        group_date,
        SUM(sum_rooms_count) AS rooms_count,
        SUM(new_added) AS new_added,
        SUM(new_cancelled) AS new_cancelled,
        (SELECT SUM(number_of_guest_rooms)
         FROM revenue_prod.hotels
         WHERE id IN (
             SELECT h.id
             FROM revenue_prod.hotels AS h
             JOIN (
                 SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                 FROM revenue_prod.pms_csv
                 GROUP BY 1
                 HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
             ) AS 365_day ON h.id = 365_day.hotel_id
             WHERE h.prefecture_id = 28
               AND h.pms_expired_uploads_notifications_disabled = 0
         )
           AND booking_management_system_id NOT IN (27, 31, 32)
        ) AS total_guest_rooms
    FROM (
        SELECT
            booking_date,
            logged_date AS group_date,
            SUM(room_count) AS sum_rooms_count,
            SUM(room_count) AS new_added,
            0 AS new_cancelled
        FROM (
            SELECT booking_date, room_count, logged_date, cancelled_date
            FROM revenue_prod.pms_glovia_raw_data
            WHERE hotel_id IN (
                SELECT h.id
                FROM revenue_prod.hotels AS h
                JOIN (
                    SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                    FROM revenue_prod.pms_csv
                    GROUP BY 1
                    HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                ) AS 365_day ON h.id = 365_day.hotel_id
                WHERE h.prefecture_id = 28
                  AND h.pms_expired_uploads_notifications_disabled = 0
            )
              AND room_price > 0
              AND booking_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 365 DAY) AND DATE_ADD(CURDATE(), INTERVAL 180 DAY)
            UNION ALL
            SELECT booking_date, room_count, logged_date, cancelled_date
            FROM revenue_prod.pms_tap_tokyu_stay_raw_data
            WHERE hotel_id IN (
                SELECT h.id
                FROM revenue_prod.hotels AS h
                JOIN (
                    SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                    FROM revenue_prod.pms_csv
                    GROUP BY 1
                    HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                ) AS 365_day ON h.id = 365_day.hotel_id
                WHERE h.prefecture_id = 28
                  AND h.pms_expired_uploads_notifications_disabled = 0
            )
              AND room_price > 0
              AND booking_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 365 DAY) AND DATE_ADD(CURDATE(), INTERVAL 180 DAY)
        ) AS base_data
        GROUP BY 1, 2
        UNION ALL
        SELECT
            booking_date,
            cancelled_date AS group_date,
            -SUM(room_count) AS sum_rooms_count,
            0 AS new_added,
            SUM(room_count) AS new_cancelled
        FROM (
            SELECT booking_date, room_count, logged_date, cancelled_date
            FROM revenue_prod.pms_glovia_raw_data
            WHERE hotel_id IN (
                SELECT h.id
                FROM revenue_prod.hotels AS h
                JOIN (
                    SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                    FROM revenue_prod.pms_csv
                    GROUP BY 1
                    HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                ) AS 365_day ON h.id = 365_day.hotel_id
                WHERE h.prefecture_id = 28
                  AND h.pms_expired_uploads_notifications_disabled = 0
            )
              AND room_price > 0
              AND booking_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 365 DAY) AND DATE_ADD(CURDATE(), INTERVAL 180 DAY)
              AND cancelled_date IS NOT NULL
            UNION ALL
            SELECT booking_date, room_count, logged_date, cancelled_date
            FROM revenue_prod.pms_tap_tokyu_stay_raw_data
            WHERE hotel_id IN (
                SELECT h.id
                FROM revenue_prod.hotels AS h
                JOIN (
                    SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                    FROM revenue_prod.pms_csv
                    GROUP BY 1
                    HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                ) AS 365_day ON h.id = 365_day.hotel_id
                WHERE h.prefecture_id = 28
                  AND h.pms_expired_uploads_notifications_disabled = 0
            )
              AND room_price > 0
              AND booking_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 365 DAY) AND DATE_ADD(CURDATE(), INTERVAL 180 DAY)
              AND cancelled_date IS NOT NULL
        ) AS base_data
        GROUP BY 1, 2
    ) AS r_d
    GROUP BY 1, 2
    """
    try:
        result = await database.fetch_all(query=query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/booking_curve_data/")
async def read_booking_curve_data(params: BookingQueryParams = Depends()):
    conn = None
    retry_count = 0

    while retry_count < MAX_RETRIES:
        try:
            conn = get_db_connection()
            c = conn.cursor()

            # 前回のリクエストの条件を取得
            c.execute('SELECT start_date, end_date FROM last_query')
            last_query = c.fetchone()

            # パラメータが提供されている場合は、提供された日付範囲を使用
            if params.start_date and params.end_date:
                start_date = params.start_date
                end_date = params.end_date

            # パラメータが提供されていない場合は、date.jsonファイルから日付範囲を読み込む
            else:
                with open(os.path.join("settings", "date.json")) as f:
                    date_config = json.load(f)
                    start_date = date_config["start_date"]
                    end_date = date_config["end_date"]

            # 日付範囲を文字列に変換
            start_date_str = start_date if isinstance(start_date, str) else start_date.isoformat() if start_date else ''
            end_date_str = end_date if isinstance(end_date, str) else end_date.isoformat() if end_date else ''

            if last_query and last_query['start_date'] == start_date_str and last_query['end_date'] == end_date_str:
                # 条件が変更されていない場合はSQLiteからデータを取得
                c.execute('SELECT day_of_week, lead_time, total_rooms_count, count FROM bookings')
                result = c.fetchall()

                data = defaultdict(lambda: defaultdict(lambda: {'sum': 0, 'count': 0}))
                for row in result:
                    data[row['day_of_week']][row['lead_time']]['sum'] = row['total_rooms_count']
                    data[row['day_of_week']][row['lead_time']]['count'] = row['count']

            else:
                # 条件が変更された場合はMySQLからデータを取得
                query = f"""
                WITH booking_data AS (
                SELECT
                        booking_date,
                        logged_date AS group_date,
                        SUM(room_count) AS rooms_count
                    FROM (
                        SELECT booking_date, room_count, logged_date, cancelled_date
                        FROM revenue_prod.pms_glovia_raw_data
                        WHERE hotel_id IN (
                            SELECT h.id
                            FROM revenue_prod.hotels AS h
                            JOIN (
                                SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                                FROM revenue_prod.pms_csv
                                GROUP BY 1
                                HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                            ) AS 365_day ON h.id = 365_day.hotel_id
                            WHERE h.prefecture_id = 28
                            AND h.pms_expired_uploads_notifications_disabled = 0
                        )
                        AND room_price > 0
                        AND booking_date BETWEEN '{start_date_str}' AND '{end_date_str}'

                        UNION ALL

                        SELECT booking_date, room_count, logged_date, cancelled_date
                        FROM revenue_prod.pms_tap_tokyu_stay_raw_data
                        WHERE hotel_id IN (
                            SELECT h.id
                            FROM revenue_prod.hotels AS h
                            JOIN (
                                SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                                FROM revenue_prod.pms_csv
                                GROUP BY 1
                                HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                            ) AS 365_day ON h.id = 365_day.hotel_id
                            WHERE h.prefecture_id = 28
                            AND h.pms_expired_uploads_notifications_disabled = 0
                        )
                        AND room_price > 0
                        AND booking_date BETWEEN '{start_date_str}' AND '{end_date_str}'
                    ) AS base_data
                    GROUP BY 1, 2

                    UNION ALL

                    SELECT
                        booking_date,
                        cancelled_date AS group_date,
                        -SUM(room_count) AS rooms_count
                    FROM (
                        SELECT booking_date, room_count, logged_date, cancelled_date
                        FROM revenue_prod.pms_glovia_raw_data
                        WHERE hotel_id IN (
                            SELECT h.id
                            FROM revenue_prod.hotels AS h
                            JOIN (
                                SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                                FROM revenue_prod.pms_csv
                                GROUP BY 1
                                HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                            ) AS 365_day ON h.id = 365_day.hotel_id
                            WHERE h.prefecture_id = 28
                            AND h.pms_expired_uploads_notifications_disabled = 0
                        )
                        AND room_price > 0
                        AND booking_date BETWEEN '{start_date_str}' AND '{end_date_str}'
                        AND cancelled_date IS NOT NULL

                        UNION ALL

                        SELECT booking_date, room_count, logged_date, cancelled_date
                        FROM revenue_prod.pms_tap_tokyu_stay_raw_data
                        WHERE hotel_id IN (
                            SELECT h.id
                            FROM revenue_prod.hotels AS h
                            JOIN (
                                SELECT hotel_id, MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) AS min_date
                                FROM revenue_prod.pms_csv
                                GROUP BY 1
                                HAVING MIN(DATE(DATE_ADD(file_date, INTERVAL 9 HOUR))) <= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
                            ) AS 365_day ON h.id = 365_day.hotel_id
                            WHERE h.prefecture_id = 28
                            AND h.pms_expired_uploads_notifications_disabled = 0
                        )
                        AND room_price > 0
                        AND booking_date BETWEEN '{start_date_str}' AND '{end_date_str}'
                        AND cancelled_date IS NOT NULL
                    ) AS base_data
                    GROUP BY 1, 2
                )

                SELECT
                    DAYNAME(booking_date) AS day_of_week,
                    CASE WHEN DATEDIFF(booking_date, group_date) < 0 THEN 0 ELSE DATEDIFF(booking_date, group_date) END AS lead_time,
                    SUM(rooms_count) AS total_rooms_count,
                    COUNT(DISTINCT CASE WHEN rooms_count > 0 THEN CONCAT(booking_date, group_date) END) AS count
                FROM booking_data
                WHERE DATEDIFF(booking_date, group_date) <= 180
                GROUP BY 1, 2
                ORDER BY 1, 2 DESC;
                """

                result = await database.fetch_all(query=query)

                # 曜日ごとにデータを集計
                data = defaultdict(lambda: defaultdict(lambda: {'sum': 0, 'count': 0}))
                for item in result:
                    day_of_week = item["day_of_week"]
                    lead_time = item["lead_time"]
                    data[day_of_week][lead_time]['sum'] = float(item["total_rooms_count"])
                    data[day_of_week][lead_time]['count'] = float(item["count"])

                # SQLiteのデータを更新
                c.execute('DELETE FROM bookings')
                c.executemany('INSERT INTO bookings VALUES (?, ?, ?, ?)', [(day_of_week, lead_time, values['sum'], values['count']) for day_of_week, lead_time_data in data.items() for lead_time, values in lead_time_data.items()])
                c.execute('DELETE FROM last_query')
                c.execute('INSERT INTO last_query VALUES (?, ?)', (start_date_str, end_date_str))
                conn.commit()

            conn.close()

            # 曜日の順序を定義
            day_of_week_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

            # 曜日ごとに平均と累積の予約部屋数を計算
            processed_data = {}
            for day_of_week in day_of_week_order:
                if day_of_week in data:
                    lead_time_data = data[day_of_week]
                    labels = sorted(lead_time_data.keys(), reverse=True)
                    avg_rooms_counts = [lead_time_data[lead_time]['sum'] / lead_time_data[lead_time]['count'] if lead_time_data[lead_time]['count'] > 0 else 0 for lead_time in labels]
                    cumulative_rooms_counts = list(accumulate(avg_rooms_counts))

                    processed_data[day_of_week] = {
                        "labels": [f"Lead Time: {lead_time} days" for lead_time in labels],
                        "datasets": [
                            {
                                "label": f"Averaged Cumulative Rooms Booked ({day_of_week})",
                                "data": cumulative_rooms_counts,
                            }
                        ],
                    }

            return processed_data

        except sqlite3.OperationalError as e:
            if "database is locked" in str(e):
                retry_count += 1
                if retry_count < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                else:
                    raise HTTPException(status_code=500, detail="Database lock timeout")
            else:
                raise HTTPException(status_code=500, detail=str(e))

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        finally:
            if conn:
                conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
