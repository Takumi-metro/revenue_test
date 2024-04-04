import { getSession } from "next-auth/react";

export default function ProtectedPage({ session }) {
  if (!session) {
    return <p>アクセス権がありません。</p>;
  }

  return (
    <div>
      <h1>保護されたページ</h1>
      {/* 保護されたページの内容 */}
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession({ req: context.req });

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin', // ログインページへのリダイレクト
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
