import { useEffect, useState } from 'react';

export default function Home() {
  const [names, setNames] = useState([]);

  useEffect(() => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => {
        const extractedNames = data.map(item => item.ja_name);
        setNames(extractedNames);
      });
  }, []);

  return (
    <div>
      <h1>データベースのデータ</h1>
      <ul>
        {names.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </div>
  );
}