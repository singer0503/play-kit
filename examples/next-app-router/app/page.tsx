// Server component — 靜態結構在 server 端 render，game 是內含的 client island。
import { GameSection } from './_components/game-section';

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Play Kit · Next.js App Router</h1>
      <p style={{ color: '#666' }}>
        這段 <code>{'<h1>'}</code> 是 server component。下方 <code>GameSection</code> 是 client
        island。
      </p>
      <GameSection />
    </main>
  );
}
