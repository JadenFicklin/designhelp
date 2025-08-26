const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage
let items = [];
let looseAssets = [];
let categories = [
  { id: 'root', name: 'Root', parentId: null, children: [] }
];

// Helper function to generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to build categories tree
const buildCategoriesTree = () => {
  const categoryMap = new Map();
  
  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });
  
  // Second pass: build tree structure
  const tree = [];
  categoryMap.forEach(category => {
    if (category.parentId === null) {
      tree.push(category);
    } else {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(category);
      }
    }
  });
  
  return tree;
};

// Helper function to get all descendant category IDs
const getDescendantCategoryIds = (categoryId) => {
  const descendants = [];
  const category = categories.find(c => c.id === categoryId);
  
  if (category) {
    descendants.push(categoryId);
    const children = categories.filter(c => c.parentId === categoryId);
    children.forEach(child => {
      descendants.push(...getDescendantCategoryIds(child.id));
    });
  }
  
  return descendants;
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all items
app.get('/api/items', (req, res) => {
  const { query, category, tags } = req.query;
  
  let filteredItems = [...items];
  
  // Filter by search query
  if (query) {
    const searchTerm = query.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Filter by category (including descendants)
  if (category) {
    const descendantIds = getDescendantCategoryIds(category);
    filteredItems = filteredItems.filter(item => 
      item.categories.some(cat => descendantIds.includes(cat))
    );
  }
  
  // Filter by tags
  if (tags) {
    const tagArray = tags.split(',');
    filteredItems = filteredItems.filter(item => 
      tagArray.some(tag => item.tags.includes(tag))
    );
  }
  
  res.json(filteredItems);
});

// Export items as JSON
app.get('/api/items/export', (req, res) => {
  const exportData = {
    version: '1.0',
    items: items
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=design-vault-export.json');
  res.json(exportData);
});

// Get single item
app.get('/api/items/:id', (req, res) => {
  const item = items.find(item => item.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// Create item
app.post('/api/items', (req, res) => {
  const newItem = {
    id: generateId(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const index = items.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  items[index] = {
    ...items[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(items[index]);
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  items.splice(index, 1);
  res.status(204).send();
});

// Import items
app.post('/api/items/import', (req, res) => {
  const { version, items: importedItems } = req.body;
  
  if (!importedItems || !Array.isArray(importedItems)) {
    return res.status(400).json({ error: 'Invalid import format' });
  }
  
  const processedItems = importedItems.map(item => ({
    id: generateId(),
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  items = processedItems;
  
  res.json({ 
    message: `Imported ${processedItems.length} items`,
    count: processedItems.length 
  });
});

// Ingest asset metadata
app.post('/api/assets/ingest', (req, res) => {
  const asset = {
    id: generateId(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  looseAssets.push(asset);
  res.status(201).json(asset);
});

// Get categories tree
app.get('/api/categories/tree', (req, res) => {
  res.json(buildCategoriesTree());
});

// Get all categories (flat list)
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Create category
app.post('/api/categories', (req, res) => {
  const { name, parentId } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  const newCategory = {
    id: generateId(),
    name,
    parentId: parentId || null,
    createdAt: new Date().toISOString()
  };
  
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

// Update category
app.put('/api/categories/:id', (req, res) => {
  const { name, parentId } = req.body;
  const index = categories.findIndex(cat => cat.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  categories[index] = {
    ...categories[index],
    name: name || categories[index].name,
    parentId: parentId !== undefined ? parentId : categories[index].parentId,
    updatedAt: new Date().toISOString()
  };
  
  res.json(categories[index]);
});

// Delete category
app.delete('/api/categories/:id', (req, res) => {
  const categoryId = req.params.id;
  
  // Check if category exists
  const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // Check if category has children
  const hasChildren = categories.some(cat => cat.parentId === categoryId);
  if (hasChildren) {
    return res.status(400).json({ error: 'Cannot delete category with children' });
  }
  
  // Check if category is used by any items
  const isUsed = items.some(item => item.categories.includes(categoryId));
  if (isUsed) {
    return res.status(400).json({ error: 'Cannot delete category that is used by items' });
  }
  
  categories.splice(categoryIndex, 1);
  res.status(204).send();
});

// Grade flashcards
app.post('/api/flashcards/grade', (req, res) => {
  // For now, just acknowledge the grade
  // Later this could store progress in a database
  res.json({ message: 'Grade recorded' });
});

// Seed with sample data
app.get('/api/dev/seed', (req, res) => {
  // Reset categories to default
  categories = [
    { id: 'root', name: 'Root', parentId: null, children: [] },
    { id: 'materials', name: 'Materials', parentId: 'root', children: [] },
    { id: 'cabinetry', name: 'Cabinetry', parentId: 'materials', children: [] },
    { id: 'countertops', name: 'Countertops', parentId: 'materials', children: [] },
    { id: 'notes', name: 'Notes', parentId: 'root', children: [] }
  ];
  
  const sampleData = {
    version: '1.0',
    items: [
      {
        name: 'White Oak – Shaker Door',
        kind: 'material',
        description: 'Rift-sawn white oak with clear finish',
        dimensions: { thickness: 0.75, unit: 'in' },
        attributes: { species: 'white oak', finish: 'clear', grade: 'select' },
        cost: 85,
        currency: 'USD',
        categories: ['cabinetry'],
        tags: ['white-oak', 'shaker'],
        assets: [
          { 
            id: generateId(),
            kind: 'image', 
            url: 'https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg', 
            alt: 'Door panel',
            width: 800,
            height: 600
          }
        ]
      },
      {
        name: 'Quartz Countertop – Calacatta',
        kind: 'material',
        description: 'Calacatta pattern quartz slab',
        dimensions: { thickness: 1.25, unit: 'in' },
        attributes: { brand: 'Generic', color: 'white/gray' },
        cost: 55,
        currency: 'USD',
        categories: ['countertops'],
        tags: ['quartz'],
        assets: [
          { 
            id: generateId(),
            kind: 'image', 
            url: 'https://res.cloudinary.com/demo/image/upload/w_800/bench.jpg', 
            alt: 'Quartz slab',
            width: 800,
            height: 600
          }
        ]
      },
      {
        name: 'Note – Base Cabinet Heights',
        kind: 'text',
        description: 'Base 34.5 in box height. 36 in to countertop. Toe kick 4 in.',
        dimensions: {},
        attributes: {},
        cost: null,
        currency: 'USD',
        categories: ['notes'],
        tags: ['dimensions'],
        assets: []
      }
    ]
  };
  
  items = sampleData.items.map(item => ({
    id: generateId(),
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  res.json({ 
    message: `Seeded ${items.length} items and ${categories.length} categories`,
    count: items.length 
  });
});

app.listen(PORT, () => {
  console.log(`Design Vault API server running on http://localhost:${PORT}`);
});
