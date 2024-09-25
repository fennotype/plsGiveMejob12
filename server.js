const express = require(`express`);
const pool = require(`./db`);
const app = express();
const port = 3000;
const fetchTrendingRepositories = require('./Repos');

app.get('/repositories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM repositories');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching repositories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/repositories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM repositories WHERE id = $1 OR name = $2', [id, id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Repository not found' });
        }
    } catch (error) {
        console.error('Error fetching repository:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/sync', async (req, res) => {
    try {
        await fetchTrendingRepositories();
        res.json({ message: 'Synchronization started' });
    } catch (error) {
        console.error('Error starting synchronization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
let syncInterval;

const startSyncInterval = () => {
    clearInterval(syncInterval);
    syncInterval = setInterval(fetchTrendingRepositories, 30 * 60 * 1000); // 30 минут
};
app.post('/force-sync', async (req, res) => {
    try {
        startSyncInterval();
        await fetchTrendingRepositories();
        res.json({ message: 'Forced synchronization started and timer reset' });
    } catch (error) {
        console.error('Error forcing synchronization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
startSyncInterval();


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}/repositories`);
});