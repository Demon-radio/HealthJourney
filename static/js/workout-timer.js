// نظام العد والمؤقت التفاعلي للتمارين
class WorkoutTimer {
    constructor() {
        this.currentExercise = null;
        this.currentSet = 1;
        this.currentRep = 0;
        this.timer = null;
        this.restTimer = null;
        this.isRunning = false;
        this.isResting = false;
        this.totalSets = 3;
        this.currentSetReps = 0;
        this.targetReps = 10;
        this.restTime = 60; // ثوان
        this.currentRestTime = 0;
        
        this.init();
    }

    init() {
        this.createTimerInterface();
        this.bindEvents();
    }

    createTimerInterface() {
        // إنشاء واجهة المؤقت
        const timerContainer = document.createElement('div');
        timerContainer.id = 'workout-timer';
        timerContainer.className = 'workout-timer-container';
        timerContainer.innerHTML = `
            <div class="timer-header">
                <h3 id="exercise-name">اختر تمرين للبدء</h3>
                <div class="exercise-emoji" id="exercise-emoji">💪</div>
            </div>
            
            <div class="timer-stats">
                <div class="stat-item">
                    <span class="stat-label">المجموعة</span>
                    <span class="stat-value" id="current-set">1</span>
                    <span class="stat-total">/ <span id="total-sets">3</span></span>
                </div>
                
                <div class="stat-item">
                    <span class="stat-label">التكرارات</span>
                    <span class="stat-value" id="current-reps">0</span>
                    <span class="stat-total">/ <span id="target-reps">10</span></span>
                </div>
                
                <div class="stat-item">
                    <span class="stat-label">السعرات المحروقة</span>
                    <span class="stat-value" id="calories-burned">0</span>
                </div>
            </div>

            <div class="timer-display">
                <div class="time-circle">
                    <svg class="progress-ring" width="120" height="120">
                        <circle class="progress-ring-background" cx="60" cy="60" r="54"></circle>
                        <circle class="progress-ring-progress" cx="60" cy="60" r="54"></circle>
                    </svg>
                    <div class="time-text">
                        <span id="timer-minutes">00</span>:<span id="timer-seconds">00</span>
                        <div class="timer-label" id="timer-label">مؤقت التمرين</div>
                    </div>
                </div>
            </div>

            <div class="timer-controls">
                <button id="start-exercise-btn" class="timer-btn start-btn">
                    <span class="btn-icon">▶️</span>
                    <span class="btn-text">ابدأ التمرين</span>
                </button>
                
                <button id="rep-complete-btn" class="timer-btn rep-btn" disabled>
                    <span class="btn-icon">✅</span>
                    <span class="btn-text">تكرار مكتمل</span>
                </button>
                
                <button id="set-complete-btn" class="timer-btn set-btn" disabled>
                    <span class="btn-icon">🎯</span>
                    <span class="btn-text">مجموعة مكتملة</span>
                </button>
                
                <button id="stop-exercise-btn" class="timer-btn stop-btn" disabled>
                    <span class="btn-icon">⏹️</span>
                    <span class="btn-text">إيقاف</span>
                </button>
            </div>

            <div class="rest-timer" id="rest-timer" style="display: none;">
                <div class="rest-content">
                    <h4>فترة راحة</h4>
                    <div class="rest-countdown" id="rest-countdown">60</div>
                    <div class="rest-message">استرح واستعد للمجموعة التالية</div>
                    <button id="skip-rest-btn" class="timer-btn skip-btn">تخطي الراحة</button>
                </div>
            </div>

            <div class="exercise-instructions" id="exercise-instructions">
                <h4>تعليمات التمرين</h4>
                <div id="instruction-steps"></div>
            </div>
        `;

        // إضافة المؤقت للصفحة
        const workoutSection = document.querySelector('.workout-section');
        if (workoutSection) {
            workoutSection.appendChild(timerContainer);
        }
    }

    bindEvents() {
        // ربط الأحداث
        document.getElementById('start-exercise-btn')?.addEventListener('click', () => this.startExercise());
        document.getElementById('rep-complete-btn')?.addEventListener('click', () => this.completeRep());
        document.getElementById('set-complete-btn')?.addEventListener('click', () => this.completeSet());
        document.getElementById('stop-exercise-btn')?.addEventListener('click', () => this.stopExercise());
        document.getElementById('skip-rest-btn')?.addEventListener('click', () => this.skipRest());

        // ربط بطاقات التمارين
        document.addEventListener('click', (e) => {
            if (e.target.closest('.exercise-card')) {
                const exerciseCard = e.target.closest('.exercise-card');
                const exerciseId = exerciseCard.dataset.exerciseId;
                if (exerciseId) {
                    this.selectExercise(exerciseId);
                }
            }
        });
    }

    selectExercise(exerciseId) {
        // البحث عن التمرين
        const exercise = this.findExerciseById(exerciseId);
        if (!exercise) return;

        this.currentExercise = exercise;
        this.resetTimer();
        this.updateDisplay();
        this.showInstructions();
    }

    findExerciseById(exerciseId) {
        // البحث في بيانات التمارين
        if (window.AppState && window.AppState.workoutData && window.AppState.workoutData.exercises) {
            return window.AppState.workoutData.exercises.find(ex => ex.id == exerciseId);
        }
        return null;
    }

    startExercise() {
        if (!this.currentExercise) {
            this.showNotification('خطأ', 'يرجى اختيار تمرين أولاً', 'error');
            return;
        }

        this.isRunning = true;
        this.startTimer();
        this.updateControls();
        
        this.showNotification('بدء التمرين', `بدأ تمرين ${this.currentExercise.name}`, 'success');
        
        // تشغيل صوت البدء
        this.playSound('start');
    }

    startTimer() {
        let seconds = 0;
        this.timer = setInterval(() => {
            seconds++;
            this.updateTimerDisplay(seconds);
            this.updateProgressRing(seconds);
        }, 1000);
    }

    completeRep() {
        if (!this.isRunning) return;
        
        this.currentRep++;
        this.currentSetReps++;
        
        // حساب السعرات المحروقة
        const caloriesPerRep = this.currentExercise.calories_per_rep || 0.5;
        const totalCalories = this.currentRep * caloriesPerRep;
        
        this.updateDisplay();
        this.updateCaloriesDisplay(totalCalories);
        
        // صوت إكمال التكرار
        this.playSound('rep');
        
        // تأثير بصري
        this.showRepFeedback();
        
        // تحقق من إكمال المجموعة
        if (this.currentSetReps >= this.targetReps) {
            this.enableSetComplete();
        }
    }

    completeSet() {
        if (!this.isRunning || this.currentSetReps < this.targetReps) return;
        
        this.currentSet++;
        this.currentSetReps = 0;
        
        this.updateDisplay();
        
        // صوت إكمال المجموعة
        this.playSound('set');
        
        // تحقق من إكمال جميع المجموعات
        if (this.currentSet > this.totalSets) {
            this.completeExercise();
            return;
        }
        
        // بدء فترة الراحة
        this.startRest();
    }

    startRest() {
        this.isResting = true;
        this.currentRestTime = this.restTime;
        
        // إيقاف المؤقت الرئيسي
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // إظهار مؤقت الراحة
        document.getElementById('rest-timer').style.display = 'block';
        
        // بدء العد التنازلي للراحة
        this.restTimer = setInterval(() => {
            this.currentRestTime--;
            document.getElementById('rest-countdown').textContent = this.currentRestTime;
            
            if (this.currentRestTime <= 0) {
                this.endRest();
            }
        }, 1000);
        
        this.showNotification('فترة راحة', `راحة لمدة ${this.restTime} ثانية`, 'info');
    }

    endRest() {
        this.isResting = false;
        
        if (this.restTimer) {
            clearInterval(this.restTimer);
        }
        
        document.getElementById('rest-timer').style.display = 'none';
        
        // إعادة تشغيل المؤقت
        this.startTimer();
        
        this.playSound('rest-end');
        this.showNotification('انتهاء الراحة', 'ابدأ المجموعة التالية!', 'success');
    }

    skipRest() {
        if (this.isResting) {
            this.endRest();
        }
    }

    completeExercise() {
        this.stopExercise();
        
        const totalCalories = this.currentRep * (this.currentExercise.calories_per_rep || 0.5);
        
        // إرسال البيانات للخادم
        this.saveWorkoutProgress(totalCalories);
        
        this.showNotification(
            'تهانينا! 🎉', 
            `أكملت تمرين ${this.currentExercise.name}! أحرقت ${totalCalories.toFixed(1)} سعرة حرارية`, 
            'success'
        );
        
        this.playSound('complete');
        this.showCompletionAnimation();
    }

    stopExercise() {
        this.isRunning = false;
        this.isResting = false;
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        if (this.restTimer) {
            clearInterval(this.restTimer);
        }
        
        document.getElementById('rest-timer').style.display = 'none';
        this.updateControls();
    }

    resetTimer() {
        this.currentSet = 1;
        this.currentRep = 0;
        this.currentSetReps = 0;
        this.isRunning = false;
        this.isResting = false;
        
        if (this.currentExercise) {
            this.totalSets = parseInt(this.currentExercise.sets) || 3;
            this.targetReps = parseInt(this.currentExercise.reps) || 10;
            this.restTime = this.currentExercise.rest_seconds || 60;
        }
        
        this.updateDisplay();
        this.updateControls();
    }

    updateDisplay() {
        if (!this.currentExercise) return;
        
        document.getElementById('exercise-name').textContent = this.currentExercise.name;
        document.getElementById('exercise-emoji').textContent = this.currentExercise.emoji;
        document.getElementById('current-set').textContent = this.currentSet;
        document.getElementById('total-sets').textContent = this.totalSets;
        document.getElementById('current-reps').textContent = this.currentSetReps;
        document.getElementById('target-reps').textContent = this.targetReps;
    }

    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('timer-seconds').textContent = remainingSeconds.toString().padStart(2, '0');
    }

    updateCaloriesDisplay(calories) {
        document.getElementById('calories-burned').textContent = calories.toFixed(1);
    }

    updateProgressRing(seconds) {
        const circle = document.querySelector('.progress-ring-progress');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        
        // تحديث دائرة التقدم بناءً على الوقت
        const progress = (seconds % 60) / 60;
        const offset = circumference - (progress * circumference);
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
    }

    updateControls() {
        const startBtn = document.getElementById('start-exercise-btn');
        const repBtn = document.getElementById('rep-complete-btn');
        const setBtn = document.getElementById('set-complete-btn');
        const stopBtn = document.getElementById('stop-exercise-btn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            repBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            repBtn.disabled = true;
            setBtn.disabled = true;
            stopBtn.disabled = true;
        }
    }

    enableSetComplete() {
        document.getElementById('set-complete-btn').disabled = false;
    }

    showInstructions() {
        if (!this.currentExercise) return;
        
        const instructionsContainer = document.getElementById('instruction-steps');
        const userGender = this.getUserGender();
        const instructions = this.currentExercise.instructions[userGender] || this.currentExercise.instructions.male;
        
        instructionsContainer.innerHTML = instructions.map((step, index) => 
            `<div class="instruction-step">
                <span class="step-number">${index + 1}</span>
                <span class="step-text">${step}</span>
            </div>`
        ).join('');
    }

    getUserGender() {
        return window.AppState?.currentUser?.gender || 'male';
    }

    showRepFeedback() {
        // تأثير بصري عند إكمال تكرار
        const repBtn = document.getElementById('rep-complete-btn');
        repBtn.classList.add('pulse-animation');
        setTimeout(() => repBtn.classList.remove('pulse-animation'), 500);
    }

    showCompletionAnimation() {
        // تأثير احتفالي عند إكمال التمرين
        const timerContainer = document.getElementById('workout-timer');
        timerContainer.classList.add('completion-animation');
        setTimeout(() => timerContainer.classList.remove('completion-animation'), 2000);
    }

    async saveWorkoutProgress(caloriesBurned) {
        try {
            if (window.AppState?.currentUser?.user_id) {
                const response = await fetch('/api/workout/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: window.AppState.currentUser.user_id,
                        exercise_id: this.currentExercise.id,
                        duration: Math.floor((Date.now() - this.startTime) / 1000),
                        calories_burned: caloriesBurned,
                        sets_completed: this.currentSet - 1,
                        reps_completed: this.currentRep
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log('تم حفظ تقدم التمرين بنجاح');
                }
            }
        } catch (error) {
            console.error('خطأ في حفظ تقدم التمرين:', error);
        }
    }

    playSound(type) {
        // تشغيل الأصوات (يمكن إضافة ملفات صوتية فعلية)
        try {
            const audio = new Audio();
            switch(type) {
                case 'start':
                    // صوت البدء
                    break;
                case 'rep':
                    // صوت إكمال التكرار
                    break;
                case 'set':
                    // صوت إكمال المجموعة
                    break;
                case 'complete':
                    // صوت إكمال التمرين
                    break;
                case 'rest-end':
                    // صوت انتهاء الراحة
                    break;
            }
        } catch (error) {
            console.log('لا يمكن تشغيل الصوت');
        }
    }

    showNotification(title, message, type = 'info') {
        // استخدام نظام الإشعارات الموجود
        if (window.AppState && window.AppState.showNotification) {
            window.AppState.showNotification(title, message, type);
        }
    }
}

// تشغيل نظام المؤقت عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.workout-section')) {
        window.workoutTimer = new WorkoutTimer();
    }
});