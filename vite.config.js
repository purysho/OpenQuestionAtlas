import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";

const stylesId = "virtual:atlas-styles.css";
const resolvedStylesId = `\0${stylesId}`;

const styles = String.raw`
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html { min-width: 320px; background: #071b2d; }
  body { min-width: 320px; min-height: 100vh; margin: 0; }
  button, input { font: inherit; }
  ::selection { color: #061827; background: #67d7dc; }
}

@layer components {
  .skip-link {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 20;
    border-radius: .35rem;
    padding: .65rem .9rem;
    background: #f0eadf;
    color: #071b2d;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-weight: 700;
    transform: translateY(-200%);
    transition: transform 150ms ease;
  }

  .skip-link:focus { transform: translateY(0); }

  .atlas-shell {
    min-height: 100vh;
    overflow: hidden;
    position: relative;
    isolation: isolate;
    color: #f0eadf;
    background:
      radial-gradient(circle at 50% -12%, rgba(46, 131, 149, .25), transparent 34rem),
      radial-gradient(circle at 10% 100%, rgba(28, 86, 112, .18), transparent 28rem),
      #071b2d;
  }

  .atlas-shell::before,
  .atlas-shell::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: .35;
  }

  .atlas-shell::before {
    background-image:
      radial-gradient(circle, rgba(222, 211, 190, .75) 0 1px, transparent 1.6px),
      radial-gradient(circle, rgba(86, 204, 211, .42) 0 1px, transparent 1.4px);
    background-position: 0 0, 35px 27px;
    background-size: 91px 91px, 137px 137px;
    mask-image: radial-gradient(circle at 50% 42%, transparent 5%, #000 78%);
  }

  .atlas-shell::after {
    background:
      linear-gradient(128deg, transparent 49.92%, rgba(208, 194, 168, .14) 50%, transparent 50.08%),
      repeating-radial-gradient(ellipse at 50% 42%, transparent 0 10rem, rgba(208, 194, 168, .07) 10.05rem 10.1rem, transparent 10.15rem 17rem);
  }

  .atlas-search {
    width: 100%;
    border: 1px solid rgba(226, 216, 198, .58);
    border-radius: .75rem;
    background: rgba(3, 17, 30, .5);
    color: #f7f1e8;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .025), 0 1rem 3rem rgba(0, 8, 18, .2);
    transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .atlas-search:hover { border-color: rgba(226, 216, 198, .82); }
  .atlas-search:focus-within {
    border-color: #67d7dc;
    background: rgba(3, 17, 30, .72);
    box-shadow: 0 0 0 3px rgba(103, 215, 220, .2), 0 1rem 3rem rgba(0, 8, 18, .28);
  }

  .field-chip {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    border: 1px solid rgba(181, 190, 190, .48);
    border-radius: 999px;
    padding: .55rem .9rem;
    background: rgba(5, 24, 40, .52);
    color: #c5cdd0;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: .8rem;
    line-height: 1;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease, box-shadow 150ms ease;
  }

  .field-chip:hover:not(:disabled) {
    border-color: rgba(103, 215, 220, .72);
    color: #f2eee5;
  }

  .field-chip:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(103, 215, 220, .22);
  }

  .field-chip-selected {
    border-color: #67d7dc;
    background: rgba(30, 129, 145, .28);
    color: #a3edf0;
  }

  .field-chip:disabled { cursor: wait; opacity: .55; }

  .surprise-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .7rem;
    min-width: 13rem;
    border: 1px solid #8de5e8;
    border-radius: .65rem;
    padding: .8rem 1.25rem;
    background: #43b9c2;
    color: #041925;
    box-shadow: 0 .7rem 2.5rem rgba(23, 154, 168, .2), inset 0 1px 0 rgba(255, 255, 255, .35);
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: .01em;
    transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
  }

  .surprise-button:hover:not(:disabled) {
    background: #65d3d9;
    box-shadow: 0 .9rem 3rem rgba(23, 154, 168, .3), inset 0 1px 0 rgba(255, 255, 255, .42);
    transform: translateY(-1px);
  }

  .surprise-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(103, 215, 220, .25), 0 .9rem 3rem rgba(23, 154, 168, .3);
  }

  .surprise-button:disabled { cursor: wait; opacity: .48; }

  .question-card {
    position: relative;
    border: 1px solid rgba(215, 203, 181, .38);
    background: rgba(5, 24, 40, .68);
    box-shadow: 0 1.75rem 5rem rgba(0, 8, 18, .2), inset 0 1px 0 rgba(255, 255, 255, .025);
  }

  .question-card::before,
  .question-card::after {
    content: "";
    position: absolute;
    left: 50%;
    width: 3.5rem;
    height: 1px;
    background: #d7cbb5;
    opacity: .55;
    transform: translateX(-50%);
  }

  .question-card::before { top: -1px; }
  .question-card::after { bottom: -1px; }

  .question-settle {
    animation: question-settle 520ms cubic-bezier(.2, .72, .2, 1) both;
  }
}

@keyframes question-settle {
  from { opacity: 0; transform: translateY(.8rem); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@media (prefers-reduced-motion: reduce) {
  .question-settle { animation: none; }
  .field-chip,
  .surprise-button,
  .atlas-search,
  .skip-link { transition: none; }
}
`;

function licensesAssetPlugin() {
  const source = readFileSync(new URL("./LICENSES.md", import.meta.url), "utf8");

  return {
    name: "atlas-data-licenses",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?", 1)[0];

        if (
          pathname !== "/LICENSES.md" &&
          pathname !== "/open-questions-atlas/LICENSES.md"
        ) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "text/markdown; charset=utf-8");
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "LICENSES.md", source });
    },
  };
}

export default defineConfig({
  base: "/open-questions-atlas/",
  plugins: [
    {
      name: "atlas-tailwind-styles",
      resolveId(id) {
        return id === stylesId ? resolvedStylesId : null;
      },
      load(id) {
        return id === resolvedStylesId ? styles : null;
      },
    },
    licensesAssetPlugin(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ["./index.html", "./src/**/*.{js,jsx}"],
        }),
      ],
    },
  },
  test: {
    environment: "node",
    includeSource: ["src/**/*.{js,jsx}"],
  },
});
