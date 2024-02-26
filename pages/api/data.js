import mysql from 'mysql2/promise';

export async function get(req, res) {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM revenue_prod.hotels');
    res.status(200).json(rows);
  } catch (error) {
    console.error('MySQL Error: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await connection.end();
  }
}