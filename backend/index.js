const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;
const DATA_FILE = path.join(__dirname, 'data.json');

function loadCollections() {
    if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE);
        return JSON.parse(raw);
    }
    return [];
}

function saveCollections(collections) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(collections, null, 2));
}

let collections = loadCollections();

app.get('/api/collections', (req, res) => {
    res.json(collections);
});

app.get('/api/collections/:id', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    res.json(collection);
});

app.post('/api/collections', (req, res) => {
    const newCollection = {
        id: Date.now().toString(),
        name: req.body.name || 'Untitled Collection',
        images: []
    };
    collections.push(newCollection);
    saveCollections(collections);
    res.status(201).json(newCollection);
});



app.put('/api/collections/:id', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    collection.name = req.body.name ?? collection.name;

    saveCollections(collections);
    res.json(collection);
});



app.post('/api/collections/:id/images', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const newImage = {
        id: Date.now().toString(),
        url: req.body.url,
        tags: req.body.tags || '',
        note: req.body.note || ''
    };
    collection.images.push(newImage);
    saveCollections(collections);
    res.status(201).json(newImage);
});

app.put('/api/collections/:id/images/:imageId', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const image = collection.images.find(img => img.id === req.params.imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    image.note = req.body.note ?? image.note;
    image.tags = req.body.tags ?? image.tags;
    saveCollections(collections);
    res.json(image);
});

app.delete('/api/collections/:id/images/:imageId', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    collection.images = collection.images.filter(img => img.id !== req.params.imageId);
    saveCollections(collections);
    res.json({ success: true });
});

app.delete('/api/collections/:id', (req, res) => {
    const collection = collections.find(c => c.id === req.params.id);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    collections = collections.filter(c => c.id !== req.params.id);
    saveCollections(collections);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});