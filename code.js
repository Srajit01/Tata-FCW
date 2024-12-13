const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serves static frontend files

// Database Setup
let db;
(async () => {
    db = await open({
        filename: './data.db',
        driver: sqlite3.Database
    });
    await db.exec('CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY, requirements TEXT, code TEXT);');
})();

// Routes
app.post('/generate', async (req, res) => {
    const { requirements } = req.body;

    if (!requirements) {
        return res.status(400).json({ error: 'Requirements are required.' });
    }

    try {
        // Simulating GenAI Code Generation API
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_API_KEY`, // Replace YOUR_API_KEY with the OpenAI API Key
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: `Generate source code based on these requirements: ${requirements}`,
                max_tokens: 150,
            }),
        });

        const result = await response.json();
        const code = result.choices[0]?.text || 'Error generating code.';

        // Save to database
        await db.run('INSERT INTO submissions (requirements, code) VALUES (?, ?)', [requirements, code]);

        res.json({ code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate code.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
