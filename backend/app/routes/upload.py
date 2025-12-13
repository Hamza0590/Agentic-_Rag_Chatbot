from flask import Blueprint, request, jsonify

# Create a Blueprint (not a Flask app)
upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload_file', methods=['POST'])
def upload_file():
    print('Entered')
    if 'file' not in request.files:
        print('No file uploaded')
        return jsonify({'error': 'No file uploaded'}), 400

    print('File uploaded')    
    file = request.files['file']
    title = request.form.get('title', file.filename)
    
    # Here you would process the file
    print(file)
    # For now, just return success
    return jsonify({
        'doc_id': f'doc_{int(__import__("time").time())}',
        'job_id': f'job_{int(__import__("time").time())}',
        'message': 'File uploaded successfully'
    }), 200