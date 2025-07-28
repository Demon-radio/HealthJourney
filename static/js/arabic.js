// Arabic translation and RTL support
class ArabicTranslation {
    constructor() {
        this.currentLanguage = localStorage.getItem('appLanguage') || 'en';
        this.translations = {
            en: {
                // Navigation
                'home': 'Home',
                'profile': 'Profile',
                'plan': 'Training Plan',
                'logout': 'Logout',
                'back': 'Back',
                
                // Home page
                'hero_title': 'Transform Your Body, Transform Your Life',
                'hero_subtitle': 'Get personalized workout plans and nutrition guidance tailored to your goals, fitness level, and budget.',
                'start_journey': 'Start Your Journey',
                'learn_more': 'Learn More',
                'exercises_per_day': 'Exercises per day',
                'nutrition_tiers': 'Nutrition tiers',
                'progress_tracking': 'Progress tracking',
                
                // Features
                'features_title': 'Everything You Need to Succeed',
                'progressive_workouts': 'Progressive Workouts',
                'smart_nutrition': 'Smart Nutrition',
                'progress_tracking_full': 'Progress Tracking',
                'smart_reminders': 'Smart Reminders',
                
                // Exercise names and instructions
                'push_ups': 'Push-ups',
                'squats': 'Squats',
                'plank': 'Plank',
                'burpees': 'Burpees',
                'lunges': 'Lunges',
                'mountain_climbers': 'Mountain Climbers',
                'tricep_dips': 'Tricep Dips',
                'russian_twists': 'Russian Twists',
                'step_ups': 'Step-ups',
                
                // Exercise controls
                'start_exercise': 'Start Exercise',
                'pause': 'Pause',
                'reset': 'Reset',
                'complete_exercise': 'Complete Exercise',
                'skip_exercise': 'Skip Exercise',
                'duration': 'Duration',
                'level': 'Level',
                'focus': 'Focus',
                'instructions': 'Instructions',
                'tip': 'Tip',
                
                // Notifications
                'exercise_started': 'Exercise Started',
                'exercise_paused': 'Exercise Paused',
                'exercise_completed': 'Exercise Completed!',
                'exercise_skipped': 'Exercise Skipped',
                'great_job': 'Great job! You burned',
                'calories': 'calories',
                'try_next_time': 'Try to complete it next time!',
                
                // Profile
                'create_profile': 'Create Your Profile',
                'personal_info': 'Personal Information',
                'fitness_goals': 'Fitness Goals',
                'preferences': 'Preferences',
                'first_name': 'First Name',
                'last_name': 'Last Name',
                'age': 'Age',
                'height': 'Height (cm)',
                'weight': 'Weight (kg)',
                'gender': 'Gender',
                'male': 'Male',
                'female': 'Female',
                
                // Goals
                'weight_loss': 'Weight Loss',
                'muscle_gain': 'Muscle Gain',
                'endurance': 'Endurance',
                'toning': 'Toning',
                'general_health': 'General Health',
                
                // Levels
                'beginner': 'Beginner',
                'intermediate': 'Intermediate',
                'advanced': 'Advanced'
            },
            ar: {
                // Navigation
                'home': 'الرئيسية',
                'profile': 'الملف الشخصي',
                'plan': 'خطة التدريب',
                'logout': 'تسجيل خروج',
                'back': 'رجوع',
                
                // Home page
                'hero_title': 'غير جسمك، غير حياتك',
                'hero_subtitle': 'احصل على خطط تدريب مخصصة وإرشادات تغذية مصممة خصيصاً لأهدافك ومستوى لياقتك وميزانيتك.',
                'start_journey': 'ابدأ رحلتك',
                'learn_more': 'اعرف أكثر',
                'exercises_per_day': 'تمرين يومياً',
                'nutrition_tiers': 'مستويات التغذية',
                'progress_tracking': 'تتبع التقدم',
                
                // Features
                'features_title': 'كل ما تحتاجه للنجاح',
                'progressive_workouts': 'تمارين متدرجة',
                'smart_nutrition': 'تغذية ذكية',
                'progress_tracking_full': 'تتبع التقدم',
                'smart_reminders': 'تذكيرات ذكية',
                
                // Exercise names and instructions
                'push_ups': 'تمرين الضغط',
                'squats': 'تمرين القرفصاء',
                'plank': 'تمرين البلانك',
                'burpees': 'تمرين البيربي',
                'lunges': 'تمرين الاندفاع',
                'mountain_climbers': 'متسلق الجبال',
                'tricep_dips': 'تمرين العضلة ثلاثية الرؤوس',
                'russian_twists': 'الالتواء الروسي',
                'step_ups': 'صعود الدرجة',
                
                // Exercise controls
                'start_exercise': 'ابدأ التمرين',
                'pause': 'توقف',
                'reset': 'إعادة تعيين',
                'complete_exercise': 'إنهاء التمرين',
                'skip_exercise': 'تخطي التمرين',
                'duration': 'المدة',
                'level': 'المستوى',
                'focus': 'التركيز',
                'instructions': 'التعليمات',
                'tip': 'نصيحة',
                
                // Notifications
                'exercise_started': 'بدأ التمرين',
                'exercise_paused': 'توقف التمرين',
                'exercise_completed': 'تم إنهاء التمرين!',
                'exercise_skipped': 'تم تخطي التمرين',
                'great_job': 'أحسنت! لقد أحرقت',
                'calories': 'سعرة حرارية',
                'try_next_time': 'حاول إكماله في المرة القادمة!',
                
                // Profile
                'create_profile': 'إنشاء ملفك الشخصي',
                'personal_info': 'المعلومات الشخصية',
                'fitness_goals': 'أهداف اللياقة',
                'preferences': 'التفضيلات',
                'first_name': 'الاسم الأول',
                'last_name': 'اسم العائلة',
                'age': 'العمر',
                'height': 'الطول (سم)',
                'weight': 'الوزن (كج)',
                'gender': 'الجنس',
                'male': 'ذكر',
                'female': 'أنثى',
                
                // Goals
                'weight_loss': 'فقدان الوزن',
                'muscle_gain': 'بناء العضلات',
                'endurance': 'التحمل',
                'toning': 'شد الجسم',
                'general_health': 'الصحة العامة',
                
                // Levels
                'beginner': 'مبتدئ',
                'intermediate': 'متوسط',
                'advanced': 'متقدم'
            }
        };
        
        this.exerciseImages = {
            'push_ups': '💪',
            'squats': '🦵',
            'plank': '🏋️',
            'burpees': '🔥',
            'lunges': '🚶',
            'mountain_climbers': '⛰️',
            'tricep_dips': '💺',
            'russian_twists': '🌪️',
            'step_ups': '📏'
        };
        
        this.init();
    }
    
    init() {
        this.createLanguageToggle();
        this.applyLanguage();
    }
    
    createLanguageToggle() {
        const toggle = document.createElement('div');
        toggle.className = 'language-toggle';
        toggle.innerHTML = `
            <button onclick="arabic.toggleLanguage()" class="lang-btn">
                ${this.currentLanguage === 'ar' ? 'EN' : 'ع'}
            </button>
        `;
        
        // Add to header
        const header = document.querySelector('header .container');
        if (header) {
            header.appendChild(toggle);
        }
    }
    
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        localStorage.setItem('appLanguage', this.currentLanguage);
        this.applyLanguage();
        
        // Reload page content if on plan page
        if (window.location.pathname.includes('plan.html') && window.app) {
            setTimeout(() => {
                window.app.initPlanPage();
            }, 100);
        }
    }
    
    applyLanguage() {
        // Set HTML direction
        document.documentElement.setAttribute('dir', this.currentLanguage === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', this.currentLanguage);
        
        // Apply translations
        this.translatePage();
        
        // Update toggle button
        const langBtn = document.querySelector('.lang-btn');
        if (langBtn) {
            langBtn.textContent = this.currentLanguage === 'ar' ? 'EN' : 'ع';
        }
    }
    
    translatePage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.t(key);
            if (translation) {
                element.textContent = translation;
            }
        });
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || this.translations['en'][key] || key;
    }
    
    getExerciseEmoji(exerciseName) {
        const key = exerciseName.toLowerCase().replace(/[^a-z]/g, '_');
        return this.exerciseImages[key] || '🏋️';
    }
}

// Exercise Modal System
class ExerciseModal {
    constructor() {
        this.currentExercise = null;
        this.timer = null;
        this.timeElapsed = 0;
        this.isRunning = false;
        this.init();
    }
    
    init() {
        this.createModal();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'exerciseModal';
        modal.className = 'exercise-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalExerciseName">Exercise</h2>
                    <button class="modal-close" onclick="exerciseModal.close()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="exercise-animation">
                        <div id="exerciseGif" class="exercise-gif">🏋️</div>
                        <div id="exerciseInstructions" class="exercise-instructions-modal">
                            <p>Follow the animation and complete the exercise</p>
                        </div>
                    </div>
                    <div class="exercise-timer-modal">
                        <div id="timerDisplay" class="timer-display-modal">00:00</div>
                        <div class="timer-progress">
                            <div id="progressBar" class="progress-bar"></div>
                        </div>
                    </div>
                    <div class="modal-controls">
                        <button id="startBtn" class="btn btn-success" onclick="exerciseModal.startTimer()">
                            ${arabic.t('start_exercise')}
                        </button>
                        <button id="pauseBtn" class="btn btn-warning" onclick="exerciseModal.pauseTimer()">
                            ${arabic.t('pause')}
                        </button>
                        <button id="completeBtn" class="btn btn-primary" onclick="exerciseModal.completeExercise()">
                            ${arabic.t('complete_exercise')}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    open(exercise) {
        this.currentExercise = exercise;
        this.timeElapsed = 0;
        this.isRunning = false;
        
        const modal = document.getElementById('exerciseModal');
        const exerciseName = document.getElementById('modalExerciseName');
        const exerciseGif = document.getElementById('exerciseGif');
        const instructions = document.getElementById('exerciseInstructions');
        
        // Set exercise name
        const translatedName = arabic.t(exercise.name.toLowerCase().replace(/[^a-z]/g, '_')) || exercise.name;
        exerciseName.textContent = translatedName;
        
        // Set exercise animation/emoji
        exerciseGif.textContent = arabic.getExerciseEmoji(exercise.name);
        exerciseGif.className = 'exercise-gif animated-exercise';
        
        // Set instructions
        const gender = app.currentUser?.gender || 'male';
        const exerciseInstructions = exercise.instructions?.[gender] || exercise.instructions?.male || ['Follow the demonstration'];
        instructions.innerHTML = `
            <h4>${arabic.t('instructions')}:</h4>
            <ol>
                ${exerciseInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ol>
            ${exercise.tips ? `<p><strong>${arabic.t('tip')}:</strong> ${exercise.tips}</p>` : ''}
        `;
        
        // Reset timer display
        this.updateTimerDisplay();
        this.updateProgressBar();
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add animation class to exercise emoji
        setTimeout(() => {
            exerciseGif.classList.add('bouncing');
        }, 100);
    }
    
    close() {
        const modal = document.getElementById('exerciseModal');
        modal.style.display = 'none';
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isRunning = false;
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        this.timer = setInterval(() => {
            this.timeElapsed++;
            this.updateTimerDisplay();
            this.updateProgressBar();
            
            // Auto complete when reaching exercise duration
            if (this.timeElapsed >= this.currentExercise.duration) {
                this.completeExercise();
            }
        }, 1000);
        
        // Update button states
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        // Show encouragement
        app.showNotification(arabic.t('exercise_started'), 'Go! You can do it! 💪', 'success');
    }
    
    pauseTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timer);
        this.timer = null;
        
        // Update button states
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        app.showNotification(arabic.t('exercise_paused'), 'Take a breath and continue when ready!', 'warning');
    }
    
    async completeExercise() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isRunning = false;
        
        const caloriesBurned = Math.round(this.timeElapsed * 0.1);
        
        // Save progress
        try {
            await app.completeExercise(this.currentExercise.id, this.timeElapsed);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
        
        // Show celebration
        this.showCelebration(caloriesBurned);
        
        // Close modal after celebration
        setTimeout(() => {
            this.close();
        }, 3000);
    }
    
    showCelebration(calories) {
        const modal = document.querySelector('.modal-content');
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>${arabic.t('exercise_completed')}</h2>
                <p>${arabic.t('great_job')} ${calories} ${arabic.t('calories')}!</p>
                <div class="celebration-animation">
                    <span class="confetti">🎊</span>
                    <span class="confetti">⭐</span>
                    <span class="confetti">🏆</span>
                    <span class="confetti">💪</span>
                </div>
            </div>
        `;
        
        modal.appendChild(celebration);
        
        // Animate confetti
        setTimeout(() => {
            celebration.classList.add('animate');
        }, 100);
    }
    
    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        const progress = Math.min((this.timeElapsed / this.currentExercise.duration) * 100, 100);
        progressBar.style.width = progress + '%';
    }
}

// Initialize
let arabic, exerciseModal;
document.addEventListener('DOMContentLoaded', function() {
    arabic = new ArabicTranslation();
    exerciseModal = new ExerciseModal();
});