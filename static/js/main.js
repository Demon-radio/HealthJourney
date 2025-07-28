// Global application state
const AppState = {
    currentUser: null,
    isOnline: navigator.onLine,
    notifications: [],
    workoutTimer: null,
    currentExercise: null
};

// Utility functions
const Utils = {
    // Generate unique user ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Format time for display
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Calculate BMI
    calculateBMI(weight, height) {
        const heightM = height / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    },

    // Get BMI category
    getBMICategory(bmi) {
        if (bmi < 18.5) return { category: 'Underweight', color: '#ff9800' };
        if (bmi < 25) return { category: 'Normal', color: '#4caf50' };
        if (bmi < 30) return { category: 'Overweight', color: '#ff9800' };
        return { category: 'Obese', color: '#f44336' };
    },

    // Save to localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    // Load from localStorage
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    },

    // Check if it's workout time
    isWorkoutTime(preferredTime) {
        const now = new Date();
        const [hours, minutes] = preferredTime.split(':').map(Number);
        const workoutTime = new Date();
        workoutTime.setHours(hours, minutes, 0, 0);
        
        const timeDiff = Math.abs(now - workoutTime);
        return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
    },

    // Show workout reminder notification
    showWorkoutReminder() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Training Club Reminder', {
                body: 'Time for your workout! Ready to get stronger?',
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    },

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            return await Notification.requestPermission();
        }
        return Notification.permission;
    }
};

// Notification system
const NotificationSystem = {
    container: null,

    init() {
        this.container = document.getElementById('notificationCenter');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationCenter';
            this.container.className = 'notification-center';
            document.body.appendChild(this.container);
        }
    },

    show(title, message, type = 'info', actions = []) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'danger') icon = '❌';
        
        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = '<div class="notification-buttons">';
            actions.forEach(action => {
                actionsHTML += `<button class="btn btn-${action.type || 'primary'}" onclick="${action.onclick}">${action.text}</button>`;
            });
            actionsHTML += '</div>';
        }
        
        notification.innerHTML = `
            <button class="notification-close">&times;</button>
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <h3>${title}</h3>
                <p>${message}</p>
                ${actionsHTML}
            </div>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));
        
        this.container.appendChild(notification);
        
        // Auto-remove after 8 seconds if no actions
        if (actions.length === 0) {
            setTimeout(() => this.remove(notification), 8000);
        }
        
        return notification;
    },

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideIn 0.5s reverse forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    },

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};

// Modal system
const ModalSystem = {
    show(title, message, buttons = []) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            
            let buttonsHTML = '';
            buttons.forEach((button, index) => {
                buttonsHTML += `<button class="btn btn-${button.type || 'primary'}" onclick="resolveModal(${index})">${button.text}</button>`;
            });
            
            if (buttons.length === 0) {
                buttonsHTML = '<button class="btn btn-primary" onclick="resolveModal(0)">OK</button>';
            }
            
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div class="modal-buttons">
                        ${buttonsHTML}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            window.resolveModal = (index) => {
                document.body.removeChild(modal);
                delete window.resolveModal;
                resolve(index);
            };
            
            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    delete window.resolveModal;
                    resolve(-1);
                }
            });
        });
    }
};

// Workout timer system
const WorkoutTimer = {
    seconds: 0,
    interval: null,
    display: null,
    isRunning: false,
    
    init(displayElement) {
        this.display = displayElement;
        this.update();
    },
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.seconds++;
                this.update();
            }, 1000);
        }
    },
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
        }
    },
    
    reset() {
        this.isRunning = false;
        clearInterval(this.interval);
        this.seconds = 0;
        this.update();
    },
    
    update() {
        if (this.display) {
            this.display.textContent = Utils.formatTime(this.seconds);
        }
    },
    
    getSeconds() {
        return this.seconds;
    }
};

// API functions
const API = {
    baseURL: window.location.origin,
    
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            // Check if response is actually JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, likely an HTML error page
                const textResponse = await response.text();
                console.error('Non-JSON response received:', textResponse);
                throw new Error(`Server error: Expected JSON but received ${contentType || 'unknown content type'}`);
            }
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', {
                endpoint,
                options,
                error: error.message
            });
            
            // Provide user-friendly error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Please check your internet connection');
            } else if (error.message.includes('Unexpected token')) {
                throw new Error('Server error: Invalid response format');
            }
            
            throw error;
        }
    },
    
    async saveProfile(profileData) {
        return await this.request('/profile', {
            method: 'POST',
            body: JSON.stringify(profileData)
        });
    },
    
    async getProfile(userId) {
        return await this.request(`/profile/${userId}`);
    },
    
    async getWorkoutPlan(userId) {
        return await this.request(`/workout/${userId}`);
    },
    
    async getNutritionPlan(userId) {
        return await this.request(`/nutrition/${userId}`);
    },
    
    async completeExercise(userId, exerciseId, duration) {
        return await this.request('/workout/complete', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                exercise_id: exerciseId,
                duration: duration
            })
        });
    },
    
    async completeDay(userId, day) {
        return await this.request('/workout/day/complete', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                day: day
            })
        });
    },
    
    async updateWorkoutTime(userId, time) {
        return await this.request('/workout/time/update', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                time: time
            })
        });
    }
};

// Workout reminder system
const WorkoutReminder = {
    checkInterval: null,
    
    start() {
        // Check every minute for workout time
        this.checkInterval = setInterval(() => {
            this.checkWorkoutTime();
        }, 60000);
        
        // Initial check
        this.checkWorkoutTime();
    },
    
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },
    
    checkWorkoutTime() {
        const userData = Utils.loadFromStorage('userData');
        if (!userData || !userData.preferred_time) return;
        
        const lastWorkout = Utils.loadFromStorage('lastWorkoutDate');
        const today = new Date().toDateString();
        
        // Don't remind if already worked out today
        if (lastWorkout === today) return;
        
        if (Utils.isWorkoutTime(userData.preferred_time)) {
            this.showWorkoutNotification();
        }
    },
    
    showWorkoutNotification() {
        // Browser notification
        Utils.showWorkoutReminder();
        
        // In-app notification
        NotificationSystem.show(
            '🏋️ Workout Time!',
            'Ready to start your training session?',
            'warning',
            [
                { text: 'Start Now', type: 'success', onclick: 'WorkoutReminder.startWorkout()' },
                { text: 'Later', type: 'secondary', onclick: 'WorkoutReminder.snoozeWorkout()' }
            ]
        );
    },
    
    startWorkout() {
        NotificationSystem.clear();
        window.location.href = 'plan.html';
    },
    
    snoozeWorkout() {
        NotificationSystem.clear();
        NotificationSystem.show('Workout Snoozed', 'We\'ll remind you again in 30 minutes.', 'info');
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize notification system
    NotificationSystem.init();
    
    // Request notification permission
    await Utils.requestNotificationPermission();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success) {
        NotificationSystem.show('Welcome!', 'Your fitness journey starts now.', 'success');
    }
    
    // Load user data if available
    const userData = Utils.loadFromStorage('userData');
    if (userData) {
        AppState.currentUser = userData;
        
        // Start workout reminder system
        WorkoutReminder.start();
        
        // Update header color based on gender
        const header = document.querySelector('header');
        if (header && userData.gender === 'female') {
            header.classList.add('female');
        }
    }
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        AppState.isOnline = true;
        NotificationSystem.show('Connection Restored', 'You\'re back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        AppState.isOnline = false;
        NotificationSystem.show('Offline Mode', 'Some features may not work without internet.', 'warning');
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    WorkoutReminder.stop();
    if (WorkoutTimer.interval) {
        clearInterval(WorkoutTimer.interval);
    }
});

// Export for use in other files
window.AppState = AppState;
window.Utils = Utils;
window.NotificationSystem = NotificationSystem;
window.ModalSystem = ModalSystem;
window.WorkoutTimer = WorkoutTimer;
window.API = API;
window.WorkoutReminder = WorkoutReminder;
