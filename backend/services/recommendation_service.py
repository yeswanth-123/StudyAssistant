from llm.gemini_client import gemini_client
from llm.prompts import RECOMMENDATION_PROMPT


def get_recommendations(main_topics: list, subtopics: list, keywords: list) -> dict:
    prompt = RECOMMENDATION_PROMPT.format(
        main_topics=", ".join(main_topics),
        subtopics=", ".join(subtopics),
        keywords=", ".join(keywords),
    )

    result = gemini_client.generate_json(prompt)

    # Build YouTube search URLs
    youtube_videos = result.get("youtube_videos", [])
    for video in youtube_videos:
        query = video.get("search_query", "")
        video["url"] = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"

    # Build Google search URLs for articles
    articles = result.get("articles", [])
    for article in articles:
        query = article.get("search_query", "")
        article["url"] = f"https://www.google.com/search?q={query.replace(' ', '+')}"

    return {
        "youtube_videos": youtube_videos,
        "articles": articles,
        "study_tips": result.get("study_tips", []),
    }
