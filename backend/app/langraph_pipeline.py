from langgraph.graph import END, StateGraph, START
from typing import List, Dict, Annotated
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode, tools_condition 
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from app.routes.upload import pc

load_dotenv()
os.environ['GROQ_API_KEY'] = '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'
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
vectorstore = PineconeVectorStore(
    index=pc.Index("books-index"),
    embedding=embeddings,
    text_key="page_content"
)

user_email = ""

class chatState(Dict):
        messages: Annotated[List[BaseMessage], add_messages]
        user_email: str

@tool
def search_ddgo(query: str): 
    """
    Search the internet using DuckDuckGo to find current information.
    Use this tool when the user asks about recent events, general knowledge, 
    or information not available in the uploaded documents.
    
    Args:
        query: The search query or question to look up on the internet
    """
    res = DuckDuckGoSearchRun().invoke(query)
    return res

@tool
def search_pdfs(query: str): 
    """
    Search through uploaded PDF documents to find relevant information.
    Use this tool when the user asks questions about their uploaded documents, books, or PDFs.
    Returns the most relevant text passages from the documents.
    
    Args:
        query: The user's question or search term to find in the PDFs
    """
    global user_email
    print("User_email: ", user_email)
    k_res = vectorstore.similarity_search(query, k=20, filter={"session_id": user_email})  
    text = [doc.page_content for doc in k_res]
    return text
    
tools=[search_ddgo, search_pdfs]

def chat(chat_state: chatState):
    llm = ChatGroq(model="moonshotai/kimi-k2-instruct-0905")
    llm_with_tools = llm.bind_tools(tools)
    response = llm_with_tools.invoke(chat_state["messages"])
    return {"messages": [response]}   



tool_node = ToolNode(tools)


graph = StateGraph(chatState) 

graph.add_node("chat", chat)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chat")
graph.add_conditional_edges("chat", tools_condition)
graph.add_edge("tools", "chat")

chatbot = graph.compile()
