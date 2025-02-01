import LLMPlay_Logo from '@/components/llm-play-logo';

export default function Header() {
  return (
    <div className="flex flex-col items-center gap-16">
      <div className="flex items-center justify-center gap-8">
        <LLMPlay_Logo />
      </div>
      <div className="container">
        <a href="https://github.com/pszjmb1/llm-play" className="cta-button">
          Get Started with LLM-Play on GitHub
        </a>
      </div>
    </div>
  );
}
