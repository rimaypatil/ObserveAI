import uuid
from typing import Any, Dict, List, Optional
from backend.config.settings import settings
from backend.embeddings.generator import embedding_generator
from backend.utils.logging import logger
from backend.vectorstore.chroma_client import chroma_store


class RAGPipeline:
    """
    Enterprise Retrieval-Augmented Generation Pipeline:
    Query Expansion -> Vector Search -> Top-K Filtering -> Reranking -> Context Compression
    """

    CATEGORIES_TO_SEARCH = [
        "rca_reports",
        "resolved_incidents",
        "runbooks",
        "architecture_docs",
        "service_docs",
        "deployment_notes",
        "git_commits",
        "playbooks",
        "knowledge_base",
        "postmortems",
    ]

    def expand_query(self, incident_title: str, exception_msg: Optional[str], service_name: str) -> List[str]:
        """Generates multiple search query representations for higher recall."""
        queries = [incident_title]
        if exception_msg:
            # Clean exception query
            clean_exc = exception_msg.split(":")[0] if ":" in exception_msg else exception_msg
            queries.append(f"{service_name} {clean_exc}")
        queries.append(f"Root cause and fix for {service_name} failure {incident_title}")
        return queries

    def execute_rag(
        self,
        project_id: uuid.UUID,
        incident_title: str,
        service_name: str,
        exception_msg: Optional[str] = None,
        environment: Optional[str] = None,
        severity: Optional[str] = None,
        top_k: int = settings.RAG_TOP_K
    ) -> Dict[str, Any]:
        """
        Executes complete RAG pipeline and returns compressed, reranked context with citations.
        """
        logger.info("Starting enterprise RAG retrieval pipeline", incident_title=incident_title, service=service_name)
        queries = self.expand_query(incident_title, exception_msg, service_name)

        all_retrieved: List[Dict[str, Any]] = []

        for q in queries:
            query_vector = embedding_generator.generate_embedding(q)

            for cat in self.CATEGORIES_TO_SEARCH:
                results = chroma_store.query_similar(
                    category=cat,
                    query_embedding=query_vector,
                    project_id=project_id,
                    top_k=top_k,
                    service=service_name,
                    environment=environment,
                    severity=severity
                )
                for item in results:
                    item["category"] = cat
                    all_retrieved.append(item)

        # Step: Reranking & Deduplication by similarity score and document text
        seen_docs = set()
        unique_results = []
        for item in all_retrieved:
            doc_text = item["document"].strip()
            if doc_text not in seen_docs and item["similarity"] >= settings.RAG_SIMILARITY_THRESHOLD:
                seen_docs.add(doc_text)
                unique_results.append(item)

        # Sort by similarity descending
        reranked_results = sorted(unique_results, key=lambda x: x["similarity"], reverse=True)[:top_k]

        # Step: Context Compression & Formatting
        compressed_context = self.compress_context(reranked_results)

        logger.info(
            "RAG Pipeline completed",
            total_retrieved=len(all_retrieved),
            reranked_count=len(reranked_results)
        )

        return {
            "compressed_context": compressed_context,
            "retrieved_documents": reranked_results,
            "queries_used": queries,
            "top_match_similarity": reranked_results[0]["similarity"] if reranked_results else 0.0
        }

    def compress_context(self, items: List[Dict[str, Any]]) -> str:
        """Compresses retrieved documents into clean Markdown context block for LLM prompts."""
        if not items:
            return "No historical knowledge or runbooks found for this incident."

        blocks = []
        for idx, item in enumerate(items, 1):
            category = item["category"].replace("_", " ").title()
            sim = item["similarity"]
            meta = item.get("metadata", {})
            title = meta.get("title", f"Document #{idx}")
            
            blocks.append(
                f"### [Reference {idx}] {title} ({category} | Similarity: {sim:.2f})\n"
                f"{item['document'].strip()}\n"
            )

        return "\n".join(blocks)


rag_pipeline = RAGPipeline()
