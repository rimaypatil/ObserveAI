import hashlib
from typing import List, Dict, Any
from backend.config.settings import settings


class DocumentChunker:
    """Recursively chunks large documents and computes SHA-256 hashes for deduplication."""

    def __init__(self, chunk_size: int = settings.CHUNK_SIZE, chunk_overlap: int = settings.CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    @staticmethod
    def compute_hash(content: str) -> str:
        """Computes SHA-256 hash of text content."""
        return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()

    def chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Splits raw text into overlapping chunks with associated chunk metadata."""
        if not text or not text.strip():
            return []

        paragraphs = text.split("\n\n")
        chunks: List[str] = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) + 2 <= self.chunk_size:
                current_chunk = f"{current_chunk}\n\n{para}".strip()
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                # If paragraph itself is larger than chunk_size, split by sentences
                if len(para) > self.chunk_size:
                    sentences = para.replace(". ", ".\n").split("\n")
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) + 1 <= self.chunk_size:
                            sub_chunk = f"{sub_chunk} {sent}".strip()
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk)
                            sub_chunk = sent
                    if sub_chunk:
                        current_chunk = sub_chunk
                else:
                    current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        result_chunks = []
        for idx, chunk_str in enumerate(chunks):
            chunk_hash = self.compute_hash(chunk_str)
            chunk_meta = metadata.copy()
            chunk_meta.update({
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "chunk_hash": chunk_hash
            })
            result_chunks.append({
                "text": chunk_str,
                "metadata": chunk_meta,
                "chunk_hash": chunk_hash
            })

        return result_chunks


document_chunker = DocumentChunker()
