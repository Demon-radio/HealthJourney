// نظام التدريب الفعلي
class WorkoutSystem {
    constructor() {
        this.currentWorkout = null;
        this.currentExercise = 0;
        this.isActive = false;
        this.timer = null;
        this.startTime = null;
        this.totalTimeSpent = 0;
        this.caloriesBurned = 0;
        this.exercisesCompleted = 0;
        
        // تحميل البيانات المحفوظة
        this.loadProgress();
    }

    // بدء التدريب
    startWorkout() {
        if (!this.currentWorkout) {
            this.loadTodayWorkout();
        }
        
        this.isActive = true;
        this.startTime = new Date();
        this.showWorkoutInterface();
        this.startCurrentExercise();
        
        // إشعار البداية
        this.showNotification('🚀 بدأ التدريب! حافظ على وتيرة ثابتة', 'success');
    }

    // تحميل تدريب اليوم
    loadTodayWorkout() {
        const exercises = [
            {
                name: 'تمرين الضغط',
                emoji: '💪',
                sets: 3,
                reps: 12,
                duration: 30,
                restTime: 60,
                caloriesPerMinute: 8,
                instructions: 'ضع يديك على الأرض بعرض الكتفين، انزل صدرك حتى يلامس الأرض ثم ادفع لأعلى'
            },
            {
                name: 'تمرين القرفصاء',
                emoji: '🦵',
                sets: 3,
                reps: 15,
                duration: 45,
                restTime: 60,
                caloriesPerMinute: 6,
                instructions: 'قف مع مباعدة القدمين بعرض الكتفين، انزل كأنك تجلس على كرسي ثم قف'
            },
            {
                name: 'تمرين اللوح',
                emoji: '🏋️',
                sets: 3,
                reps: 0,
                duration: 45,
                restTime: 60,
                caloriesPerMinute: 5,
                instructions: 'ادعم جسمك على المرفقين وأصابع القدمين، حافظ على جسمك مستقيماً'
            },
            {
                name: 'تمرين الطعن',
                emoji: '🤸',
                sets: 3,
                reps: 10,
                duration: 40,
                restTime: 60,
                caloriesPerMinute: 7,
                instructions: 'تقدم بقدم واحدة، انزل الركبة الخلفية حتى تلامس الأرض ثم عد للوضع الأصلي'
            },
            {
                name: 'تمرين بيربي',
                emoji: '🔥',
                sets: 3,
                reps: 8,
                duration: 30,
                restTime: 90,
                caloriesPerMinute: 12,
                instructions: 'اقفز، انزل للوضع السفلي، اعمل ضغطة، اقفز مرة أخرى'
            },
            {
                name: 'تسلق الجبال',
                emoji: '🏃',
                sets: 3,
                reps: 0,
                duration: 30,
                restTime: 60,
                caloriesPerMinute: 10,
                instructions: 'في وضع الضغط، احرك ركبتيك بالتناوب نحو الصدر بسرعة'
            }
        ];
        
        this.currentWorkout = {
            day: this.getCurrentDay(),
            exercises: exercises,
            totalExercises: exercises.length,
            estimatedTime: exercises.reduce((total, ex) => total + (ex.duration * ex.sets) + (ex.restTime * ex.sets), 0) / 60
        };
    }

    // عرض واجهة التدريب
    showWorkoutInterface() {
        const workoutModal = document.createElement('div');
        workoutModal.id = 'workoutModal';
        workoutModal.className = 'workout-modal active';
        workoutModal.innerHTML = this.getWorkoutModalHTML();
        
        document.body.appendChild(workoutModal);
        
        // إضافة أحداث الضغط
        this.attachWorkoutEvents();
    }

    // HTML واجهة التدريب
    getWorkoutModalHTML() {
        const exercise = this.currentWorkout.exercises[this.currentExercise];
        return `
            <div class="workout-modal-content">
                <div class="workout-header">
                    <h2>🏋️ جلسة التدريب</h2>
                    <button class="close-workout" onclick="workoutSystem.pauseWorkout()">⏸️</button>
                </div>
                
                <div class="workout-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.currentExercise / this.currentWorkout.totalExercises) * 100}%"></div>
                    </div>
                    <span class="progress-text">${this.currentExercise + 1} من ${this.currentWorkout.totalExercises}</span>
                </div>
                
                <div class="current-exercise">
                    <div class="exercise-emoji">${exercise.emoji}</div>
                    <h3 class="exercise-name">${exercise.name}</h3>
                    <p class="exercise-instructions">${exercise.instructions}</p>
                    
                    <div class="exercise-details">
                        <div class="detail-item">
                            <span class="detail-label">المجموعات</span>
                            <span class="detail-value" id="currentSet">1 من ${exercise.sets}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">${exercise.reps > 0 ? 'التكرارات' : 'المدة'}</span>
                            <span class="detail-value">${exercise.reps > 0 ? exercise.reps : exercise.duration + ' ثانية'}</span>
                        </div>
                    </div>
                    
                    <div class="timer-section">
                        <div class="timer-display" id="timerDisplay">00:00</div>
                        <div class="timer-label" id="timerLabel">اضغط للبدء</div>
                    </div>
                    
                    <div class="workout-controls">
                        <button class="btn btn-start" id="startExerciseBtn" onclick="workoutSystem.startExerciseTimer()">
                            🚀 ابدأ التمرين
                        </button>
                        <button class="btn btn-complete" id="completeSetBtn" onclick="workoutSystem.completeSet()" style="display: none;">
                            ✅ إنهاء المجموعة
                        </button>
                        <button class="btn btn-skip" onclick="workoutSystem.skipExercise()">
                            ⏭️ تخطي
                        </button>
                    </div>
                </div>
                
                <div class="workout-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="totalTime">${this.formatTime(this.totalTimeSpent)}</span>
                        <span class="stat-label">الوقت الإجمالي</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="caloriesBurned">${Math.round(this.caloriesBurned)}</span>
                        <span class="stat-label">سعرات محروقة</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="exercisesCount">${this.exercisesCompleted}</span>
                        <span class="stat-label">تمارين مكتملة</span>
                    </div>
                </div>
            </div>
        `;
    }

    // بدء تايمر التمرين
    startExerciseTimer() {
        const exercise = this.currentWorkout.exercises[this.currentExercise];
        const startBtn = document.getElementById('startExerciseBtn');
        const completeBtn = document.getElementById('completeSetBtn');
        const timerDisplay = document.getElementById('timerDisplay');
        const timerLabel = document.getElementById('timerLabel');
        
        startBtn.style.display = 'none';
        completeBtn.style.display = 'inline-block';
        timerLabel.textContent = 'جاري التمرين...';
        
        let timeLeft = exercise.duration;
        this.timer = setInterval(() => {
            timerDisplay.textContent = this.formatTime(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.completeSet();
                return;
            }
            
            timeLeft--;
            
            // حساب السعرات المحروقة
            this.caloriesBurned += exercise.caloriesPerMinute / 60;
            this.updateStats();
            
        }, 1000);
    }

    // إنهاء المجموعة
    completeSet() {
        clearInterval(this.timer);
        const exercise = this.currentWorkout.exercises[this.currentExercise];
        
        // تحديث الإحصائيات
        this.totalTimeSpent += exercise.duration;
        
        // التحقق من المجموعات
        const currentSetElement = document.getElementById('currentSet');
        const currentSetNumber = parseInt(currentSetElement.textContent.split(' ')[0]);
        
        if (currentSetNumber < exercise.sets) {
            // بدء فترة الراحة
            this.startRestPeriod(currentSetNumber + 1, exercise);
        } else {
            // الانتقال للتمرين التالي
            this.exercisesCompleted++;
            this.nextExercise();
        }
        
        this.saveProgress();
    }

    // فترة الراحة
    startRestPeriod(nextSet, exercise) {
        const timerDisplay = document.getElementById('timerDisplay');
        const timerLabel = document.getElementById('timerLabel');
        const startBtn = document.getElementById('startExerciseBtn');
        const completeBtn = document.getElementById('completeSetBtn');
        
        timerLabel.textContent = 'فترة راحة';
        startBtn.style.display = 'none';
        completeBtn.style.display = 'none';
        
        let restTime = exercise.restTime;
        this.timer = setInterval(() => {
            timerDisplay.textContent = this.formatTime(restTime);
            
            if (restTime <= 0) {
                clearInterval(this.timer);
                
                // تحديث رقم المجموعة
                document.getElementById('currentSet').textContent = `${nextSet} من ${exercise.sets}`;
                
                startBtn.style.display = 'inline-block';
                timerLabel.textContent = 'استعد للمجموعة التالية';
                timerDisplay.textContent = '00:00';
                
                this.showNotification('🔥 استعد! المجموعة التالية ستبدأ', 'info');
                return;
            }
            
            restTime--;
        }, 1000);
    }

    // الانتقال للتمرين التالي
    nextExercise() {
        if (this.currentExercise < this.currentWorkout.totalExercises - 1) {
            this.currentExercise++;
            this.updateWorkoutInterface();
            this.showNotification('💪 تمرين جديد! أنت تقوم بعمل رائع', 'success');
        } else {
            this.completeWorkout();
        }
    }

    // تخطي التمرين
    skipExercise() {
        if (confirm('هل أنت متأكد من تخطي هذا التمرين؟')) {
            clearInterval(this.timer);
            this.nextExercise();
        }
    }

    // تحديث واجهة التدريب
    updateWorkoutInterface() {
        const modal = document.getElementById('workoutModal');
        if (modal) {
            modal.innerHTML = this.getWorkoutModalHTML();
            this.attachWorkoutEvents();
        }
    }

    // إنهاء التدريب
    completeWorkout() {
        clearInterval(this.timer);
        
        const totalTime = Math.round((new Date() - this.startTime) / 1000 / 60);
        this.totalTimeSpent = totalTime * 60;
        
        // حفظ الإنجاز
        this.saveWorkoutCompletion();
        
        // عرض شاشة التهنئة
        this.showCompletionScreen();
        
        this.isActive = false;
    }

    // شاشة التهنئة
    showCompletionScreen() {
        const modal = document.getElementById('workoutModal');
        modal.innerHTML = `
            <div class="completion-screen">
                <div class="completion-header">
                    <div class="trophy-icon">🏆</div>
                    <h2>تهانينا! أنجزت التدريب</h2>
                    <p>لقد أكملت جلسة تدريب رائعة اليوم</p>
                </div>
                
                <div class="completion-stats">
                    <div class="stat-card">
                        <div class="stat-number">${this.formatTime(this.totalTimeSpent)}</div>
                        <div class="stat-label">إجمالي الوقت</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Math.round(this.caloriesBurned)}</div>
                        <div class="stat-label">سعرات محروقة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.exercisesCompleted}</div>
                        <div class="stat-label">تمارين مكتملة</div>
                    </div>
                </div>
                
                <div class="completion-actions">
                    <button class="btn btn-primary" onclick="workoutSystem.closeWorkout()">
                        🎯 العودة للخطة
                    </button>
                    <button class="btn btn-secondary" onclick="workoutSystem.shareAchievement()">
                        📱 مشاركة الإنجاز
                    </button>
                </div>
                
                <div class="motivational-message">
                    <p>💪 استمر على هذا المستوى! كل يوم تقترب أكثر من هدفك</p>
                </div>
            </div>
        `;
    }

    // حفظ إكمال التدريب
    saveWorkoutCompletion() {
        const today = new Date().toDateString();
        let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '{}');
        let userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
        
        // حفظ تدريب اليوم
        workoutHistory[today] = {
            day: this.getCurrentDay(),
            exercisesCompleted: this.exercisesCompleted,
            totalTime: this.totalTimeSpent,
            caloriesBurned: Math.round(this.caloriesBurned),
            completedAt: new Date().toISOString()
        };
        
        // تحديث الإحصائيات العامة
        userStats.totalWorkouts = (userStats.totalWorkouts || 0) + 1;
        userStats.totalTime = (userStats.totalTime || 0) + this.totalTimeSpent;
        userStats.totalCalories = (userStats.totalCalories || 0) + this.caloriesBurned;
        userStats.currentStreak = this.calculateStreak(workoutHistory);
        userStats.lastWorkout = today;
        
        localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
        localStorage.setItem('userStats', JSON.stringify(userStats));
        
        this.updateProgressIndicators();
    }

    // حساب الخط المتواصل
    calculateStreak(history) {
        const dates = Object.keys(history).sort().reverse();
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const date = new Date(dates[i]);
            const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === i) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    // تحديث مؤشرات التقدم
    updateProgressIndicators() {
        const today = new Date().toDateString();
        const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '{}');
        
        // تحديث دوائر الأيام
        const dayCircles = document.querySelectorAll('.day-circle');
        dayCircles.forEach((circle, index) => {
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - (dayCircles.length - 1 - index));
            const dateString = dayDate.toDateString();
            
            if (workoutHistory[dateString]) {
                circle.classList.add('completed');
                circle.innerHTML = `${index + 1}<span class="completed-indicator">✓</span>`;
            }
        });
        
        // تحديث الإحصائيات في الصفحة الرئيسية
        this.updateMainPageStats();
    }

    // تحديث إحصائيات الصفحة الرئيسية
    updateMainPageStats() {
        const userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
        const today = new Date().toDateString();
        const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '{}');
        
        // تحديث اليوم الحالي
        const currentDayElement = document.querySelector('.stat-card .stat-number:first-child');
        if (currentDayElement) {
            currentDayElement.textContent = this.getCurrentDay();
        }
        
        // تحديث الأيام المكتملة
        const completedDaysElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
        if (completedDaysElement) {
            completedDaysElement.textContent = Object.keys(workoutHistory).length;
        }
        
        // تحديث السعرات المحروقة
        const caloriesElement = document.querySelector('.stat-card:nth-child(4) .stat-number');
        if (caloriesElement) {
            caloriesElement.textContent = Math.round(userStats.totalCalories || 0);
        }
    }

    // إرفاق الأحداث
    attachWorkoutEvents() {
        // إغلاق النافذة عند الضغط خارجها
        const modal = document.getElementById('workoutModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.pauseWorkout();
            }
        });
    }

    // إيقاف التدريب مؤقتاً
    pauseWorkout() {
        if (confirm('هل تريد إيقاف التدريب؟ سيتم حفظ تقدمك.')) {
            clearInterval(this.timer);
            this.saveProgress();
            this.closeWorkout();
        }
    }

    // إغلاق واجهة التدريب
    closeWorkout() {
        const modal = document.getElementById('workoutModal');
        if (modal) {
            modal.remove();
        }
        this.isActive = false;
    }

    // مشاركة الإنجاز
    shareAchievement() {
        const text = `🏆 أنجزت للتو تدريباً رائعاً!\n⏱️ الوقت: ${this.formatTime(this.totalTimeSpent)}\n🔥 السعرات: ${Math.round(this.caloriesBurned)}\n💪 التمارين: ${this.exercisesCompleted}\n\n#تدريب_نادي #لياقة`;
        
        if (navigator.share) {
            navigator.share({
                title: 'إنجاز تدريبي',
                text: text
            });
        } else {
            navigator.clipboard.writeText(text);
            this.showNotification('📋 تم نسخ الإنجاز للحافظة', 'success');
        }
    }

    // حفظ التقدم
    saveProgress() {
        const progressData = {
            currentWorkout: this.currentWorkout,
            currentExercise: this.currentExercise,
            totalTimeSpent: this.totalTimeSpent,
            caloriesBurned: this.caloriesBurned,
            exercisesCompleted: this.exercisesCompleted,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('workoutProgress', JSON.stringify(progressData));
    }

    // تحميل التقدم
    loadProgress() {
        const saved = localStorage.getItem('workoutProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentWorkout = data.currentWorkout;
                this.currentExercise = data.currentExercise || 0;
                this.totalTimeSpent = data.totalTimeSpent || 0;
                this.caloriesBurned = data.caloriesBurned || 0;
                this.exercisesCompleted = data.exercisesCompleted || 0;
            } catch (e) {
                console.log('خطأ في تحميل التقدم المحفوظ');
            }
        }
    }

    // الحصول على اليوم الحالي
    getCurrentDay() {
        const userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
        const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '{}');
        return Object.keys(workoutHistory).length + 1;
    }

    // تنسيق الوقت
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `workout-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// إنشاء نظام التدريب العالمي
const workoutSystem = new WorkoutSystem();

// تصدير النظام للاستخدام العالمي
window.workoutSystem = workoutSystem;