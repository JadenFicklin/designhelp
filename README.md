# Design Vault – Materials & Components Library

A comprehensive library management system for design materials, objects, and components with real-time data synchronization using Firebase Realtime Database.

## 🚀 Features

- **📚 Library Management**: Store and organize materials, objects, and text notes
- **🖼️ Image Support**: Upload and manage images with Cloudinary integration
- **🏷️ Categories & Tags**: Hierarchical categories with nested subcategories
- **🔍 Advanced Search**: Search by name, description, and tags
- **📊 Import/Export**: JSON import/export for data portability
- **🎯 Flashcards Mode**: Study mode for reviewing items
- **⚡ Real-time Sync**: Firebase Realtime Database for instant updates
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🎨 Modern UI**: Clean, intuitive interface with TailwindCSS

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **React Hook Form** - Form handling
- **SweetAlert2** - User notifications

### Backend & Storage
- **Firebase Realtime Database** - Real-time data storage
- **Cloudinary** - Image upload and storage

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project
- Cloudinary account

### 1. Clone and Install
```bash
git clone <repository-url>
cd designhelp2
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```bash
# Copy the example file
cp env.example .env
```

Fill in your configuration values:

```env
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD=your_cloud_name
REACT_APP_CLOUDINARY_PRESET=your_unsigned_upload_preset

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Configure Realtime Database**:
   - Go to Realtime Database in your Firebase console
   - Start in test mode (for development)
   - Copy your database URL

3. **Get Firebase Config**:
   - Go to Project Settings
   - Add a web app
   - Copy the configuration object

### 4. Cloudinary Setup

1. **Create Cloudinary Account**:
   - Sign up at [Cloudinary](https://cloudinary.com/)
   - Get your cloud name

2. **Create Upload Preset**:
   - Go to Settings > Upload
   - Create an unsigned upload preset
   - Set it to "Unsigned"

### 5. Run the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📖 Usage

### Library Management
- **Create Items**: Use the "Create New Item" form in the sidebar
- **Upload Images**: Add images directly when creating items
- **Organize**: Use categories and tags to organize your library
- **Search**: Use the search bar to find items quickly
- **Filter**: Click on categories to filter items

### Categories
- **Add Categories**: Click the "+" button next to "Categories"
- **Nested Categories**: Create subcategories by clicking "+" on existing categories
- **Rename**: Hover over categories and click the edit icon
- **Delete**: Hover over categories and click the delete icon

### Import/Export
- **Export**: Click "Export JSON" to download your data
- **Import**: Use the import section to upload JSON files
- **Sample Data**: Click "Load Sample Data" to populate with examples

### Flashcards Mode
- Navigate to "Flashcards" in the top navigation
- Study items with images
- Use the grading system to track progress

## 🗄️ Data Schema

### Item Structure
```json
{
  "id": "unique_id",
  "name": "Item Name",
  "kind": "material|object|text",
  "description": "Item description",
  "dimensions": {
    "width": 10,
    "height": 5,
    "unit": "in"
  },
  "attributes": {
    "color": "white",
    "material": "wood"
  },
  "cost": 85.00,
  "currency": "USD",
  "categories": ["category_id"],
  "tags": ["tag1", "tag2"],
  "assets": [
    {
      "kind": "image",
      "url": "https://...",
      "alt": "Description"
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Category Structure
```json
{
  "id": "unique_id",
  "name": "Category Name",
  "parentId": "parent_category_id",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── utils/              # Utility functions
│   ├── api.js          # API layer
│   ├── firebase.js     # Firebase configuration
│   ├── firebaseApi.js  # Firebase API functions
│   └── alerts.js       # SweetAlert2 utilities
├── store/              # Zustand stores
└── App.js              # Main application component
```

### Key Features Implementation

#### Real-time Data Sync
- Firebase Realtime Database provides instant updates
- TanStack Query handles caching and synchronization
- Optimistic updates for better UX

#### Image Management
- Cloudinary handles image uploads
- Firebase stores image metadata
- Responsive image display

#### Category Management
- Hierarchical tree structure
- Real-time category updates
- Validation for category operations

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Other Platforms
The application can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🔮 Future Enhancements

- **Authentication**: User accounts and permissions
- **Collaboration**: Multi-user editing
- **Advanced Search**: Full-text search with Algolia
- **Offline Support**: Service worker for offline access
- **Mobile App**: React Native version
- **Analytics**: Usage tracking and insights
- **Backup**: Automated data backups
- **API**: REST API for external integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase and Cloudinary documentation

---

**Design Vault** - Organize your design materials with ease! 🎨
