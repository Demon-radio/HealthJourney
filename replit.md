# Training Club - Fitness Application

## Overview

Training Club is a personalized fitness web application that provides users with customized workout plans and nutrition guidance. The application uses Flask as the backend framework with a client-side JavaScript frontend, delivering an AI-powered fitness experience that adapts to individual user goals, fitness levels, and preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Multi-page Application (MPA)**: Built with vanilla HTML, CSS, and JavaScript
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Client-side State Management**: Uses localStorage for data persistence and global AppState object
- **Modular JavaScript**: Separate JS files for different functionalities (main.js, profile.js, plan.js)
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Backend Architecture
- **Flask Web Framework**: Lightweight Python web server handling API endpoints and static file serving
- **RESTful API Design**: Clean separation between frontend and backend with JSON communication
- **In-memory Storage**: Uses Python dictionaries for user data and workout progress (temporary storage)
- **File-based Data**: JSON files for exercises and nutrition data storage
- **Stateless Design**: Each request is independent, suitable for serverless deployment

### Data Storage Solutions
- **Client-side Storage**: localStorage for user preferences and session data
- **Server-side Memory**: Python dictionaries for runtime user data and workout progress
- **Static JSON Files**: Pre-defined exercise library and nutrition plans stored as JSON
- **No Database**: Currently uses file-based and in-memory storage (ready for database integration)

## Key Components

### User Profile System
- **Profile Creation**: Multi-step form collecting user demographics, fitness goals, and preferences
- **BMI/BMR Calculations**: Automatic health metrics calculation using standard formulas
- **Goal-based Customization**: Supports weight loss, muscle gain, and general fitness goals
- **Gender-specific Planning**: Different workout and nutrition recommendations

### Workout Management
- **Progressive Exercise Plans**: 14 exercises with increasing difficulty every 2 days
- **Exercise Library**: JSON-based exercise database with instructions, MET values, and video descriptions
- **Workout Timer**: Built-in timer system for exercise tracking
- **Progress Tracking**: Day-by-day completion tracking with visual indicators

### Nutrition Planning
- **Three-tier System**: Basic, Medium, and Premium nutrition plans based on budget
- **Meal Planning**: Complete breakfast, lunch, dinner, and snack recommendations
- **Calorie Tracking**: Automatic calorie calculation based on user goals and BMR
- **Ingredient Lists**: Detailed shopping lists for meal preparation

### Notification System
- **Real-time Notifications**: Toast-style notifications for user feedback
- **Workout Reminders**: Time-based workout notifications
- **Progress Celebrations**: Achievement notifications for completed workouts

## Data Flow

1. **User Registration**: Profile form → Flask API → In-memory storage → localStorage backup
2. **Plan Generation**: User data → Exercise/Nutrition JSON → Customized plan → Client display
3. **Workout Tracking**: Exercise completion → Progress update → localStorage → Server sync
4. **Data Persistence**: Client actions → localStorage → Periodic server sync → Memory storage

## External Dependencies

### Frontend Dependencies
- **CSS Framework**: Custom CSS with CSS variables for theming
- **Icons**: Emoji-based icons (no external icon library)
- **Fonts**: System fonts (Segoe UI, fallbacks)

### Backend Dependencies
- **Flask**: Web framework for Python
- **JSON**: Built-in Python module for data serialization
- **DateTime**: Built-in Python module for time calculations

### Deployment Dependencies
- **Vercel**: Serverless deployment platform
- **Python Runtime**: Python 3.9 environment

## Deployment Strategy

### Platform: Vercel Serverless
- **Serverless Functions**: Flask app deployed as Vercel serverless function
- **Static Asset Serving**: CSS, JS, and HTML files served via Vercel's CDN
- **Environment Configuration**: Python 3.9 runtime with custom routing
- **Zero-config Deployment**: Automatic builds and deployments from git repository

### Architecture Benefits
- **Scalability**: Automatic scaling based on traffic
- **Cost Efficiency**: Pay-per-use serverless model
- **Global Distribution**: CDN for fast asset delivery
- **Easy Maintenance**: No server management required

### Current Limitations
- **In-memory Storage**: Data doesn't persist between deployments
- **No Database**: Limited to session-based data storage
- **Single User Session**: No multi-user authentication system

### Future Enhancements Ready
- **Database Integration**: Architecture supports easy database addition (PostgreSQL recommended)
- **User Authentication**: JWT-based auth system can be integrated
- **Data Persistence**: Current in-memory storage can be replaced with database queries
- **Multi-tenancy**: User isolation already designed into the system