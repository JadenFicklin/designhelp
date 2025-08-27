import { 
  ref, 
  get, 
  set, 
  update, 
  remove
} from 'firebase/database';
import { database, itemsRef, categoriesRef, assetsRef, flashcardsRef } from './firebase';

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to convert Firebase snapshot to array
const snapshotToArray = (snapshot) => {
  if (!snapshot.exists()) {
    return [];
  }
  
  const array = [];
  snapshot.forEach((childSnapshot) => {
    const item = {
      id: childSnapshot.key,
      ...childSnapshot.val()
    };
    array.push(item);
  });
  return array;
};

// Items API
export const itemsApi = {
  // Get all items with optional filters
  getItems: async (filters = {}) => {
    try {
      const snapshot = await get(ref(database, itemsRef()));
      let items = snapshotToArray(snapshot);
      
      // Apply filters in combination
      if (filters.query) {
        items = items.filter(item => 
          item.name?.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.description?.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()))
        );
      }
      
      if (filters.category && filters.category !== 'global') {
        items = items.filter(item => 
          item.categories?.includes(filters.category)
        );
      }
      
      if (filters.tags) {
        const selectedTags = filters.tags.split(',');
        items = items.filter(item => 
          item.tags?.some(tag => selectedTags.includes(tag))
        );
      }
      
      return items;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Get single item
  getItem: async (id) => {
    try {
      const snapshot = await get(ref(database, itemsRef(id)));
      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      throw new Error('Item not found');
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  },

  // Create new item
  createItem: async (itemData) => {
    try {
      const id = generateId();
      const newItem = {
        ...itemData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(ref(database, itemsRef(id)), newItem);
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update item
  updateItem: async (id, itemData) => {
    try {
      const updates = {
        ...itemData,
        updatedAt: new Date().toISOString()
      };
      
      await update(ref(database, itemsRef(id)), updates);
      return { id, ...updates };
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete item
  deleteItem: async (id) => {
    try {
      await remove(ref(database, itemsRef(id)));
      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Export items
  exportItems: async () => {
    try {
      const snapshot = await get(ref(database, itemsRef()));
      const items = snapshotToArray(snapshot);
      return {
        version: '1.0',
        items
      };
    } catch (error) {
      console.error('Error exporting items:', error);
      throw error;
    }
  },

  // Import items
  importItems: async (data) => {
    try {
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid import data format');
      }

      // Clear existing items
      await remove(ref(database, itemsRef()));
      
      // Import new items
      const importPromises = data.items.map(item => {
        const id = generateId();
        const newItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return set(ref(database, itemsRef(id)), newItem);
      });

      await Promise.all(importPromises);
      return { count: data.items.length };
    } catch (error) {
      console.error('Error importing items:', error);
      throw error;
    }
  },

  // Seed data
  seedData: async () => {
    const seedItems = [
      {
        name: "White Oak – Shaker Door",
        kind: "material",
        description: "Rift-sawn white oak with clear finish",
        dimensions: { thickness: 0.75, unit: "in" },
        cost: 85,
        categories: ["cabinetry", "doors"],
        tags: ["white-oak", "shaker"],
        assets: [
          {
            kind: "image",
            url: "https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg",
            alt: "Door panel"
          }
        ]
      },
      {
        name: "Quartz Countertop – Calacatta",
        kind: "material",
        description: "Calacatta pattern quartz slab",
        dimensions: { thickness: 1.25, unit: "in" },
        cost: 55,
        categories: ["countertops"],
        tags: ["quartz"],
        assets: [
          {
            kind: "image",
            url: "https://res.cloudinary.com/demo/image/upload/w_800/bench.jpg",
            alt: "Quartz slab"
          }
        ]
      },
      {
        name: "Note – Base Cabinet Heights",
        kind: "text",
        description: "Base 34.5 in box height. 36 in to countertop. Toe kick 4 in.",
        dimensions: {},
        categories: ["notes"],
        tags: ["dimensions"],
        assets: []
      }
    ];

    try {
      // Clear existing items
      await remove(ref(database, itemsRef()));
      
      // Import seed items
      const importPromises = seedItems.map(item => {
        const id = generateId();
        const newItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return set(ref(database, itemsRef(id)), newItem);
      });

      await Promise.all(importPromises);
      return { count: seedItems.length };
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getAll: async () => {
    try {
      const snapshot = await get(ref(database, categoriesRef()));
      const categories = snapshotToArray(snapshot);
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get categories tree
  getTree: async () => {
    try {
      const snapshot = await get(ref(database, categoriesRef()));
      const categories = snapshotToArray(snapshot);
      
      // Build tree structure
      const buildTree = (parentId = null) => {
        return categories
          .filter(cat => cat.parentId === parentId || (parentId === null && !cat.parentId))
          .map(cat => ({
            ...cat,
            children: buildTree(cat.id)
          }));
      };
      
      return buildTree();
    } catch (error) {
      console.error('Error fetching categories tree:', error);
      throw error;
    }
  },

  // Create category
  create: async (categoryData) => {
    try {
      const id = generateId();
      const newCategory = {
        ...categoryData,
        id,
        parentId: categoryData.parentId || null,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, categoriesRef(id)), newCategory);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update category
  update: async (id, categoryData) => {
    try {
      await update(ref(database, categoriesRef(id)), categoryData);
      return { id, ...categoryData };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  delete: async (id) => {
    try {
      // Check if category has children
      const snapshot = await get(ref(database, categoriesRef()));
      const categories = snapshotToArray(snapshot);
      const hasChildren = categories.some(cat => cat.parentId === id);
      
      if (hasChildren) {
        throw new Error('Cannot delete category with subcategories');
      }
      
      // Check if category is used by any items
      const itemsSnapshot = await get(ref(database, itemsRef()));
      const items = snapshotToArray(itemsSnapshot);
      const isUsed = items.some(item => item.categories?.includes(id));
      
      if (isUsed) {
        throw new Error('Cannot delete category that is used by items');
      }
      
      await remove(ref(database, categoriesRef(id)));
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Seed default categories
  seedCategories: async () => {
    const defaultCategories = [
      {
        name: "Materials",
        parentId: null
      },
      {
        name: "Objects",
        parentId: null
      },
      {
        name: "Notes",
        parentId: null
      },
      {
        name: "Cabinetry",
        parentId: null
      },
      {
        name: "Countertops",
        parentId: null
      }
    ];

    try {
      // Check if categories already exist
      const snapshot = await get(ref(database, categoriesRef()));
      const existingCategories = snapshotToArray(snapshot);
      
      if (existingCategories.length > 0) {
        console.log('Categories already exist, skipping seed');
        return { count: existingCategories.length };
      }

      // Create default categories
      const createPromises = defaultCategories.map(category => {
        const id = generateId();
        const newCategory = {
          ...category,
          id,
          createdAt: new Date().toISOString()
        };
        return set(ref(database, categoriesRef(id)), newCategory);
      });

      await Promise.all(createPromises);
      return { count: defaultCategories.length };
    } catch (error) {
      console.error('Error seeding categories:', error);
      throw error;
    }
  }
};

// Assets API
export const assetsApi = {
  // Ingest asset (store metadata)
  ingest: async (assetData) => {
    try {
      const id = generateId();
      const newAsset = {
        ...assetData,
        id,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, assetsRef(id)), newAsset);
      return newAsset;
    } catch (error) {
      console.error('Error ingesting asset:', error);
      throw error;
    }
  }
};

// Flashcards API
export const flashcardsApi = {
  // Grade flashcard
  grade: async (gradeData) => {
    try {
      const id = generateId();
      const grade = {
        ...gradeData,
        id,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, flashcardsRef(id)), grade);
      return grade;
    } catch (error) {
      console.error('Error grading flashcard:', error);
      throw error;
    }
  },

  // Get flashcard progress for an item
  getProgress: async (itemId) => {
    try {
      const snapshot = await get(ref(database, flashcardsRef()));
      const grades = snapshotToArray(snapshot);
      const itemGrades = grades.filter(grade => grade.itemId === itemId);
      
      return {
        itemId,
        grades: itemGrades,
        totalReviews: itemGrades.length,
        again: itemGrades.filter(g => g.grade === 'again').length,
        good: itemGrades.filter(g => g.grade === 'good').length,
        easy: itemGrades.filter(g => g.grade === 'easy').length,
        lastSeen: itemGrades.length > 0 ? Math.max(...itemGrades.map(g => new Date(g.createdAt))) : null
      };
    } catch (error) {
      console.error('Error fetching flashcard progress:', error);
      throw error;
    }
  },

  // Get all flashcard progress
  getAllProgress: async () => {
    try {
      const snapshot = await get(ref(database, flashcardsRef()));
      const grades = snapshotToArray(snapshot);
      
      // Group by itemId
      const progressByItem = grades.reduce((acc, grade) => {
        if (!acc[grade.itemId]) {
          acc[grade.itemId] = {
            itemId: grade.itemId,
            grades: [],
            totalReviews: 0,
            again: 0,
            good: 0,
            easy: 0,
            lastSeen: null
          };
        }
        
        acc[grade.itemId].grades.push(grade);
        acc[grade.itemId].totalReviews++;
        acc[grade.itemId][grade.grade]++;
        
        const gradeDate = new Date(grade.createdAt);
        if (!acc[grade.itemId].lastSeen || gradeDate > new Date(acc[grade.itemId].lastSeen)) {
          acc[grade.itemId].lastSeen = grade.createdAt;
        }
        
        return acc;
      }, {});
      
      return Object.values(progressByItem);
    } catch (error) {
      console.error('Error fetching all flashcard progress:', error);
      throw error;
    }
  },

  // Get study statistics
  getStats: async () => {
    try {
      const snapshot = await get(ref(database, flashcardsRef()));
      const grades = snapshotToArray(snapshot);
      
      const stats = {
        totalGrades: grades.length,
        again: grades.filter(g => g.grade === 'again').length,
        good: grades.filter(g => g.grade === 'good').length,
        easy: grades.filter(g => g.grade === 'easy').length,
        uniqueItems: new Set(grades.map(g => g.itemId)).size,
        averageAccuracy: grades.length > 0 
          ? Math.round(((grades.filter(g => g.grade === 'good' || g.grade === 'easy').length) / grades.length) * 100)
          : 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching flashcard stats:', error);
      throw error;
    }
  },

  // Get items due for review (spaced repetition)
  getDueItems: async () => {
    try {
      const progress = await flashcardsApi.getAllProgress();
      const now = new Date();
      
      // Simple spaced repetition algorithm
      const dueItems = progress.filter(item => {
        if (!item.lastSeen) return true; // New items
        
        const lastSeen = new Date(item.lastSeen);
        const daysSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60 * 24);
        
        // Calculate interval based on performance
        const accuracy = item.totalReviews > 0 ? (item.good + item.easy) / item.totalReviews : 0;
        let interval = 1; // Default 1 day
        
        if (accuracy > 0.8) interval = 7; // Good performance: 1 week
        else if (accuracy > 0.6) interval = 3; // Moderate: 3 days
        else if (accuracy > 0.4) interval = 2; // Poor: 2 days
        // Very poor: 1 day (default)
        
        return daysSinceLastSeen >= interval;
      });
      
      return dueItems.map(item => item.itemId);
    } catch (error) {
      console.error('Error fetching due items:', error);
      throw error;
    }
  },

  // Save session statistics
  saveSessionStats: async (sessionData) => {
    try {
      const id = generateId();
      const sessionStats = {
        ...sessionData,
        id,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, `sessions/${id}`), sessionStats);
      return sessionStats;
    } catch (error) {
      console.error('Error saving session stats:', error);
      throw error;
    }
  },

  // Get session statistics
  getSessionStats: async () => {
    try {
      const snapshot = await get(ref(database, 'sessions'));
      const sessions = snapshotToArray(snapshot);
      
      // Calculate aggregated stats from all sessions
      const aggregatedStats = sessions.reduce((acc, session) => {
        acc.totalSessions++;
        acc.totalCards += session.totalCards || 0;
        acc.totalAgain += session.again || 0;
        acc.totalGood += session.good || 0;
        acc.totalEasy += session.easy || 0;
        acc.totalDuration += session.duration || 0;
        
        if (session.accuracy) {
          acc.accuracies.push(session.accuracy);
        }
        
        return acc;
      }, {
        totalSessions: 0,
        totalCards: 0,
        totalAgain: 0,
        totalGood: 0,
        totalEasy: 0,
        totalDuration: 0,
        accuracies: []
      });
      
      // Calculate average accuracy
      aggregatedStats.averageAccuracy = aggregatedStats.accuracies.length > 0
        ? Math.round(aggregatedStats.accuracies.reduce((sum, acc) => sum + acc, 0) / aggregatedStats.accuracies.length)
        : 0;
      
      // Calculate total accuracy
      const totalGrades = aggregatedStats.totalAgain + aggregatedStats.totalGood + aggregatedStats.totalEasy;
      aggregatedStats.totalAccuracy = totalGrades > 0
        ? Math.round(((aggregatedStats.totalGood + aggregatedStats.totalEasy) / totalGrades) * 100)
        : 0;
      
      return {
        sessions,
        aggregated: aggregatedStats
      };
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    await get(ref(database, 'health'));
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch (error) {
    throw new Error('Firebase connection failed');
  }
};
