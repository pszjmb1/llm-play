import Hero from '@/components/hero';
import Main from '@/components/site/home/main';
export default async function Home() {
  return (    
  <div
    style={{
      maxWidth: 1280,
      margin: '0 auto',
      padding: '2rem',
    }}
  >
      <Hero />
      <Main />
  </div>
  );
}
