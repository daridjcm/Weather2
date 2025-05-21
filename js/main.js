// Option Component (no changes needed here)
function fetchCSV() {
    fetch('../city_coordinates.csv')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\n').slice(1);
            const selectElement = document.getElementById('city-select');

            rows.forEach(row => {
                const cols = row.split(',');
                if (cols.length === 4) { // Ensure the row has exactly 4 columns
                    const option = document.createElement('option');
                    option.value = `${cols[0]},${cols[1]}`; // Use lon, lat as value
                    option.textContent = `${cols[2]}, ${cols[3]}`; // Display City, Country
                    selectElement.appendChild(option);
                }
            });
            selectElement.addEventListener('change', (event) => {
                const selectedValue = event.target.value;
                const [lon, lat] = selectedValue.split(',');
                getWeatherData(lon, lat);
            });
            console.log(data);
        })
        .catch(error => console.error('Error fetching or parsing CSV:', error));
}

// Call the function to fetch and display CSV data
fetchCSV();

// Card Component (no changes needed here)
function createCard(title, imageSrc, details) {
    // Create elements from the DOM
    const card = document.createElement('div');
    const header = document.createElement('div');
    const body = document.createElement('div');
    const footer = document.createElement('div');
    const image = document.createElement('img');
    const detailsList = document.createElement('ul');

    // Set attributes and classes
    card.classList.add('card');
    header.classList.add('card-header');
    body.classList.add('card-body');
    footer.classList.add('card-footer');

    // Set content
    header.textContent = title;
    image.src = imageSrc;
    image.alt = 'Weather Icon';

    // Create list items for details
    details.forEach(detail => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
        detailsList.appendChild(listItem);
    });

    // Append elements to the card
    body.appendChild(image);
    body.appendChild(detailsList); // Append the list to the body
    card.appendChild(header);
    card.appendChild(body);
    // Optionally append footer if needed
    // card.appendChild(footer);

    const container = document.getElementById('card-container');
    if (container) {
        container.appendChild(card);
    } else {
        alert('Element with id "card-container" not found.');
    }
}

function getWeatherData(lon, lat) {
    const url = `http://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Weather Data (civil):', JSON.stringify(data, null, 2));

            // Clear previous forecast cards
            const container = document.getElementById('card-container');
            container.innerHTML = '';

            const initTimeStr = data.init; // e.g., "2025052018"
            const year = parseInt(initTimeStr.slice(0, 4));
            const month = parseInt(initTimeStr.slice(4, 6)) - 1; // Month is 0-indexed
            const day = parseInt(initTimeStr.slice(6, 8));
            const hour = parseInt(initTimeStr.slice(8, 10));

            const initDate = new Date(year, month, day, hour);

            data.dataseries.slice(0, 7).forEach(item => {
                const timePoint = item.timepoint;
                const forecastDate = new Date(initDate);
                forecastDate.setHours(initDate.getHours() + (timePoint * 3)); // Each timepoint is 3 hours

                const formattedDate = forecastDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
                const data = item;
                const windSpeedKmH = (item.wind10m.speed * 3.6).toFixed(1);

                const iconUrl = getWeatherIconUrl(data);

                const details = [
                    { label: 'Temperature', value: `${item.temp2m}°C` },
                    { label: 'Weather', value: item.weather },
                    { label: 'Wind', value: `${item.wind10m.direction} at ${windSpeedKmH} km/h` },
                    { label: 'Humidity', value: `${item.rh2m}%` },
                ];

                createCard(`${formattedDate}`, iconUrl, details);
            });
        })
        .catch(error => console.error('Error fetching weather data (civil):', error));
}

function getWeatherIconUrl(weatherData) {
    let { cloudcover, precipitation_rate, humidity, lifted_index, wind_speed } = weatherData;
    let iconUrl = '';

    console.log('Cloud Cover:', cloudcover);
    console.log('Weather Data:', weatherData);

    // Determine the icon based on conditions
    if (cloudcover < 20) {
        iconUrl = '/images/clear.png';
    } else if (cloudcover >= 20 && cloudcover < 60) {
        iconUrl = '/images/pcloudy.png';
    } else if (cloudcover >= 60 && cloudcover < 80) {
        if (precipitation_rate < 4) {
            iconUrl = '/images/cloudy.png'; // Cloudy
        } else {
            iconUrl = '/images/oshower.png'; // Occasional Showers
        }
    } else if (cloudcover >= 80) {
        if (precipitation_rate < 4) {
            iconUrl = '/images/fog.png'; // Foggy
        } else {
            iconUrl = '/images/lightrain.png'; // Light Rain or Showers
        }
    }

    // Handle precipitation scenarios
    if (precipitation_rate >= 4) {
        if (humidity > 90) {
            iconUrl = '/images/rainsnow.png'; // Mixed
        } else {
            iconUrl = '/images/rain.png'; // Rain
        }
    }

    // Handle snow
    if (precipitation_rate >= 4 && weatherData.isSnow) {
        iconUrl = '/images/snow.png'; // Snow
    }

    // Handle thunderstorms
    if (lifted_index < -5) {
        if (precipitation_rate > 4) {
            iconUrl = '/images/tsrain.png'; // Thunderstorm
        } else {
            iconUrl = '/images/tstorm.png'; // Thunderstorm Possible
            
        }
    }

    // Handle windy conditions
    if (wind_speed > 10.8) {
        iconUrl = '/images/windy.png'; // Windy
    }

    return iconUrl;
}
