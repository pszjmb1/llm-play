document.addEventListener('DOMContentLoaded', (event) => {
    if (document.querySelector('.language-mermaid')) {
      mermaid.initialize({ startOnLoad: true });
    }
  });
  