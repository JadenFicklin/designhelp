import { create } from 'zustand';

const useFilters = create((set, get) => ({
  // Filter state
  query: '',
  selectedCategory: null,
  selectedTags: [],
  
  // Actions
  setQuery: (query) => set({ query }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  
  addSelectedTag: (tag) => {
    const { selectedTags } = get();
    if (!selectedTags.includes(tag)) {
      set({ selectedTags: [...selectedTags, tag] });
    }
  },
  
  removeSelectedTag: (tag) => {
    const { selectedTags } = get();
    set({ selectedTags: selectedTags.filter(t => t !== tag) });
  },
  
  clearFilters: () => set({
    query: '',
    selectedCategory: null,
    selectedTags: [],
  }),
  
  // Computed filters object for API calls
  getFilters: () => {
    const { query, selectedCategory, selectedTags } = get();
    const filters = {};
    
    if (query) filters.query = query;
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedTags.length > 0) filters.tags = selectedTags.join(',');
    
    return filters;
  },
}));

export default useFilters;
