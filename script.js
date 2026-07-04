const API_KEY = 'd94ch4pr01qj2cibo1pgd94ch4pr01qj2cibo1q0';


const searchBtn = document.getElementById('searchBtn');
const tickerInput = document.getElementById('tickerInput');
const dashboard = document.getElementById('dashboard');
const welcomeState = document.getElementById('welcomeState');
const historyPanel = document.getElementById('historyPanel');
const portfolioPanel = document.getElementById('portfolioPanel');
const historyList = document.getElementById('historyList');



let searchHistory = JSON.parse(localStorage.getItem('tileStockHistory')) || [];
let paperBalance = parseFloat(localStorage.getItem('tileStockBalance')) || 10000.00;
let paperHoldings = JSON.parse(localStorage.getItem('tileStockHoldings')) || {};
let watchlist = JSON.parse(localStorage.getItem('tileStockWatchlist')) || [];


let currentTicker = '';
let currentAssetPrice = 0;
let liveWs = null;
let currentWsTicker = '';



document.getElementById('themeSelector').addEventListener('change', (e) => {
    document.body.className = '';
    if(e.target.value !== 'default') {
        document.body.classList.add(`theme-${e.target.value}`);
    }
});


window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('introScreen').classList.add('fade-out');
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.classList.remove('hidden');
        setTimeout(() => mainContainer.classList.add('visible'), 50);


        initTraderGame();
        initClickerGame();
        updateHistoryUI();
        updatePortfolioUI();
    }, 1500);
});



document.getElementById('navHomeBtn').addEventListener('click', returnHome);
document.getElementById('brandLogo').addEventListener('click', returnHome);


function returnHome() {
    dashboard.classList.add('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
    welcomeState.classList.remove('hidden');
    document.getElementById('navHomeBtn').classList.add('active');
    document.getElementById('navPortfolioBtn').classList.remove('active');
    historyPanel.classList.remove('open');
    portfolioPanel.classList.remove('open');
    tickerInput.value = '';
}



document.getElementById('navHistoryBtn').addEventListener('click', () => { historyPanel.classList.add('open'); portfolioPanel.classList.remove('open'); });
document.getElementById('closeHistoryBtn').addEventListener('click', () => historyPanel.classList.remove('open'));
document.getElementById('navPortfolioBtn').addEventListener('click', () => { portfolioPanel.classList.add('open'); historyPanel.classList.remove('open'); });
document.getElementById('closePortfolioBtn').addEventListener('click', () => portfolioPanel.classList.remove('open'));
document.getElementById('clearHistoryBtn').addEventListener('click', () => { searchHistory = []; localStorage.removeItem('tileStockHistory'); updateHistoryUI(); });


document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => { tickerInput.value = chip.getAttribute('data-ticker'); searchBtn.click(); });
});


document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-view').forEach(v => v.classList.add('hidden'));
        e.target.classList.add('active');
        document.getElementById(e.target.getAttribute('data-target')).classList.remove('hidden');
    });
});

