import LLMPlay_Logo from '@/components/llm-play-logo';

export default function Main() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4">
      <section id="overview" className="section">
        <div className="container">
          <h2>Unlocking the Future of AI Research</h2>
          <p>
            LLM-Play empowers the AI community to explore, benchmark, and evolve large language
            model capabilities through a dynamic, crowdsourced platform. Our mission is to reveal
            the hidden cognitive strategies of LLMs and foster innovation through open
            collaboration.
          </p>
        </div>
      </section>

      <section id="value-prop" className="section">
        <div className="container">
          <h2>Why LLM-Play?</h2>
          <div className="columns">
            <div className="column">
              <h3>For Researchers</h3>
              <ul>
                <li>Innovative testing environments for breakthrough insights</li>
                <li>Reliable benchmarking across diverse scenarios</li>
              </ul>
            </div>
            <div className="column">
              <h3>For Developers</h3>
              <ul>
                <li>Contribute your unique challenges and solutions</li>
                <li>Collaborate with a vibrant, global community</li>
              </ul>
            </div>
            <div className="column">
              <h3>For Everyone</h3>
              <ul>
                <li>Transparent, open-source approach to AI evaluation</li>
                <li>Inclusive, community-driven innovation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <h2>How It Works</h2>
          <ol>
            <li>
              <strong>Submit:</strong> Contribute your own RL environments.
            </li>
            <li>
              <strong>Test:</strong> Run different LLMs through our curated challenges.
            </li>
            <li>
              <strong>Vote & Analyze:</strong> Community feedback shapes the future of our testing
              suite.
            </li>
          </ol>
        </div>
      </section>

      <section id="cta" className="section">
        <div className="container">
          <h2>Join the Movement</h2>
          <p>
            Help us unlock the full potential of AI research by contributing your ideas, code, and
            energy. Whether you're a researcher, developer, or enthusiast, there's a place for you
            at LLM-Play.
          </p>
          <a href="https://github.com/yourusername/llm-play" className="cta-button">
            Explore the Repository
          </a>
          <a href="https://discord.gg/yourinvite" className="cta-button secondary">
            Join Our Discord
          </a>
        </div>
      </section>
    </main>
  );
}
