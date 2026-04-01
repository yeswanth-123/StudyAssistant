import os
import json
import numpy as np
import faiss
from google import genai
from config import settings

_genai_client = genai.Client(api_key=settings.gemini_api_key)


class VectorStore:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.index_dir = os.path.join(settings.faiss_index_dir, session_id)
        self.index_path = os.path.join(self.index_dir, "index.faiss")
        self.chunks_path = os.path.join(self.index_dir, "chunks.json")
        self.dimension = 3072
        self.index = None
        self.chunks = []
        os.makedirs(self.index_dir, exist_ok=True)
        self._load()

    def _load(self):
        if os.path.exists(self.index_path) and os.path.exists(self.chunks_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.chunks_path, "r") as f:
                self.chunks = json.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.chunks = []

    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.chunks_path, "w") as f:
            json.dump(self.chunks, f)

    def generate_embedding(self, text: str) -> list[float]:
        result = _genai_client.models.embed_content(
            model=settings.embedding_model,
            contents=text,
        )
        return result.embeddings[0].values

    def generate_query_embedding(self, query: str) -> list[float]:
        result = _genai_client.models.embed_content(
            model=settings.embedding_model,
            contents=query,
        )
        return result.embeddings[0].values

    def add_chunks(self, chunks: list[str]):
        if not chunks:
            return

        embeddings = []
        for chunk in chunks:
            emb = self.generate_embedding(chunk)
            embeddings.append(emb)

        vectors = np.array(embeddings, dtype=np.float32)
        self.index.add(vectors)
        self.chunks.extend(chunks)
        self._save()

    def search(self, query: str, top_k: int = 5) -> list[str]:
        if self.index.ntotal == 0:
            return []

        query_emb = self.generate_query_embedding(query)
        query_vector = np.array([query_emb], dtype=np.float32)

        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query_vector, k)

        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.chunks):
                results.append(self.chunks[idx])

        return results

    def get_all_chunks(self) -> list[str]:
        return self.chunks

    def clear(self):
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        self._save()
