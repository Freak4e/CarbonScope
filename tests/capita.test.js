/**
 * @jest-environment jsdom
 */

describe('Per Capita CO2 Charts', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        // Minimal DOM setup
        document.body.innerHTML = `
            <div id="loadingIndicator"></div>
            <div id="contentContainer" style="display: none;"></div>
            <span id="avgEmissions"></span>
            <span id="medianEmissions"></span>
            <span id="changeEmissions"></span>
            <span id="cumulativeEmissions"></span>
            <canvas id="trend_chart"></canvas>
            <canvas id="comparisonChart"></canvas>
            <canvas id="rollingAverageChart"></canvas>
            <canvas id="yearlyChangeChart"></canvas>
            <canvas id="cumulativeChart"></canvas>
            <button id="playButton" class="btn-primary"><i class="fas fa-play"></i> Predvajaj</button>
            <button id="stopButton" disabled></button>
        `;

        // Mock fetch
        global.fetch = jest.fn((url) => {
            if (url.includes('/api/emissions?country=Slovenia')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        { year: 1991, co2_per_capita: 10.0, population: 2000000, gdp: 25000000000 },
                        { year: 1992, co2_per_capita: 9.5, population: 2000000, gdp: 26000000000 },
                        { year: 2022, co2_per_capita: 6.0, population: 2000000, gdp: 55000000000 },
                    ]),
                });
            }
            if (url.includes('/api/emissions?country=European+Union+%2827%29')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ year: 2022, co2_per_capita: 6.4 }]),
                });
            }
            if (url.includes('/api/emissions?country=World')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ year: 2022, co2_per_capita: 4.7 }]),
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        // Mock Chart.js
        global.Chart = jest.fn((ctx, config) => ({
            ctx,
            config,
            data: {
                labels: config.data.labels || [],
                datasets: config.data.datasets || [],
            },
            options: config.options || {},
            update: jest.fn(),
            destroy: jest.fn(),
        }));

        // Mock canvas context
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));

        // Mock Blob and URL
        global.Blob = jest.fn(() => ({}));
        global.URL = {
            createObjectURL: jest.fn(() => 'blob://test'),
            revokeObjectURL: jest.fn(),
        };

        // Mock console.error
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock alert
        jest.spyOn(window, 'alert').mockImplementation(() => {});

        // Clear mocks to prevent interference
        jest.clearAllMocks();

        // Load capita.js
        require('../public/js/capita.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy.mockRestore();
        window.alert.mockRestore();
        jest.useRealTimers();
    });

 

    test('handles fetch errors', async () => {
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Fetch failed')));
        await window.initializePerCapitaCharts();

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing charts:', expect.any(Error));
        expect(document.getElementById('loadingIndicator').innerHTML).toContain('Napaka: Fetch failed');
    });

    test('uses fallback data when API returns empty', async () => {
        global.fetch.mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
        await window.initializePerCapitaCharts();

        expect(global.Chart).toHaveBeenCalledTimes(5);
        const trendChart = global.Chart.mock.results[0].value;
        expect(trendChart.data.datasets[0].data[0]).toBe(10.0);
        expect(trendChart.data.labels.length).toBe(33);
        expect(trendChart.data.datasets[0].data[0]).toBe(10.0);
    });

    test('toggles animation with play button', async () => {
        await window.initializePerCapitaCharts();
        const playButton = document.getElementById('playButton');
        const stopButton = document.getElementById('stopButton');
        const trendChart = global.Chart.mock.results[0].value;

        jest.useFakeTimers();
        playButton.click();
        expect(playButton.innerHTML).toBe('<i class="fas fa-pause"></i> Zaustavi');
        expect(playButton.classList.contains('btn-warning')).toBe(true);
        expect(stopButton.disabled).toBe(false);

        jest.advanceTimersByTime(5000 / 3);
        expect(trendChart.data.labels).toEqual([1991, 1992]);

        playButton.click();
        expect(playButton.innerHTML).toBe('<i class="fas fa-play"></i> Predvajaj');
        expect(stopButton.disabled).toBe(true);
        expect(trendChart.data.labels).toEqual([1991, 1992, 2022]);
    });

    test('stops animation with stop button', async () => {
        await window.initializePerCapitaCharts();
        const playButton = document.getElementById('playButton');
        const stopButton = document.getElementById('stopButton');
        const trendChart = global.Chart.mock.results[0].value;

        jest.useFakeTimers();
        playButton.click();
        stopButton.click();

        expect(playButton.innerHTML).toBe('<i class="fas fa-play"></i> Predvajaj');
        expect(stopButton.disabled).toBe(true);
        expect(trendChart.data.labels).toEqual([1991, 1992, 2022]);
    });

    test('downloads CSV with data', async () => {
        await window.initializePerCapitaCharts();
        await window.downloadPerCapitaSloCSV();

        expect(global.Blob).toHaveBeenCalledWith(
            expect.arrayContaining([expect.stringContaining('Leto,CO2_na_prebivalca_t\n1991,10.00\n1992,9.50\n2022,6.00')]),
            expect.any(Object)
        );
        expect(URL.createObjectURL).toHaveBeenCalled();
    });

    test('shows alert when downloading CSV with no data', async () => {
        // Mock empty data with invalid entries
        global.fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ year: 1991, co2_per_capita: undefined }])
        }));
        await window.initializePerCapitaCharts();
        await window.downloadPerCapitaSloCSV();

        expect(window.alert).toHaveBeenCalledWith('Podatki še niso naloženi ali so neveljavni. Počakajte trenutek in poskusite znova.');
        expect(global.Blob).not.toHaveBeenCalled();
    });
});