from typing import Any, List, Optional
import numpy as np
from backend.config.settings import settings
from backend.utils.logging import logger


class EmbeddingGenerator:
    """Generates dense vector embeddings using SentenceTransformers with lazy load & OS fallback."""

    def __init__(self):
        self._model: Optional[Any] = None
        self._model_failed: bool = False
        self.model_name = settings.EMBEDDING_MODEL_NAME

    def _get_model(self) -> Optional[Any]:
        if self._model_failed:
            return None

        if self._model is None:
            try:
                logger.info("Lazy loading SentenceTransformer model", model_name=self.model_name)
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception as exc:
                logger.warning("SentenceTransformer unavailable. Using deterministic vector generator fallback.", error=str(exc))
                self._model_failed = True
                return None
            except BaseException as exc:
                logger.warning("SentenceTransformer OS DLL load blocked. Using deterministic vector generator fallback.", error=str(exc))
                self._model_failed = True
                return None

        return self._model

    def generate_embedding(self, text: str) -> List[float]:
        """Generates 384-dimensional embedding vector for a string."""
        if not text or not text.strip():
            return [0.0] * 384

        model = self._get_model()
        if model is not None:
            try:
                vector = model.encode(text, convert_to_numpy=True)
                return vector.tolist()
            except Exception as exc:
                logger.error("Error running model encode, using fallback vector", error=str(exc))

        # Deterministic normalized 384-dim pseudo-vector fallback
        seed = abs(hash(text)) % (2**32)
        rng = np.random.RandomState(seed)
        vec = rng.normal(0, 0.1, 384)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a list of strings."""
        if not texts:
            return []
        
        model = self._get_model()
        if model is not None:
            try:
                vectors = model.encode(texts, convert_to_numpy=True, batch_size=32)
                return vectors.tolist()
            except Exception as exc:
                logger.error("Batch encoding failed, using item fallback", error=str(exc))

        return [self.generate_embedding(t) for t in texts]


embedding_generator = EmbeddingGenerator()
