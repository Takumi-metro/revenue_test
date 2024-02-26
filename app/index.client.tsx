// app/page.tsx
import { useEffect, useState } from 'react';

interface DataItem {
  ja_name: string;
}

export default function Home() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data: DataItem[]) => {
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