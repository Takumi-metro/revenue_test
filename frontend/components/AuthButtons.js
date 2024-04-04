import { signIn, signOut, useSession } from "next-auth/react"

export default function Component() {
  const { data: session } = useSession()

  if (session) {
    return (
      <>
        <p>こんにちは、{session.user.name}さん！</p>
        <button onClick={() => signOut()}>ログアウト</button>
      </>
    )
  }
  return (
    <>
      <p>ゲストとしてログインしています。</p>
      <button onClick={() => signIn()}>ログイン</button>
    </>
  )
}
