from flask import Flask, request, jsonify, render_template, send_from_directory
import json
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# In-memory storage for user data
users_data = {}
workout_progress = {}

# Load exercise and nutrition data
def load_data():
    try:
        with open('data/exercises.json', 'r') as f:
            exercises = json.load(f)
        with open('data/nutrition.json', 'r') as f:
            nutrition = json.load(f)
        return exercises, nutrition
    except FileNotFoundError:
        return {}, {}

exercises_data, nutrition_data = load_data()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/api/profile', methods=['POST'])
def save_profile():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['firstName', 'lastName', 'age', 'height', 'weight', 'gender']
        for field in required_fields:
            if field not in data or data[field] == '':
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        user_id = data.get('user_id', 'default_user')
        
        # Calculate BMI
        try:
            height_m = float(data['height']) / 100
            weight = float(data['weight'])
            bmi = weight / (height_m ** 2)
            data['bmi'] = round(bmi, 1)
        except (ValueError, ZeroDivisionError):
            return jsonify({'success': False, 'error': 'Invalid height or weight values'}), 400
        
        # Calculate BMR (Basal Metabolic Rate)
        try:
            age = float(data['age'])
            if data['gender'] == 'male':
                bmr = 88.362 + (13.397 * weight) + (4.799 * float(data['height'])) - (5.677 * age)
            else:
                bmr = 447.593 + (9.247 * weight) + (3.098 * float(data['height'])) - (4.330 * age)
            
            data['bmr'] = round(bmr, 0)
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid age value'}), 400
        
        # Store user data
        users_data[user_id] = data
        
        # Initialize workout progress
        workout_progress[user_id] = {
            'current_day': 1,
            'completed_days': [],
            'start_date': datetime.now().isoformat(),
            'preferred_time': data.get('preferred_time', '07:00'),
            'actual_start_time': None,
            'total_calories_burned': 0,
            'streak': 0
        }
        
        return jsonify({'success': True, 'user_id': user_id, 'bmi': data['bmi'], 'bmr': data['bmr']})
    except Exception as e:
        print(f"Profile creation error: {str(e)}")  # Server-side logging
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route('/api/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        if user_id in users_data:
            return jsonify({'success': True, 'data': users_data[user_id]})
        else:
            # Create demo profile for testing
            demo_profile = {
                'user_id': user_id,
                'firstName': 'Demo',
                'lastName': 'User',
                'age': 25,
                'height': 175,
                'weight': 70,
                'gender': 'male',
                'goal': 'weightLoss',
                'fitnessLevel': 'beginner',
                'economicLevel': 'medium',
                'preferredTime': '07:00',
                'bmi': 22.9,
                'bmr': 1700
            }
            users_data[user_id] = demo_profile
            return jsonify({'success': True, 'data': demo_profile})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/workout/<user_id>', methods=['GET'])
def get_workout_plan(user_id):
    try:
        if user_id not in users_data:
            # Create demo profile if missing
            demo_profile = {
                'user_id': user_id,
                'firstName': 'Demo',
                'lastName': 'User',
                'age': 25,
                'height': 175,
                'weight': 70,
                'gender': 'male',
                'goal': 'weightLoss',
                'fitnessLevel': 'beginner',
                'economicLevel': 'medium',
                'preferredTime': '07:00',
                'bmi': 22.9,
                'bmr': 1700
            }
            users_data[user_id] = demo_profile
            workout_progress[user_id] = {
                'current_day': 1,
                'completed_days': [],
                'start_date': datetime.now().isoformat(),
                'preferred_time': '07:00',
                'actual_start_time': None,
                'total_calories_burned': 0,
                'streak': 0
            }
        
        user = users_data[user_id]
        progress = workout_progress.get(user_id, {})
        
        # Calculate current day and difficulty progression
        current_day = progress.get('current_day', 1)
        base_exercises = 14
        additional_exercises = (current_day - 1) // 2  # Every 2 days add more exercises
        total_exercises = base_exercises + additional_exercises
        
        # Get exercises based on fitness level and gender
        fitness_level = user.get('fitnessLevel', 'beginner')
        gender = user.get('gender', 'male')
        goal = user.get('goal', 'health')
        
        # Filter exercises
        filtered_exercises = []
        for exercise in exercises_data.get('exercises', []):
            if (exercise.get('level') == fitness_level and 
                exercise.get('gender') in [gender, 'both'] and
                exercise.get('goal') in [goal, 'general']):
                filtered_exercises.append(exercise)
        
        # Limit to calculated number of exercises
        workout_exercises = filtered_exercises[:total_exercises]
        
        return jsonify({
            'success': True,
            'exercises': workout_exercises,
            'current_day': current_day,
            'total_exercises': total_exercises,
            'progress': progress
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/nutrition/<user_id>', methods=['GET'])
def get_nutrition_plan(user_id):
    try:
        if user_id not in users_data:
            # Create demo profile if missing
            demo_profile = {
                'user_id': user_id,
                'firstName': 'Demo',
                'lastName': 'User',
                'age': 25,
                'height': 175,
                'weight': 70,
                'gender': 'male',
                'goal': 'weightLoss',
                'fitnessLevel': 'beginner',
                'economicLevel': 'medium',
                'preferredTime': '07:00',
                'bmi': 22.9,
                'bmr': 1700
            }
            users_data[user_id] = demo_profile
        
        user = users_data[user_id]
        economic_level = user.get('economicLevel', 'basic')
        goal = user.get('goal', 'health')
        bmr = user.get('bmr', 2000)
        
        # Calculate daily calorie needs based on goal
        calorie_multiplier = {
            'weightLoss': 0.8,
            'muscleGain': 1.3,
            'endurance': 1.4,
            'toning': 1.1,
            'health': 1.2
        }
        
        daily_calories = int(bmr * calorie_multiplier.get(goal, 1.2))
        
        # Get nutrition plan for economic tier
        nutrition_plan = nutrition_data.get('tiers', {}).get(economic_level, {})
        
        return jsonify({
            'success': True,
            'plan': nutrition_plan,
            'daily_calories': daily_calories,
            'economic_level': economic_level
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/workout/complete', methods=['POST'])
def complete_exercise():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        exercise_id = data.get('exercise_id')
        duration_minutes = data.get('duration', 0)
        
        if user_id not in users_data:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        user = users_data[user_id]
        
        # Calculate calories burned
        # Base formula: MET * weight(kg) * time(hours)
        exercise = next((ex for ex in exercises_data.get('exercises', []) if ex['id'] == exercise_id), None)
        if not exercise:
            return jsonify({'success': False, 'error': 'Exercise not found'}), 404
        
        met_value = exercise.get('met', 5.0)  # Metabolic equivalent
        weight = user.get('weight', 70)
        hours = duration_minutes / 60
        
        calories_burned = round(met_value * weight * hours, 1)
        
        # Update progress
        if user_id not in workout_progress:
            workout_progress[user_id] = {
                'current_day': 1,
                'completed_days': [],
                'total_calories_burned': 0,
                'streak': 0
            }
        
        workout_progress[user_id]['total_calories_burned'] += calories_burned
        
        return jsonify({
            'success': True,
            'calories_burned': calories_burned,
            'total_calories': workout_progress[user_id]['total_calories_burned']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/workout/day/complete', methods=['POST'])
def complete_day():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        day = data.get('day')
        
        if user_id not in workout_progress:
            return jsonify({'success': False, 'error': 'User progress not found'}), 404
        
        progress = workout_progress[user_id]
        
        if day not in progress['completed_days']:
            progress['completed_days'].append(day)
            progress['current_day'] = max(progress['current_day'], day + 1)
            progress['streak'] += 1
        
        return jsonify({
            'success': True,
            'completed_days': progress['completed_days'],
            'current_day': progress['current_day'],
            'streak': progress['streak']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/workout/time/update', methods=['POST'])
def update_workout_time():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        new_time = data.get('time')
        
        if user_id not in workout_progress:
            return jsonify({'success': False, 'error': 'User progress not found'}), 404
        
        workout_progress[user_id]['preferred_time'] = new_time
        workout_progress[user_id]['actual_start_time'] = new_time
        
        return jsonify({'success': True, 'new_time': new_time})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'API endpoint not found'}), 404
    return send_from_directory('.', '404.html') if os.path.exists('404.html') else ('Page not found', 404)

@app.errorhandler(500)
def internal_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
    return ('Internal server error', 500)

@app.errorhandler(405)
def method_not_allowed_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Method not allowed'}), 405
    return ('Method not allowed', 405)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
