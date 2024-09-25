const axios = require('axios');
const pool = require('./db');

// запрос к api.github
async function fetchTrendingRepositories() {
    console.log(`вызов...`)
    try {
        const response = await axios.get('https://api.github.com/search/repositories?q=stars:>1+language:javascript&sort=stars&order=desc');
        const repositories = response.data.items;
        console.log('Трендовые репозитории:', repositories);
        await saveRepositoriesToDB(repositories);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
    }
}

// сохранение в бд
async function saveRepositoriesToDB(repositories) {
    console.log(`сохранение в базу...`)
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const repo of repositories) {
            const queryText = `
                INSERT INTO repositories (id, name, full_name, html_url, description, stargazers_count)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING;
            `;
            const values = [repo.id, repo.name, repo.full_name, repo.html_url, repo.description, repo.stargazers_count];
            await client.query(queryText, values);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка при сохранении данных:', error);
    } finally {
        client.release();
    }
}

const interval = 30 * 60 * 1000;

fetchTrendingRepositories();
setInterval(fetchTrendingRepositories, interval);
module.exports = fetchTrendingRepositories;
