// Plan page functionality
let currentWorkoutData = null;
let exerciseProgress = {};
let dailyProgress = {};

document.addEventListener('DOMContentLoaded', function() {
    initializePlanPage();
});

async function initializePlanPage() {
    const userData = Utils.loadFromStorage('userData');
    
    if (!userData || !userData.user_id) {
        NotificationSystem.show(
            'Profile Required',
            'Please complete your profile first.',
            'warning'
        );
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
        return;
    }
    
    // Update user info display
    updateUserInfo(userData);
    
    // Load workout and nutrition plans
    await loadWorkoutPlan(userData.user_id);
    await loadNutritionPlan(userData.user_id);
    
    // Load progress from storage
    loadProgress();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for workout time
    checkWorkoutTime(userData);
}

function updateUserInfo(userData) {
    const userBasic = document.querySelector('.user-basic');
    const userStats = document.querySelector('.user-stats');
    
    if (userBasic) {
        const avatar = userBasic.querySelector('.user-avatar');
        const name = userBasic.querySelector('.user-name') || document.createElement('div');
        const goal = userBasic.querySelector('.user-goal') || document.createElement('div');
        
        if (avatar) {
            avatar.textContent = userData.firstName.charAt(0).toUpperCase();
            if (userData.gender === 'female') {
                avatar.classList.add('female');
            }
        }
        
        if (!userBasic.querySelector('.user-name')) {
            name.className = 'user-name';
            name.innerHTML = `<h2>${userData.firstName} ${userData.lastName}</h2>`;
            userBasic.appendChild(name);
        }
        
        if (!userBasic.querySelector('.user-goal')) {
            goal.className = 'user-goal';
            goal.innerHTML = `<p>Goal: ${formatGoal(userData.goal)}</p>`;
            userBasic.appendChild(goal);
        }
    }
    
    if (userStats) {
        userStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${userData.bmi || 'N/A'}</div>
                <div class="stat-label">BMI</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${userData.age}</div>
                <div class="stat-label">Age</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${userData.height}</div>
                <div class="stat-label">Height (cm)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${userData.weight}</div>
                <div class="stat-label">Weight (kg)</div>
            </div>
        `;
    }
    
    // Update header color based on gender
    const header = document.querySelector('header');
    if (header && userData.gender === 'female') {
        header.classList.add('female');
    }
}

async function loadWorkoutPlan(userId) {
    try {
        const response = await API.getWorkoutPlan(userId);
        
        if (response.success) {
            currentWorkoutData = response;
            displayWorkoutPlan(response);
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Failed to load workout plan:', error);
        NotificationSystem.show(
            'Loading Error',
            'Failed to load workout plan. Please try again.',
            'danger'
        );
    }
}

async function loadNutritionPlan(userId) {
    try {
        const response = await API.getNutritionPlan(userId);
        
        if (response.success) {
            displayNutritionPlan(response);
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Failed to load nutrition plan:', error);
        NotificationSystem.show(
            'Loading Error',
            'Failed to load nutrition plan. Please try again.',
            'danger'
        );
    }
}

function displayWorkoutPlan(workoutData) {
    const workoutContainer = document.querySelector('.workout-container') || createWorkoutContainer();
    
    // Create progress days
    const progressDays = createProgressDays(workoutData.current_day, workoutData.progress);
    workoutContainer.appendChild(progressDays);
    
    // Create exercise list
    const exerciseList = createExerciseList(workoutData.exercises);
    workoutContainer.appendChild(exerciseList);
    
    // Update progress info
    updateProgressInfo(workoutData);
}

function createWorkoutContainer() {
    const container = document.createElement('div');
    container.className = 'workout-container';
    
    const planContainer = document.querySelector('.plan-container');
    if (planContainer) {
        planContainer.appendChild(container);
    } else {
        document.querySelector('.container').appendChild(container);
    }
    
    return container;
}

function createProgressDays(currentDay, progress) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    const header = document.createElement('div');
    header.className = 'progress-header';
    header.innerHTML = `
        <h2>Your Progress</h2>
        <div class="current-day">Day ${currentDay}</div>
    `;
    
    const daysContainer = document.createElement('div');
    daysContainer.className = 'progress-days';
    
    // Create 30 days (typical program length)
    for (let day = 1; day <= 30; day++) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.setAttribute('data-day', day);
        
        if (day === currentDay) {
            dayCard.classList.add('active');
        }
        
        if (progress.completed_days && progress.completed_days.includes(day)) {
            dayCard.classList.add('completed');
        }
        
        dayCard.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-label">Day</div>
        `;
        
        dayCard.addEventListener('click', () => handleDayClick(day));
        daysContainer.appendChild(dayCard);
    }
    
    progressContainer.appendChild(header);
    progressContainer.appendChild(daysContainer);
    
    return progressContainer;
}

function createExerciseList(exercises) {
    const exerciseContainer = document.createElement('div');
    exerciseContainer.className = 'exercise-container';
    
    const header = document.createElement('h2');
    header.textContent = 'Today\'s Workout';
    header.style.color = 'var(--primary)';
    header.style.marginBottom = '20px';
    
    const exerciseList = document.createElement('div');
    exerciseList.className = 'exercise-list';
    
    exercises.forEach((exercise, index) => {
        const exerciseCard = createExerciseCard(exercise, index);
        exerciseList.appendChild(exerciseCard);
    });
    
    exerciseContainer.appendChild(header);
    exerciseContainer.appendChild(exerciseList);
    
    return exerciseContainer;
}

function createExerciseCard(exercise, index) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.setAttribute('data-exercise-id', exercise.id);
    
    const status = exerciseProgress[exercise.id] || 'pending';
    
    card.innerHTML = `
        <div class="exercise-header ${status}">
            <h3>${exercise.name}</h3>
            <div class="exercise-status">
                ${getStatusIcon(status)}
            </div>
        </div>
        <div class="exercise-body">
            <div class="exercise-info">
                <span><strong>Duration:</strong> ${exercise.duration}s</span>
                <span><strong>Sets:</strong> ${exercise.sets}</span>
                <span><strong>Reps:</strong> ${exercise.reps}</span>
            </div>
            
            <div class="exercise-instructions">
                <h4>Instructions:</h4>
                <ol>
                    ${exercise.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>
            </div>
            
            <div class="exercise-tips">
                <strong>Tip:</strong> ${exercise.tips}
            </div>
            
            <div class="exercise-video-info">
                <h4>Video Guide:</h4>
                <p><em>${exercise.video_description}</em></p>
                <p style="font-size: 0.9rem; color: #666;">
                    📹 Professional demonstration video showing proper form and technique
                </p>
            </div>
            
            <div class="exercise-timer" id="timer-${exercise.id}">
                <div class="timer-display">00:00</div>
                <div class="timer-controls">
                    <button class="btn btn-success" onclick="startExercise('${exercise.id}')">
                        Start Exercise
                    </button>
                    <button class="btn btn-warning" onclick="pauseExercise('${exercise.id}')">
                        Pause
                    </button>
                    <button class="btn btn-secondary" onclick="resetExercise('${exercise.id}')">
                        Reset
                    </button>
                </div>
            </div>
            
            <div class="exercise-controls">
                <button class="btn btn-success" onclick="completeExercise('${exercise.id}')">
                    Complete Exercise
                </button>
                <button class="btn btn-warning" onclick="skipExercise('${exercise.id}')">
                    Skip Exercise
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function displayNutritionPlan(nutritionData) {
    const nutritionContainer = document.querySelector('.nutrition-container') || createNutritionContainer();
    
    const plan = nutritionData.plan;
    const economicLevel = nutritionData.economic_level;
    const dailyCalories = nutritionData.daily_calories;
    
    nutritionContainer.innerHTML = `
        <div class="tier-header">
            <h2>Nutrition Plan</h2>
            <div class="tier-info">
                <div class="tier-badge">${plan.name}</div>
                <div class="daily-calories">${dailyCalories} calories/day</div>
            </div>
        </div>
        
        <p class="tier-description">${plan.description}</p>
        <p class="tier-budget"><strong>Daily Budget:</strong> ${plan.daily_budget}</p>
        
        ${createMealSection('Breakfast', plan.meals.breakfast)}
        ${createMealSection('Lunch', plan.meals.lunch)}
        ${createMealSection('Dinner', plan.meals.dinner)}
        ${createSnackSection('Snacks', plan.meals.snacks)}
    `;
}

function createNutritionContainer() {
    const container = document.createElement('div');
    container.className = 'nutrition-container';
    
    const planContainer = document.querySelector('.plan-container');
    if (planContainer) {
        planContainer.appendChild(container);
    } else {
        document.querySelector('.container').appendChild(container);
    }
    
    return container;
}

function createMealSection(title, meals) {
    return `
        <div class="meal-section">
            <h3>${title}</h3>
            <div class="meal-options">
                ${meals.map(meal => `
                    <div class="meal-card">
                        <h4>${meal.name}</h4>
                        <div class="meal-nutrients">
                            <span>${meal.calories} cal</span>
                            <span>${meal.protein}g protein</span>
                            <span>${meal.carbs}g carbs</span>
                            <span>${meal.fats}g fats</span>
                        </div>
                        <div class="meal-ingredients">
                            <strong>Ingredients:</strong> ${meal.ingredients.join(', ')}
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9rem;">
                            <strong>Prep time:</strong> ${meal.prep_time}
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9rem; color: #666;">
                            ${meal.instructions}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createSnackSection(title, snacks) {
    return `
        <div class="meal-section">
            <h3>${title}</h3>
            <div class="meal-options">
                ${snacks.map(snack => `
                    <div class="meal-card">
                        <h4>${snack.name}</h4>
                        <div class="meal-nutrients">
                            <span>${snack.calories} cal</span>
                            <span>${snack.protein}g protein</span>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9rem;">
                            <strong>Prep time:</strong> ${snack.prep_time}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Exercise control functions
function startExercise(exerciseId) {
    const timerDisplay = document.querySelector(`#timer-${exerciseId} .timer-display`);
    
    if (!AppState.currentExercise || AppState.currentExercise !== exerciseId) {
        // Stop previous exercise if any
        if (AppState.currentExercise) {
            WorkoutTimer.reset();
        }
        
        AppState.currentExercise = exerciseId;
        WorkoutTimer.init(timerDisplay);
    }
    
    WorkoutTimer.start();
    
    // Update button states
    updateExerciseButtons(exerciseId, 'running');
}

function pauseExercise(exerciseId) {
    if (AppState.currentExercise === exerciseId) {
        WorkoutTimer.pause();
        updateExerciseButtons(exerciseId, 'paused');
    }
}

function resetExercise(exerciseId) {
    if (AppState.currentExercise === exerciseId) {
        WorkoutTimer.reset();
        updateExerciseButtons(exerciseId, 'reset');
    }
}

async function completeExercise(exerciseId) {
    const duration = WorkoutTimer.getSeconds();
    const userData = Utils.loadFromStorage('userData');
    
    if (!userData) return;
    
    try {
        const response = await API.completeExercise(userData.user_id, exerciseId, Math.floor(duration / 60));
        
        if (response.success) {
            exerciseProgress[exerciseId] = 'completed';
            
            // Update UI
            const exerciseCard = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
            const exerciseHeader = exerciseCard.querySelector('.exercise-header');
            exerciseHeader.classList.add('completed');
            exerciseHeader.querySelector('.exercise-status').innerHTML = getStatusIcon('completed');
            
            // Show calories burned
            NotificationSystem.show(
                'Exercise Completed! 💪',
                `Great job! You burned ${response.calories_burned} calories.`,
                'success'
            );
            
            // Save progress
            saveProgress();
            
            // Check if all exercises are completed
            checkDayCompletion();
        }
    } catch (error) {
        console.error('Failed to complete exercise:', error);
        NotificationSystem.show(
            'Error',
            'Failed to record exercise completion.',
            'danger'
        );
    }
}

function skipExercise(exerciseId) {
    exerciseProgress[exerciseId] = 'skipped';
    
    // Update UI
    const exerciseCard = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const exerciseHeader = exerciseCard.querySelector('.exercise-header');
    exerciseHeader.classList.add('skipped');
    exerciseHeader.querySelector('.exercise-status').innerHTML = getStatusIcon('skipped');
    
    NotificationSystem.show(
        'Exercise Skipped',
        'Exercise skipped. Try to complete it next time!',
        'warning'
    );
    
    saveProgress();
    checkDayCompletion();
}

async function handleDayClick(day) {
    const userData = Utils.loadFromStorage('userData');
    const progress = currentWorkoutData?.progress || {};
    
    // Check if day is completed
    if (progress.completed_days && progress.completed_days.includes(day)) {
        const result = await ModalSystem.show(
            'Restart Day?',
            `Day ${day} is already completed. Do you want to restart this workout?`,
            [
                { text: 'Yes, Restart', type: 'primary' },
                { text: 'Cancel', type: 'secondary' }
            ]
        );
        
        if (result === 0) {
            // Reset day progress
            delete dailyProgress[day];
            exerciseProgress = {};
            
            // Reload workout for this day
            await loadWorkoutPlan(userData.user_id);
            
            NotificationSystem.show(
                'Day Restarted',
                `Day ${day} workout has been reset.`,
                'info'
            );
        }
    } else if (day !== currentWorkoutData?.current_day) {
        NotificationSystem.show(
            'Day Locked',
            `Complete your current day (${currentWorkoutData?.current_day}) first!`,
            'warning'
        );
    }
}

async function checkDayCompletion() {
    if (!currentWorkoutData?.exercises) return;
    
    const totalExercises = currentWorkoutData.exercises.length;
    const completedExercises = Object.values(exerciseProgress).filter(status => 
        status === 'completed' || status === 'skipped'
    ).length;
    
    if (completedExercises >= totalExercises) {
        const userData = Utils.loadFromStorage('userData');
        const currentDay = currentWorkoutData.current_day;
        
        try {
            const response = await API.completeDay(userData.user_id, currentDay);
            
            if (response.success) {
                // Update UI
                const dayCard = document.querySelector(`[data-day="${currentDay}"]`);
                if (dayCard) {
                    dayCard.classList.remove('active');
                    dayCard.classList.add('completed');
                }
                
                // Save completion date
                Utils.saveToStorage('lastWorkoutDate', new Date().toDateString());
                
                NotificationSystem.show(
                    '🎉 Day Complete!',
                    `Congratulations! You completed Day ${currentDay}. Tomorrow brings new challenges!`,
                    'success'
                );
                
                // Reset for next day
                exerciseProgress = {};
                dailyProgress[currentDay] = true;
                saveProgress();
            }
        } catch (error) {
            console.error('Failed to complete day:', error);
        }
    }
}

function checkWorkoutTime(userData) {
    if (!userData.preferredTime) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (Utils.isWorkoutTime(userData.preferredTime)) {
        NotificationSystem.show(
            '⏰ Workout Time!',
            'It\'s your scheduled workout time. Ready to begin?',
            'info',
            [
                { text: 'Start Now', type: 'success', onclick: 'scrollToWorkout()' },
                { text: 'Change Time', type: 'secondary', onclick: 'changeWorkoutTime()' }
            ]
        );
    } else if (currentTime !== userData.preferredTime) {
        // Different time than preferred
        const result = ModalSystem.show(
            'Different Workout Time',
            `Your preferred workout time is ${userData.preferredTime}, but it's currently ${currentTime}. Do you want to start now anyway?`,
            [
                { text: 'Yes, Start Now', type: 'primary' },
                { text: 'Wait for My Time', type: 'secondary' }
            ]
        );
        
        result.then(choice => {
            if (choice === 0) {
                // Update workout time
                API.updateWorkoutTime(userData.user_id, currentTime);
                userData.preferredTime = currentTime;
                Utils.saveToStorage('userData', userData);
                
                NotificationSystem.show(
                    'Workout Time Updated',
                    `Your workout time has been changed to ${currentTime}`,
                    'success'
                );
            }
        });
    }
}

// Utility functions
function formatGoal(goal) {
    const goalMap = {
        'weightLoss': 'Weight Loss',
        'muscleGain': 'Muscle Gain',
        'endurance': 'Endurance',
        'toning': 'Toning',
        'health': 'General Health'
    };
    return goalMap[goal] || goal;
}

function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'completed': '✅',
        'skipped': '⏭️',
        'running': '🏃‍♂️',
        'paused': '⏸️'
    };
    return icons[status] || '⏳';
}

function updateExerciseButtons(exerciseId, state) {
    const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    const startBtn = card.querySelector('.btn-success');
    const pauseBtn = card.querySelector('.btn-warning');
    const resetBtn = card.querySelector('.btn-secondary');
    
    switch (state) {
        case 'running':
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = false;
            break;
        case 'paused':
            startBtn.textContent = 'Resume';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            break;
        case 'reset':
            startBtn.textContent = 'Start Exercise';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            break;
    }
}

function updateProgressInfo(workoutData) {
    const progressInfo = document.createElement('div');
    progressInfo.className = 'progress-info';
    progressInfo.innerHTML = `
        <div class="progress-stats">
            <div class="stat-item">
                <div class="stat-value">${workoutData.current_day}</div>
                <div class="stat-label">Current Day</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${workoutData.total_exercises}</div>
                <div class="stat-label">Exercises Today</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${workoutData.progress.completed_days?.length || 0}</div>
                <div class="stat-label">Days Completed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(workoutData.progress.total_calories_burned || 0)}</div>
                <div class="stat-label">Calories Burned</div>
            </div>
        </div>
    `;
    
    const container = document.querySelector('.workout-container');
    if (container) {
        container.insertBefore(progressInfo, container.firstChild);
    }
}

function setupEventListeners() {
    // Back button
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

function loadProgress() {
    const savedProgress = Utils.loadFromStorage('exerciseProgress');
    if (savedProgress) {
        exerciseProgress = savedProgress;
    }
    
    const savedDailyProgress = Utils.loadFromStorage('dailyProgress');
    if (savedDailyProgress) {
        dailyProgress = savedDailyProgress;
    }
}

function saveProgress() {
    Utils.saveToStorage('exerciseProgress', exerciseProgress);
    Utils.saveToStorage('dailyProgress', dailyProgress);
}

// Global functions for button onclick handlers
window.startExercise = startExercise;
window.pauseExercise = pauseExercise;
window.resetExercise = resetExercise;
window.completeExercise = completeExercise;
window.skipExercise = skipExercise;

window.scrollToWorkout = function() {
    document.querySelector('.exercise-container')?.scrollIntoView({ behavior: 'smooth' });
    NotificationSystem.clear();
};

window.changeWorkoutTime = function() {
    const newTime = prompt('Enter new workout time (HH:MM):', '07:00');
    if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
        const userData = Utils.loadFromStorage('userData');
        userData.preferredTime = newTime;
        Utils.saveToStorage('userData', userData);
        
        API.updateWorkoutTime(userData.user_id, newTime);
        
        NotificationSystem.show(
            'Time Updated',
            `Workout time changed to ${newTime}`,
            'success'
        );
    }
    NotificationSystem.clear();
};
