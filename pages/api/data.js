import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM hotels');
    res.status(200).json(rows);
  } catch (error) {
    console.error('MySQL Error: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await connection.end();
  }
}