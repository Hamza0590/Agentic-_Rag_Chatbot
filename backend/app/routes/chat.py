from flask import Blueprint, request, jsonify
from langchain_core.messages import HumanMessage
from app.langraph_pipeline import chatbot
from app import langraph_pipeline

chat_bp = Blueprint('chat', __name__)
@chat_bp.route('/chat', methods=['POST'])
def chat():
    if 'query' not in request.json:
        return jsonify({'error': 'No query provided'}), 400

    user_email = request.headers.get('email', '')
    langraph_pipeline.user_email = user_email
    res = chatbot.invoke({"messages": [HumanMessage(content=request.json['query'])], "user_email": user_email})
    print(res['messages'][-1].content)
    return jsonify({'answer': res['messages'][-1].content}), 200

