import express from 'express';
import openaiRoutes from './routes/openai.mjs';

const app = express();

const PORT = process.env.PORT || 8080;

// Body parsing middleware
app.use(express.json({ limit: '5mb' }));

app.use(express.static('public'));

// Mount the router at a base path
app.use('/openai', openaiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});