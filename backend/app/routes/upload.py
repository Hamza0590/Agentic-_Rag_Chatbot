from flask import Blueprint, request, jsonify, session
import re
import os, tempfile
from dotenv import load_dotenv
from typing import List, Dict
import pdfplumber
import tiktoken
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from pinecone import Pinecone

# Create a Blueprint (not a Flask app)
upload_bp = Blueprint('upload', __name__)
load_dotenv()
global pc
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

def chunk_pdf(pdf_path: str, max_tokens: int = 500, overlap_tokens: int = 75, encoding_name: str = "cl100k_base") -> List[Dict]:
    """
    Token-accurate, sentence-based chunking for RAG.
    Returns chunks with page range and chapter metadata.
    """

    enc = tiktoken.get_encoding(encoding_name)

    def count_tokens(text: str) -> int:
        return len(enc.encode(text))

    def detect_chapter(text: str):
        match = re.search(r'\b(chapter|chap)\s+(\d+)\b', text, re.IGNORECASE)
        return int(match.group(2)) if match else None

    def split_into_sentences(text: str) -> List[str]:
        return re.split(r'(?<=[.!?])\s+', text.strip())

    chunks = []
    current_chunk = ""
    current_tokens = 0
    current_chapter = None
    chunk_start_page = None

    i = 0
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            raw_text = page.extract_text() or ""
            sentences = split_into_sentences(raw_text)

            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                # Detect chapter headings
                chapter = detect_chapter(sentence)
                if chapter is not None and chapter != current_chapter:
                    # Flush chunk on chapter boundary
                    if current_chunk.strip():
                        chunks.append({
                            "text": current_chunk.strip(),
                            "page_start": chunk_start_page,
                            "page_end": page_num,
                            "chapter_index": current_chapter,
                            "chunk_type": "text"
                        })

                    current_chunk = ""
                    current_tokens = 0
                    current_chapter = chapter
                    chunk_start_page = None

                sentence_tokens = count_tokens(sentence)
                # Initialize chunk start page
                if current_chunk == "":
                    chunk_start_page = page_num

                # FIX: Check if adding this sentence would exceed limit
                if current_tokens + sentence_tokens > max_tokens:
                    # Emit current chunk (only if not empty)
                    if current_chunk.strip():
                        chunks.append({
                            "text": current_chunk.strip(),
                            "page_start": chunk_start_page,
                            "page_end": page_num,
                            "chapter_index": current_chapter,
                            "chunk_type": "text"
                        })

                    # Create overlap from previous chunk
                    if current_chunk.strip():
                        overlap_text = enc.decode(
                            enc.encode(current_chunk)[-overlap_tokens:]
                        )
                    else:
                        overlap_text = ""

                    # Start new chunk with overlap + current sentence
                    current_chunk = (overlap_text + " " + sentence).strip() + " "
                    current_tokens = count_tokens(current_chunk)
                    chunk_start_page = page_num
                    
                    # FIX: If even the new chunk with overlap exceeds limit, 
                    # start fresh without overlap
                    if current_tokens > max_tokens:
                        current_chunk = sentence + " "
                        current_tokens = sentence_tokens
                else:
                    # Add sentence to current chunk
                    current_chunk += sentence + " "
                    current_tokens += sentence_tokens
                
    if current_chunk.strip():
        chunks.append({
            "text": current_chunk.strip(),
            "page_start": chunk_start_page,
            "page_end": page_num,
            "chapter_index": current_chapter,
            "chunk_type": "text"
        })

    return chunks


def get_embeddings(chunks, filename, email):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )
    index = pc.Index("books-index")

    vectorstore = PineconeVectorStore(
        index=index,
        embedding=embeddings,
        text_key="page_content"
    )

    documents = [
        Document(
            page_content=chunk["text"],
            metadata={
                "source": filename,
                "page_start": chunk["page_start"],
                "chapter": chunk["chapter_index"] if chunk["chapter_index"] is not None else 0,  # ✅ Handle None
                "session_id": str(email)
            }
        )
        for chunk in chunks
    ]

    vectorstore.add_documents(documents)

    
    

@upload_bp.route('/upload_file', methods=['POST'])
def upload_file():

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    email = request.headers.get('email')
    if not email or email == 'null':
        return jsonify({'error': 'User authentication required'}), 401
    
    file = request.files['file']
    temp_path = os.path.join(tempfile.gettempdir(), file.filename)
    file.save(temp_path)

    chunks = chunk_pdf(temp_path)
    filename = file.filename
    get_embeddings( chunks, filename, email)
    os.remove(temp_path)
    return jsonify({
        'doc_id': f'doc_{int(__import__("time").time())}',
        'job_id': f'job_{int(__import__("time").time())}',
        'message': 'File uploaded successfully'
    }), 200


@upload_bp.route('/delete_document', methods=['DELETE'])
def delete_document():
    """
    Delete all vectors associated with a specific document from Pinecone.
    Filters by both filename (source) and user email (session_id).
    """
    try:
        # Get user email from headers
        email = request.headers.get('email')
        if not email or email == 'null':
            return jsonify({'error': 'User authentication required'}), 401
        
        # Get filename from request body
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        # Get Pinecone index
        index = pc.Index("books-index")
        
        # Delete vectors with matching source and session_id
        # Pinecone delete by metadata filter
        index.delete(
            filter={
                "source": {"$eq": filename},
                "session_id": {"$eq": str(email)}
            }
        )
        
        return jsonify({
            'message': f'Successfully deleted all vectors for {filename}',
            'filename': filename
        }), 200
        
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        return jsonify({'error': f'Failed to delete document: {str(e)}'}), 500
