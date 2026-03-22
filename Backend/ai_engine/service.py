from .services import ask_gemini, preprocess_user_prompt


def ask_brightskill_ai(user_query, context_type=None, context_data=""):
    prompt = f"Context type: {context_type or 'general'}\nContext data: {context_data}\nUser: {user_query}"
    return ask_gemini(preprocess_user_prompt(prompt), source_text=user_query)
