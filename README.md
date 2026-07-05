# TileStock Pro

<img width="1240" height="699" alt="image" src="https://github.com/user-attachments/assets/ccd75336-5b2a-4cf3-b370-b3f5d234d218" />

<img width="1021" height="694" alt="image" src="https://github.com/user-attachments/assets/dc6f055d-bb2d-4679-8e41-30e57889b17a" />



An browser based quantitative market website designed to simulate a professional trading environment. This project was built for **#horizons**!
**AI Declaration:** There were bugs in my website which I was not able to find. So I used AI to help me fix them and to create the stock verdict. Whether the stock should be sold or bought, to tell me how i can improve the aesthetics of my website. That being said, while i took improvement help from AI I coded this website on my own. I just have never been that good with aesthetics or design.

### What my terminal Does

A fully interactive financial dashboard that combines real-time data, algorithmic analysis, and trading simulators all in one interface.

It includes five main modules:

1. **Live Market Dashboard:** Real-time stock prices powered by the Finnhub API, complete with historical metrics, fundamental data, FX cross-rates, and Wall Street analyst consensus.
2. **Algorithmic Verdict Engine:** A built-in quant engine that calculates volatility risk and issues "Accumulate / Hold / Liquidate" verdicts based on technical pricing indicators.
3. **Paper Trading & Portfolio:** A functional trading simulator where users can execute live market buys/sells with a $10,000 virtual balance and track their active holdings.
4. **AI News Sentiment:** A live intelligence feed that scrapes recent corporate news and uses a heuristic NLP algorithm to automatically flag headlines as Bullish, Bearish, or Neutral.
5. **Terminal Arcade:** Two integrated mini-games—a Day Trader canvas simulator and a Corporate Raider idle clicker—built right into the welcome screen.

**Bonus Features:**

* **Smart NLP Search:** Type a company name (e.g., "Nvidia" or "Tesla") and the engine automatically intercepts the query to find the correct market ticker (NVDA/TSLA).
* **Terminal Color Themes:** Toggle between four professional visual styles: Pro Dark, Matrix Grid, Bloomberg Amber, and Miami Vice.
* **Persistent Memory:** Your search history logs, paper trading balance, active portfolio, and starred watchlists are saved directly to your browser's local storage so they are always there when you return.

### How to Use It

**To use it locally:**

1. Clone or download this repository to your computer.
2. Double-click the `index.html` file to open it in any modern web browser (Chrome, Safari, Firefox, etc.).
3. Start analyzing the markets!

**To use the site (link):**
https://tile-stock-eight.vercel.app/

Search your stock in the search bar:

<img width="469" height="119" alt="image" src="https://github.com/user-attachments/assets/ee4e890f-6f02-4beb-a974-1a7434d79ab9" />

Play the games:

<img width="1001" height="522" alt="image" src="https://github.com/user-attachments/assets/92dd6f5f-c1bc-48b0-a3b7-69510149729e" />
<img width="952" height="345" alt="image" src="https://github.com/user-attachments/assets/b0ac3837-1bb3-4a16-854c-6d21203cad9b" />

Change themes:

<img width="139" height="119" alt="image" src="https://github.com/user-attachments/assets/980928b5-26c6-473d-8f32-99a4269d06cb" />








### How It Works

This project is built entirely from scratch using the core languages of the web, with zero external frontend framework dependencies:

* **HTML:** Structures the complex dashboard grid, slide-out sidebars, data tiles, and arcade interfaces.
* **CSS:** Heavily utilizes **CSS Grid** to create a responsive tile layout that adapts to screen sizes. It features advanced styling for dynamic bar charts, risk meters, real-time price flash animations, and CSS-variable-based theme switching.
* **JavaScript:** The quantitative brain of the app. It handles API logic (fetching from 6 Finnhub endpoints simultaneously), calculates paper trading P&L logic, parses NLP searches, generates HTML5 Canvas graphics, and manages persistent state via the browser's `localStorage` API.
