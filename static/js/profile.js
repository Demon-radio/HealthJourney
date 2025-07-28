// Profile form handling
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
        
        // Load existing profile data if available
        loadExistingProfile();
        
        // Add real-time BMI calculation
        setupBMICalculation();
    }
});

function loadExistingProfile() {
    const userData = Utils.loadFromStorage('userData');
    if (userData) {
        // Fill form with existing data
        Object.keys(userData).forEach(key => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'radio') {
                    const radio = document.querySelector(`[name="${key}"][value="${userData[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    element.value = userData[key];
                }
            }
        });
    }
}

function setupBMICalculation() {
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    
    if (heightInput && weightInput) {
        const updateBMI = () => {
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);
            
            if (height && weight) {
                const bmi = Utils.calculateBMI(weight, height);
                const category = Utils.getBMICategory(parseFloat(bmi));
                
                // Show BMI preview
                showBMIPreview(bmi, category);
            }
        };
        
        heightInput.addEventListener('input', updateBMI);
        weightInput.addEventListener('input', updateBMI);
    }
}

function showBMIPreview(bmi, category) {
    let previewElement = document.getElementById('bmi-preview');
    
    if (!previewElement) {
        previewElement = document.createElement('div');
        previewElement.id = 'bmi-preview';
        previewElement.style.cssText = `
            background: #f0f4ff;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            border-left: 4px solid ${category.color};
        `;
        
        const weightInput = document.getElementById('weight');
        weightInput.parentNode.appendChild(previewElement);
    }
    
    previewElement.innerHTML = `
        <strong>BMI Preview: ${bmi}</strong>
        <div style="color: ${category.color}; font-weight: bold; margin-top: 5px;">
            ${category.category}
        </div>
    `;
}

async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        profileData[key] = value;
    }
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'age', 'height', 'weight', 'gender'];
    for (const field of requiredFields) {
        if (!profileData[field] || profileData[field].trim() === '') {
            NotificationSystem.show(
                'Missing Information',
                `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
                'warning'
            );
            return;
        }
    }
    
    // Convert numeric fields
    ['age', 'height', 'weight'].forEach(field => {
        if (profileData[field]) {
            profileData[field] = parseFloat(profileData[field]);
            if (isNaN(profileData[field])) {
                NotificationSystem.show(
                    'Invalid Data',
                    `Please enter a valid number for ${field}.`,
                    'warning'
                );
                return;
            }
        }
    });
    
    // Generate user ID if not exists
    if (!profileData.user_id) {
        profileData.user_id = Utils.generateUserId();
    }
    
    try {
        // Show loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Profile...';
        submitBtn.disabled = true;
        
        console.log('Submitting profile data:', profileData);
        
        // Save to server
        const response = await API.saveProfile(profileData);
        
        console.log('Profile save response:', response);
        
        if (response.success) {
            // Save to localStorage
            profileData.bmi = response.bmi;
            profileData.bmr = response.bmr;
            const saveSuccess = Utils.saveToStorage('userData', profileData);
            
            console.log('Profile saved to localStorage:', saveSuccess, profileData);
            
            // Show success notification
            NotificationSystem.show(
                'Profile Created!', 
                'Your personalized plan is ready.',
                'success'
            );
            
            // Redirect to plan page after short delay
            setTimeout(() => {
                window.location.href = 'plan.html';
            }, 2000);
        } else {
            throw new Error(response.error || 'Failed to create profile');
        }
    } catch (error) {
        console.error('Profile creation failed:', error);
        NotificationSystem.show(
            'Profile Creation Failed',
            error.message || 'Please check your information and try again.',
            'danger'
        );
        
        // Reset submit button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Time preference validation
document.addEventListener('change', function(event) {
    if (event.target.name === 'preferredTime') {
        const time = event.target.value;
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        
        // Check if selected time is in the past today
        const selectedTime = new Date();
        selectedTime.setHours(hours, minutes, 0, 0);
        
        if (selectedTime < now) {
            const nextDay = new Date(selectedTime);
            nextDay.setDate(nextDay.getDate() + 1);
            
            NotificationSystem.show(
                'Time Notice',
                `Your workout time is set for ${time}. Since it's past that time today, your first workout will be tomorrow.`,
                'info'
            );
        }
    }
});

// Form validation enhancements
function validateForm() {
    const requiredFields = [
        'firstName', 'lastName', 'age', 'height', 
        'weight', 'gender', 'fitnessLevel', 'goal', 
        'preferredTime', 'economicLevel'
    ];
    
    let isValid = true;
    const errors = [];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field) || 
                       document.querySelector(`[name="${field}"]:checked`);
        
        if (!element || !element.value) {
            isValid = false;
            errors.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
        }
    });
    
    // Additional validations
    const age = document.getElementById('age');
    if (age && (age.value < 12 || age.value > 100)) {
        isValid = false;
        errors.push('age must be between 12 and 100');
    }
    
    const height = document.getElementById('height');
    if (height && (height.value < 100 || height.value > 250)) {
        isValid = false;
        errors.push('height must be between 100 and 250 cm');
    }
    
    const weight = document.getElementById('weight');
    if (weight && (weight.value < 30 || weight.value > 200)) {
        isValid = false;
        errors.push('weight must be between 30 and 200 kg');
    }
    
    if (!isValid) {
        NotificationSystem.show(
            'Validation Error',
            `Please check: ${errors.join(', ')}`,
            'warning'
        );
    }
    
    return isValid;
}

// Add validation to form submit
document.addEventListener('submit', function(event) {
    if (event.target.id === 'profileForm') {
        if (!validateForm()) {
            event.preventDefault();
        }
    }
});

// Gender-based UI updates
document.addEventListener('change', function(event) {
    if (event.target.name === 'gender') {
        const header = document.querySelector('header');
        const body = document.body;
        
        if (event.target.value === 'female') {
            header.classList.add('female');
            body.style.setProperty('--primary', '#ff69b4');
        } else {
            header.classList.remove('female');
            body.style.setProperty('--primary', '#4a6bff');
        }
    }
});
