export default function Main() {
  return (
    <main className="flex-1">
      <section id="overview" className="section bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Unlocking the Future of AI Research
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              LLM-Play empowers the AI community to explore, benchmark, and evolve large language
              model capabilities through a dynamic, crowdsourced platform. Our mission is to reveal
              the hidden cognitive strategies of LLMs and foster innovation through open
              collaboration.
            </p>
          </div>
        </div>
      </section>

      <section id="value-prop" className="section">
        <div className="container">
          <h2 className="text-center">Why LLM-Play?</h2>
          <div className="columns mt-12">
            <div className="column">
              <h3 className="text-xl font-semibold">For Researchers</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Innovative testing environments for breakthrough insights
                </li>
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Reliable benchmarking across diverse scenarios
                </li>
              </ul>
            </div>
            <div className="column">
              <h3 className="text-xl font-semibold">For Developers</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Contribute your unique challenges and solutions
                </li>
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Collaborate with a vibrant, global community
                </li>
              </ul>
            </div>
            <div className="column">
              <h3 className="text-xl font-semibold">For Everyone</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Transparent, open-source approach to AI evaluation
                </li>
                <li className="flex items-start">
                  <svg className="mr-2 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Inclusive, community-driven innovation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2>How It Works</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="relative">
                <div className="absolute -left-4 top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground">
                  <span className="absolute inset-0 flex items-center justify-center font-bold">1</span>
                </div>
                <h3 className="pl-8 text-lg font-semibold">Submit</h3>
                <p className="mt-2 text-muted-foreground">Contribute your own RL environments.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-4 top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground">
                  <span className="absolute inset-0 flex items-center justify-center font-bold">2</span>
                </div>
                <h3 className="pl-8 text-lg font-semibold">Test</h3>
                <p className="mt-2 text-muted-foreground">Run different LLMs through our curated challenges.</p>
              </div>
              <div className="relative">
                <div className="absolute -left-4 top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground">
                  <span className="absolute inset-0 flex items-center justify-center font-bold">3</span>
                </div>
                <h3 className="pl-8 text-lg font-semibold">Vote & Analyze</h3>
                <p className="mt-2 text-muted-foreground">Community feedback shapes the future of our testing suite.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="section bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2>Join the Movement</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Help us unlock the full potential of AI research by contributing your ideas, code, and
              energy. Whether you&apos;re a researcher, developer, or enthusiast, there&apos;s a place for you
              at LLM-Play.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="https://github.com/pszjmb1/llm-play" className="cta-button">
                Explore the Repository
              </a>
              <a href="https://github.com/pszjmb1/llm-play/discussions" className="cta-button secondary">
                Join in on the discussions
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}