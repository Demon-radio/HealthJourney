from flask import Flask, request, jsonify, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__)

# Simple in-memory storage
users = {}
workouts = {}

# Load exercise and nutrition data
def load_json_data():
    try:
        with open('data/exercises.json', 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        with open('data/nutrition.json', 'r', encoding='utf-8') as f:
            nutrition = json.load(f)
        return exercises, nutrition
    except Exception as e:
        print(f"Error loading data: {e}")
        return {'exercises': []}, {'tiers': {}}

exercises_data, nutrition_data = load_json_data()

@app.route('/')
def home():
    return send_from_directory('.', 'index_new.html')

@app.route('/profile.html')
def profile():
    return send_from_directory('.', 'profile_new.html')

@app.route('/plan.html')
def plan():
    return send_from_directory('.', 'plan_new.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

@app.route('/api/profile', methods=['POST'])
def create_profile():
    try:
        data = request.get_json()
        
        # Basic validation
        required = ['firstName', 'lastName', 'age', 'height', 'weight', 'gender']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Missing {field}'}), 400
        
        user_id = data.get('user_id', f"user_{int(datetime.now().timestamp())}")
        
        # Calculate BMI and BMR
        height_m = float(data['height']) / 100
        weight = float(data['weight'])
        age = float(data['age'])
        
        bmi = round(weight / (height_m ** 2), 1)
        
        if data['gender'] == 'male':
            bmr = 88.362 + (13.397 * weight) + (4.799 * float(data['height'])) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight) + (3.098 * float(data['height'])) - (4.330 * age)
        
        bmr = round(bmr, 0)
        
        # Store user data
        data['user_id'] = user_id
        data['bmi'] = bmi
        data['bmr'] = bmr
        data['created_at'] = datetime.now().isoformat()
        
        users[user_id] = data
        
        # Initialize workout progress
        workouts[user_id] = {
            'current_day': 1,
            'completed_days': [],
            'start_date': datetime.now().isoformat(),
            'total_calories_burned': 0,
            'streak': 0
        }
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'bmi': bmi,
            'bmr': bmr
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile/<user_id>')
def get_profile(user_id):
    try:
        if user_id in users:
            return jsonify({'success': True, 'data': users[user_id]})
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workout/<user_id>')
def get_workout(user_id):
    try:
        # Get or create user
        if user_id not in users:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user = users[user_id]
        progress = workouts.get(user_id, {'current_day': 1, 'completed_days': [], 'total_calories_burned': 0, 'streak': 0})
        
        # Filter exercises based on user preferences
        filtered_exercises = []
        for exercise in exercises_data.get('exercises', []):
            if (exercise.get('level') == user.get('fitnessLevel', 'beginner') and
                exercise.get('gender') in [user.get('gender', 'male'), 'both']):
                filtered_exercises.append(exercise)
        
        # Limit to 14 exercises for day 1
        workout_exercises = filtered_exercises[:14]
        
        return jsonify({
            'success': True,
            'exercises': workout_exercises,
            'current_day': progress['current_day'],
            'total_exercises': len(workout_exercises),
            'progress': progress
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/nutrition/<user_id>')
def get_nutrition(user_id):
    try:
        if user_id not in users:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user = users[user_id]
        economic_level = user.get('economicLevel', 'medium')
        goal = user.get('goal', 'health')
        bmr = user.get('bmr', 2000)
        
        # Calculate daily calories
        multipliers = {
            'weightLoss': 0.8,
            'muscleGain': 1.3,
            'endurance': 1.4,
            'toning': 1.1,
            'health': 1.2
        }
        
        daily_calories = int(bmr * multipliers.get(goal, 1.2))
        
        # Get nutrition plan
        nutrition_plan = nutrition_data.get('tiers', {}).get(economic_level, {})
        
        return jsonify({
            'success': True,
            'plan': nutrition_plan,
            'daily_calories': daily_calories,
            'economic_level': economic_level
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workout/complete', methods=['POST'])
def complete_exercise():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        exercise_id = data.get('exercise_id')
        duration = data.get('duration', 0)
        
        if user_id not in users:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Calculate calories (simple estimation)
        calories_burned = round(duration * 0.1, 1)  # Simple calculation
        
        # Update progress
        if user_id in workouts:
            workouts[user_id]['total_calories_burned'] += calories_burned
        
        return jsonify({
            'success': True,
            'calories_burned': calories_burned,
            'total_calories': workouts.get(user_id, {}).get('total_calories_burned', 0)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Endpoint not found'}), 404
    return send_from_directory('.', 'index.html')

@app.errorhandler(500)
def server_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Server error'}), 500
    return 'Server error', 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)