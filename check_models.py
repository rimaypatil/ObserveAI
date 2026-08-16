import os
import google.generativeai as genai
import traceback

API_KEY = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=API_KEY)

    print("Connected to Gemini API")
    print("-" * 50)

    models = list(genai.list_models())

    print(f"Found {len(models)} models\n")

    for model in models:
        print("Name:", model.name)
        print("Supported:", model.supported_generation_methods)
        print("-" * 50)

except Exception:
    print("ERROR:")
    traceback.print_exc()