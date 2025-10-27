import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Welcome to Oblito</h1>
      <p>This is the homepage</p>
      <p>
        <Link href="/login">Go to login</Link>
      </p>
    </main>
  );
}
