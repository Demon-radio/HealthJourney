// Plan page functionality
let currentWorkoutData = null;
let exerciseProgress = {};
let dailyProgress = {};

document.addEventListener('DOMContentLoaded', function() {
    initializePlanPage();
});

// Loading state functions
function showLoadingState() {
    const container = document.querySelector('.container');
    let loadingElement = document.getElementById('loading-state');
    
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'loading-state';
        loadingElement.className = 'loading-container';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading your personalized plan...</p>
        `;
        container.appendChild(loadingElement);
    }
    
    loadingElement.style.display = 'block';
}

function hideLoadingState() {
    const loadingElement = document.getElementById('loading-state');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Fallback data functions
function createFallbackWorkout() {
    return {
        success: true,
        exercises: [
            {
                id: 1,
                name: "Push-ups",
                duration: 120,
                instructions: {
                    male: ["Start in plank position", "Lower chest to floor", "Push back up", "Keep core tight"],
                    female: ["Start in plank or knee position", "Lower chest to floor", "Push back up", "Keep core engaged"]
                },
                tips: "Keep your body in a straight line"
            },
            {
                id: 2,
                name: "Squats",
                duration: 180,
                instructions: {
                    male: ["Stand feet shoulder-width apart", "Lower like sitting in chair", "Keep knees behind toes", "Return to standing"],
                    female: ["Stand feet hip-width apart", "Lower keeping weight in heels", "Keep chest up", "Push through heels"]
                },
                tips: "Keep chest up and knees aligned"
            }
        ],
        current_day: 1,
        total_exercises: 2,
        progress: {
            current_day: 1,
            completed_days: [],
            total_calories_burned: 0,
            streak: 0
        }
    };
}

function createFallbackNutrition() {
    return {
        success: true,
        plan: {
            name: "Basic Plan",
            meals: {
                breakfast: [
                    {
                        name: "Oatmeal with Banana",
                        calories: 350,
                        protein: 12,
                        ingredients: "Rolled oats, banana, milk, honey"
                    }
                ],
                lunch: [
                    {
                        name: "Chicken and Rice Bowl",
                        calories: 450,
                        protein: 35,
                        ingredients: "Chicken breast, brown rice, vegetables"
                    }
                ],
                dinner: [
                    {
                        name: "Baked Fish with Vegetables",
                        calories: 400,
                        protein: 30,
                        ingredients: "White fish, roasted vegetables, olive oil"
                    }
                ],
                snacks: [
                    {
                        name: "Greek Yogurt",
                        calories: 150,
                        protein: 15,
                        ingredients: "Greek yogurt, berries"
                    }
                ]
            }
        },
        daily_calories: 1500,
        economic_level: "basic"
    };
}

async function initializePlanPage() {
    console.log('Initializing plan page...');
    
    const userData = Utils.loadFromStorage('userData');
    console.log('Loaded user data from storage:', userData);
    
    if (!userData || !userData.user_id) {
        console.log('No user data found, redirecting to profile...');
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
    
    try {
        // Update user info display
        updateUserInfo(userData);
        
        // Initialize notification system
        NotificationSystem.init();
        
        // Show loading state
        showLoadingState();
        
        // Load workout and nutrition plans in parallel
        const [workoutResult, nutritionResult] = await Promise.allSettled([
            loadWorkoutPlan(userData.user_id),
            loadNutritionPlan(userData.user_id)
        ]);
        
        // Handle results
        if (workoutResult.status === 'rejected') {
            console.error('Workout plan loading failed:', workoutResult.reason);
            NotificationSystem.show(
                'Loading Error',
                'Failed to load workout plan. Using offline data.',
                'warning'
            );
        }
        
        if (nutritionResult.status === 'rejected') {
            console.error('Nutrition plan loading failed:', nutritionResult.reason);
            NotificationSystem.show(
                'Loading Error',
                'Failed to load nutrition plan. Using offline data.',
                'warning'
            );
        }
        
        // Load progress from storage
        loadProgress();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check for workout time
        checkWorkoutTime(userData);
        
        // Hide loading state
        hideLoadingState();
        
        console.log('Plan page initialization complete');
        
    } catch (error) {
        console.error('Plan page initialization failed:', error);
        NotificationSystem.show(
            'Initialization Error',
            'Failed to load page. Please refresh and try again.',
            'danger'
        );
        hideLoadingState();
    }
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
        console.log('Loading workout plan for user:', userId);
        const response = await API.getWorkoutPlan(userId);
        console.log('Workout plan response:', response);
        
        if (response.success) {
            currentWorkoutData = response;
            displayWorkoutPlan(response);
            console.log('Workout plan loaded successfully');
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Failed to load workout plan:', error);
        // Create fallback workout data
        const fallbackWorkout = createFallbackWorkout();
        currentWorkoutData = fallbackWorkout;
        displayWorkoutPlan(fallbackWorkout);
        throw error; // Re-throw for Promise.allSettled handling
    }
}

async function loadNutritionPlan(userId) {
    try {
        console.log('Loading nutrition plan for user:', userId);
        const response = await API.getNutritionPlan(userId);
        console.log('Nutrition plan response:', response);
        
        if (response.success) {
            displayNutritionPlan(response);
            console.log('Nutrition plan loaded successfully');
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Failed to load nutrition plan:', error);
        // Create fallback nutrition data
        const fallbackNutrition = createFallbackNutrition();
        displayNutritionPlan(fallbackNutrition);
        throw error; // Re-throw for Promise.allSettled handling
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
    const userData = Utils.loadFromStorage('userData');
    const gender = userData?.gender || 'male';
    
    // Get gender-specific instructions
    let instructions = exercise.instructions;
    if (typeof instructions === 'object' && instructions[gender]) {
        instructions = instructions[gender];
    } else if (Array.isArray(instructions)) {
        // Already an array, use as is
    } else {
        instructions = ['Follow the exercise demonstration'];
    }
    
    card.innerHTML = `
        <div class="exercise-header ${status}">
            <h3>${exercise.name}</h3>
            <div class="exercise-status">
                ${getStatusIcon(status)}
            </div>
        </div>
        <div class="exercise-body">
            <div class="exercise-info">
                <span><strong>Duration:</strong> ${exercise.duration || 60}s</span>
                <span><strong>Level:</strong> ${exercise.level || 'beginner'}</span>
                <span><strong>Focus:</strong> ${exercise.goal || 'general'}</span>
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
            
            ${exercise.video_description ? `
                <div class="exercise-video-info">
                    <h4>Video Guide:</h4>
                    <p><em>${exercise.video_description}</em></p>
                    <p style="font-size: 0.9rem; color: #666;">
                        📹 Professional demonstration video showing proper form and technique
                    </p>
                </div>
            ` : ''}
            
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
    if (!meals || !Array.isArray(meals)) {
        return `
            <div class="meal-section">
                <h3>${title}</h3>
                <p>No meals available for this section.</p>
            </div>
        `;
    }
    
    return `
        <div class="meal-section">
            <h3>${title}</h3>
            <div class="meal-options">
                ${meals.map(meal => `
                    <div class="meal-card">
                        <h4>${meal.name || 'Unnamed Meal'}</h4>
                        <div class="meal-nutrients">
                            <span>${meal.calories || 0} cal</span>
                            <span>${meal.protein || 0}g protein</span>
                            <span>${meal.carbs || 0}g carbs</span>
                            <span>${meal.fat || 0}g fat</span>
                        </div>
                        <div class="meal-ingredients">
                            <strong>Ingredients:</strong> ${meal.ingredients || 'Not specified'}
                        </div>
                        ${meal.prep_time ? `
                            <div style="margin-top: 10px; font-size: 0.9rem;">
                                <strong>Prep time:</strong> ${meal.prep_time}
                            </div>
                        ` : ''}
                        <div style="margin-top: 5px; font-size: 0.9rem; color: #666;">
                            ${meal.instructions || 'Follow standard preparation methods'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createSnackSection(title, snacks) {
    if (!snacks || !Array.isArray(snacks)) {
        return `
            <div class="meal-section">
                <h3>${title}</h3>
                <p>No snacks available.</p>
            </div>
        `;
    }
    
    return `
        <div class="meal-section">
            <h3>${title}</h3>
            <div class="meal-options">
                ${snacks.map(snack => `
                    <div class="meal-card">
                        <h4>${snack.name || 'Unnamed Snack'}</h4>
                        <div class="meal-nutrients">
                            <span>${snack.calories || 0} cal</span>
                            <span>${snack.protein || 0}g protein</span>
                        </div>
                        <div class="meal-ingredients">
                            <strong>Ingredients:</strong> ${snack.ingredients || 'Not specified'}
                        </div>
                        ${snack.prep_time ? `
                            <div style="margin-top: 10px; font-size: 0.9rem;">
                                <strong>Prep time:</strong> ${snack.prep_time}
                            </div>
                        ` : ''}
                        <div style="margin-top: 5px; font-size: 0.9rem; color: #666;">
                            ${snack.instructions || 'Simple snack preparation'}
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

// Missing helper functions
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
        'active': '▶️',
        'completed': '✅',
        'skipped': '⏭️'
    };
    return icons[status] || '⏳';
}

function loadProgress() {
    const saved = Utils.loadFromStorage('exerciseProgress');
    if (saved) {
        exerciseProgress = saved;
    }
    
    const savedDaily = Utils.loadFromStorage('dailyProgress');
    if (savedDaily) {
        dailyProgress = savedDaily;
    }
}

function saveProgress() {
    Utils.saveToStorage('exerciseProgress', exerciseProgress);
    Utils.saveToStorage('dailyProgress', dailyProgress);
}

function setupEventListeners() {
    // Global event listeners for exercise controls
    window.startExercise = startExercise;
    window.pauseExercise = pauseExercise;
    window.resetExercise = resetExercise;
    window.completeExercise = completeExercise;
    window.skipExercise = skipExercise;
    
    // Add logout function
    window.logout = function() {
        if (confirm('Are you sure you want to logout? Your progress will be saved.')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };
}

function updateProgressInfo(workoutData) {
    // Update any progress displays or counters
    console.log('Progress updated:', workoutData.progress);
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
