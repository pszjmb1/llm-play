# LLM-Play

_A Collaborative Gym for Exploring the Limits of Language Models_

![LLM-Play Banner](app/banner.svg)

## Overview

**LLM-Play** is an open source project that empowers the AI community to explore, benchmark, and evolve large language model capabilities. We offer a dynamic, crowdsourced gym where researchers, developers, and enthusiasts alike can submit and test novel reinforcement learning challenges designed to reveal the hidden cognitive strategies of LLMs.

Our platform combines the creativity of a diverse community with the rigor of reproducible testing, driving innovation and offering a transparent benchmarking system for today’s language models.

**Inspired by [Andrej Karpathy's vision](https://x.com/karpathy/status/1884676486713737258): _"The highest leverage thing you can do is help construct a high diversity of RL environments that help elicit LLM cognitive strategies. To build a gym of sorts. This is a highly parallelizable task, which favors a large community of collaborators."_**

---

## Our Mission

At LLM-Play, our mission is to:

> **Empower the AI community to unlock the full potential of large language models through a collaborative, crowdsourced playground of reinforcement learning challenges.**

We believe that by working together, we can reveal insights into LLM behavior that drive the next generation of AI research and applications.

---

## Value Proposition

### For AI Researchers:

- **Innovative Experimentation:** Test LLMs under diverse, real-world challenges to uncover unique cognitive strategies.
- **Robust Benchmarking:** Leverage a standardized suite of tests to evaluate and compare different LLM architectures.

### For Developers & Open Source Enthusiasts:

- **Community-Driven Creativity:** Contribute new challenges, refine existing environments, and push the boundaries of what LLMs can do.
- **Learning and Collaboration:** Collaborate with experts and enthusiasts from around the globe, sharing knowledge and best practices.

### For Everyone:

- **Transparency & Reproducibility:** All experiments, tests, and benchmarks are open for scrutiny and continuous improvement.
- **Inclusivity:** Whether you’re a seasoned researcher or a curious newcomer, you’re invited to contribute and learn from the collective experience.

---

## Key Features

- **Crowdsourced Environments:** Submit and vote on innovative reinforcement learning challenges.
- **LLM Benchmarking:** Easily test and compare different language models in a unified interface.
- **Community Analytics:** Access detailed analysis and metrics to track model performance and challenge impact.
- **Open Collaboration:** Join a global community focused on transparency, learning, and iterative improvement.

---

## Getting Started

### Prerequisites

- **Node.js** (v14+ recommended)
- A **Supabase** account for the backend

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/LLM-Play/llm-play.git
   cd llm-play
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Supabase and Environment Variables:**
   1. LLM-Play is designed to work with a Supabase backend. Follow the [Supabase Setup guide](docs/SUPABASE_SETUP.md) to run a hosted Supabase instance (with free or costed plans) or run Supabase locally (entirely free). Note that our open source codebase includes migration files and configuration templates so that anyone can easily set up their own backend, and even do so without Supabase if they so choose.

   2. Create a `.env.local` file in the project root with:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Contribute

We welcome contributions of every kind—code, documentation, ideas, and more! To get started:

- **Browse Issues:** Look for issues tagged with `good first issue` or `help wanted`.
- **Review Our Guidelines:** Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting any pull requests.
- **Join the Conversation:** For questions, ideas, and banter related to all things LLM-Play, check out our [GitHub Discussions](https://github.com/pszjmb1/llm-play/discussions) – we’re excited to hear your thoughts!

Every contribution helps us improve and evolve LLM-Play, so don’t hesitate to share your ideas!

---

## Roadmap

We have an evolving roadmap with both short-term and long-term goals. A detailed roadmap is coming soon!


**Short Term:**

- Enhance the UI for submitting and testing environments.
- Integrate additional LLM APIs for broader benchmarking.
- Refine community voting and result analysis features.

**Long Term:**

- Develop advanced analytics dashboards.
- Host community events, hackathons, and webinars.
- Expand the platform to support more complex multi-agent and adaptive learning challenges.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Connect with Us

- **GitHub:** [github.com/LLM-Play/llm-play](https://github.com/LLM-Play/llm-play)
- **Discord:** Coming soon – join our GitHub Discussions in the meantime!
- **Twitter:** Coming soon!
- **Email:** Coming soon!

Together, we’re unlocking the future of AI. Welcome to LLM-Play!
