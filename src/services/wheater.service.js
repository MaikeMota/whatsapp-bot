const OPEN_WHEATER_KEY = process.env.OPEN_WHEATER_KEY;

async function getWheater(city) {
    const result = await fetch(`https://api.openweathermap.org/data/2.5/forecast?APPID=${OPEN_WHEATER_KEY}&q=${city}&mode=json&units=metric&lang=PT`).then(r => r.json());
    if (result.cod === '200') {
        const [today] = result.list;
        const { temp, temp_min, temp_max, humidity, feels_like } = today.main;
        return { temp, temp_min, temp_max, humidity, feels_like };
    }
    return null;
}

module.exports = { getWheater }
