// Simple, clean fitness app
class FitnessApp {
    constructor() {
        this.currentUser = null;
        this.workoutData = null;
        this.nutritionData = null;
        this.init();
    }
    
    init() {
        // Load user data
        this.currentUser = this.loadFromStorage('userData');
        
        // Initialize notifications
        this.initNotifications();
        
        // Setup page-specific functionality
        const page = window.location.pathname;
        if (page.includes('profile.html')) {
            this.initProfilePage();
        } else if (page.includes('plan.html')) {
            this.initPlanPage();
        }
    }
    
    // Storage utilities
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
    
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    }
    
    // API utilities
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
    
    // Notification system
    initNotifications() {
        let container = document.getElementById('notificationCenter');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationCenter';
            container.className = 'notification-center';
            document.body.appendChild(container);
        }
        this.notificationContainer = container;
    }
    
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <div>
                    <h4>${title}</h4>
                    <p>${message}</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.onclick = () => this.removeNotification(notification);
        
        this.notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => this.removeNotification(notification), 5000);
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    // Profile page functionality
    initProfilePage() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleProfileSubmit(e));
            this.loadExistingProfile();
        }
    }
    
    loadExistingProfile() {
        if (this.currentUser) {
            Object.keys(this.currentUser).forEach(key => {
                const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'radio') {
                        const radio = document.querySelector(`[name="${key}"][value="${this.currentUser[key]}"]`);
                        if (radio) radio.checked = true;
                    } else {
                        element.value = this.currentUser[key];
                    }
                }
            });
        }
    }
    
    async handleProfileSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const profileData = {};
        
        // Convert form data to object
        for (let [key, value] of formData.entries()) {
            profileData[key] = value;
        }
        
        // Convert numeric fields
        ['age', 'height', 'weight'].forEach(field => {
            if (profileData[field]) {
                profileData[field] = parseFloat(profileData[field]);
            }
        });
        
        // Generate user ID
        if (!profileData.user_id) {
            profileData.user_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Creating Profile...';
            submitBtn.disabled = true;
            
            const response = await this.apiCall('/profile', {
                method: 'POST',
                body: JSON.stringify(profileData)
            });
            
            if (response.success) {
                // Save to storage
                profileData.bmi = response.bmi;
                profileData.bmr = response.bmr;
                this.saveToStorage('userData', profileData);
                this.currentUser = profileData;
                
                this.showNotification('Profile Created!', 'Your personalized plan is ready.', 'success');
                
                // Redirect to plan page
                setTimeout(() => {
                    window.location.href = 'plan.html';
                }, 2000);
            }
        } catch (error) {
            this.showNotification('Profile Creation Failed', error.message, 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Plan page functionality
    async initPlanPage() {
        if (!this.currentUser || !this.currentUser.user_id) {
            this.showNotification('Profile Required', 'Please complete your profile first.', 'warning');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
            return;
        }
        
        try {
            // Show loading
            this.showLoading();
            
            // Update user info
            this.updateUserInfo();
            
            // Load workout and nutrition data
            await Promise.all([
                this.loadWorkoutPlan(),
                this.loadNutritionPlan()
            ]);
            
            // Hide loading
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Loading Error', 'Failed to load plan data.', 'error');
        }
    }
    
    showLoading() {
        const container = document.querySelector('.container');
        let loading = document.getElementById('loading');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loading';
            loading.className = 'loading-container';
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Loading your personalized plan...</p>
            `;
            container.appendChild(loading);
        }
        loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    updateUserInfo() {
        // Update user name
        const nameElements = document.querySelectorAll('.user-name h2');
        nameElements.forEach(el => {
            el.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        });
        
        // Update goal
        const goalElements = document.querySelectorAll('.user-goal p');
        goalElements.forEach(el => {
            el.textContent = `Goal: ${this.formatGoal(this.currentUser.goal)}`;
        });
        
        // Update stats
        const stats = document.querySelector('.user-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${this.currentUser.bmi}</div>
                    <div class="stat-label">BMI</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.currentUser.age}</div>
                    <div class="stat-label">Age</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.currentUser.height}</div>
                    <div class="stat-label">Height (cm)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${this.currentUser.weight}</div>
                    <div class="stat-label">Weight (kg)</div>
                </div>
            `;
        }
        
        // Update avatar
        const avatar = document.querySelector('.user-avatar');
        if (avatar) {
            avatar.textContent = this.currentUser.firstName.charAt(0).toUpperCase();
        }
    }
    
    async loadWorkoutPlan() {
        try {
            const response = await this.apiCall(`/workout/${this.currentUser.user_id}`);
            if (response.success) {
                this.workoutData = response;
                this.displayWorkoutPlan(response);
            }
        } catch (error) {
            console.error('Workout loading failed:', error);
            throw error;
        }
    }
    
    async loadNutritionPlan() {
        try {
            const response = await this.apiCall(`/nutrition/${this.currentUser.user_id}`);
            if (response.success) {
                this.nutritionData = response;
                this.displayNutritionPlan(response);
            }
        } catch (error) {
            console.error('Nutrition loading failed:', error);
            throw error;
        }
    }
    
    displayWorkoutPlan(data) {
        const container = document.querySelector('.workout-container') || this.createWorkoutContainer();
        
        // Create progress section
        const progressHtml = this.createProgressSection(data);
        
        // Create exercises section
        const exercisesHtml = this.createExercisesSection(data.exercises);
        
        container.innerHTML = progressHtml + exercisesHtml;
    }
    
    createWorkoutContainer() {
        const container = document.createElement('div');
        container.className = 'workout-container';
        document.querySelector('.container').appendChild(container);
        return container;
    }
    
    createProgressSection(data) {
        const currentDay = data.current_day || 1;
        const totalExercises = data.total_exercises || 0;
        
        let daysHtml = '';
        for (let i = 1; i <= 30; i++) {
            const isActive = i === currentDay;
            const isCompleted = data.progress.completed_days.includes(i);
            daysHtml += `
                <div class="day-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-day="${i}">
                    <div class="day-number">${i}</div>
                    <div class="day-label">Day</div>
                </div>
            `;
        }
        
        return `
            <div class="progress-container">
                <div class="progress-header">
                    <h2>Your Progress</h2>
                    <div class="current-day">Day ${currentDay}</div>
                </div>
                <div class="progress-stats">
                    <div class="stat-item">
                        <div class="stat-value">${currentDay}</div>
                        <div class="stat-label">Current Day</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalExercises}</div>
                        <div class="stat-label">Exercises Today</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${data.progress.completed_days.length}</div>
                        <div class="stat-label">Days Completed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${data.progress.total_calories_burned}</div>
                        <div class="stat-label">Calories Burned</div>
                    </div>
                </div>
                <div class="progress-days">
                    ${daysHtml}
                </div>
            </div>
        `;
    }
    
    createExercisesSection(exercises) {
        const exercisesHtml = exercises.map(exercise => this.createExerciseCard(exercise)).join('');
        
        return `
            <div class="exercise-container">
                <h2>Today's Workout</h2>
                <div class="exercise-list">
                    ${exercisesHtml}
                </div>
            </div>
        `;
    }
    
    createExerciseCard(exercise) {
        const gender = this.currentUser.gender || 'male';
        const instructions = exercise.instructions[gender] || exercise.instructions.male || [];
        
        return `
            <div class="exercise-card" data-exercise-id="${exercise.id}">
                <div class="exercise-header">
                    <h3>${exercise.name}</h3>
                    <div class="exercise-status">⏳</div>
                </div>
                <div class="exercise-body">
                    <div class="exercise-info">
                        <span><strong>Duration:</strong> ${exercise.duration}s</span>
                        <span><strong>Level:</strong> ${exercise.level}</span>
                        <span><strong>Focus:</strong> ${exercise.goal}</span>
                    </div>
                    
                    <div class="exercise-instructions">
                        <h4>Instructions:</h4>
                        <ol>
                            ${instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>
                    
                    ${exercise.tips ? `
                        <div class="exercise-tips">
                            <strong>Tip:</strong> ${exercise.tips}
                        </div>
                    ` : ''}
                    
                    <div class="exercise-timer" id="timer-${exercise.id}">
                        <div class="timer-display">00:00</div>
                        <div class="timer-controls">
                            <button class="btn btn-success" onclick="app.startExercise('${exercise.id}')">
                                Start Exercise
                            </button>
                            <button class="btn btn-warning" onclick="app.pauseExercise('${exercise.id}')">
                                Pause
                            </button>
                            <button class="btn btn-secondary" onclick="app.resetExercise('${exercise.id}')">
                                Reset
                            </button>
                        </div>
                    </div>
                    
                    <div class="exercise-controls">
                        <button class="btn btn-success" onclick="app.completeExercise('${exercise.id}')">
                            Complete Exercise
                        </button>
                        <button class="btn btn-warning" onclick="app.skipExercise('${exercise.id}')">
                            Skip Exercise
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    displayNutritionPlan(data) {
        const container = document.querySelector('.nutrition-container') || this.createNutritionContainer();
        
        const plan = data.plan;
        const mealsHtml = this.createMealsSection(plan.meals);
        
        container.innerHTML = `
            <div class="tier-header">
                <h2>Nutrition Plan</h2>
                <div class="tier-info">
                    <div class="tier-badge">${plan.name}</div>
                    <div class="daily-calories">${data.daily_calories} calories/day</div>
                </div>
            </div>
            
            <p class="tier-description">${plan.description}</p>
            <p class="tier-budget"><strong>Daily Budget:</strong> ${plan.budget}</p>
            
            ${mealsHtml}
        `;
    }
    
    createNutritionContainer() {
        const container = document.createElement('div');
        container.className = 'nutrition-container';
        document.querySelector('.container').appendChild(container);
        return container;
    }
    
    createMealsSection(meals) {
        const sections = ['breakfast', 'lunch', 'dinner', 'snacks'];
        
        return sections.map(section => {
            const sectionMeals = meals[section] || [];
            const title = section.charAt(0).toUpperCase() + section.slice(1);
            
            const mealsHtml = sectionMeals.map(meal => `
                <div class="meal-card">
                    <h4>${meal.name}</h4>
                    <div class="meal-nutrients">
                        <span>${meal.calories || 0} cal</span>
                        <span>${meal.protein || 0}g protein</span>
                        <span>${meal.carbs || 0}g carbs</span>
                        <span>${meal.fat || 0}g fat</span>
                    </div>
                    <div class="meal-ingredients">
                        <strong>Ingredients:</strong> ${meal.ingredients || 'Not specified'}
                    </div>
                    <div class="meal-instructions">
                        ${meal.instructions || 'Follow standard preparation'}
                    </div>
                </div>
            `).join('');
            
            return `
                <div class="meal-section">
                    <h3>${title}</h3>
                    <div class="meal-options">
                        ${mealsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Exercise controls
    startExercise(exerciseId) {
        console.log('Starting exercise:', exerciseId);
        // Simple timer implementation
        this.showNotification('Exercise Started', 'Timer started!', 'success');
    }
    
    pauseExercise(exerciseId) {
        console.log('Pausing exercise:', exerciseId);
        this.showNotification('Exercise Paused', 'Take a break!', 'warning');
    }
    
    resetExercise(exerciseId) {
        console.log('Resetting exercise:', exerciseId);
        this.showNotification('Exercise Reset', 'Timer reset to 00:00', 'info');
    }
    
    async completeExercise(exerciseId) {
        try {
            const response = await this.apiCall('/workout/complete', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    exercise_id: exerciseId,
                    duration: 60 // Default duration
                })
            });
            
            if (response.success) {
                // Update UI
                const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
                const header = card.querySelector('.exercise-header');
                const status = card.querySelector('.exercise-status');
                
                header.classList.add('completed');
                status.innerHTML = '✅';
                
                this.showNotification('Exercise Completed!', `Great job! You burned ${response.calories_burned} calories.`, 'success');
            }
        } catch (error) {
            this.showNotification('Error', 'Failed to complete exercise.', 'error');
        }
    }
    
    skipExercise(exerciseId) {
        const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
        const header = card.querySelector('.exercise-header');
        const status = card.querySelector('.exercise-status');
        
        header.classList.add('skipped');
        status.innerHTML = '⏭️';
        
        this.showNotification('Exercise Skipped', 'Try to complete it next time!', 'warning');
    }
    
    // Utility functions
    formatGoal(goal) {
        const goalMap = {
            'weightLoss': 'Weight Loss',
            'muscleGain': 'Muscle Gain',
            'endurance': 'Endurance',
            'toning': 'Toning',
            'health': 'General Health'
        };
        return goalMap[goal] || goal;
    }
}

// Global functions for logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', function() {
    app = new FitnessApp();
});