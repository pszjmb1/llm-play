import { ThemeSwitcher } from '@/components/theme-switcher';
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <ThemeSwitcher />
        <p>&copy; 2025 LLM-Play. All rights reserved.</p>
        <ul className="social-links">
          <li>
            <a href="https://github.com/pszjmb1/llm-play">GitHub</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
