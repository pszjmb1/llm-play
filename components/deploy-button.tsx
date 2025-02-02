import Link from 'next/link';
import { Button } from './ui/button';

export default function DeployButton() {
  return (
    <>
      <Link
        href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpszjmb1%2Fllm-play.git&project-name=llm-play&repository-name=llm-play&demo-title=LLM-Play&demo-description=A+Collaborative+Gym+for+Exploring+LLM+Capabilities&demo-url=https%3A%2F%2Fllm-play.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fpszjmb1%2Fllm-play.git&demo-image=https%3A%2F%2Fllm-play.vercel.app%2Fopengraph-image.png"
        target="_blank"
      >
        <Button className="flex items-center gap-2" size={'sm'}>
          <svg
            className="h-3 w-3"
            viewBox="0 0 76 65"
            fill="hsl(var(--background)/1)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="inherit" />
          </svg>
          <span>Deploy to Vercel</span>
        </Button>
      </Link>
    </>
  );
}
