import uuid
from typing import Any, Dict, List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.config.settings import settings
from backend.utils.logging import logger


class ChromaVectorStore:
    """Enterprise ChromaDB wrapper for semantic vector search and knowledge management."""

    COLLECTIONS = {
        "rca_reports": "previous_rca_reports",
        "resolved_incidents": "resolved_incidents",
        "runbooks": "runbooks",
        "architecture_docs": "architecture_documents",
        "service_docs": "service_documentation",
        "deployment_notes": "deployment_notes",
        "git_commits": "git_commit_summaries",
        "playbooks": "incident_playbooks",
        "knowledge_base": "knowledge_base",
        "postmortems": "postmortems",
    }

    def __init__(self):
        if settings.CHROMADB_IS_REMOTE:
            self.client = chromadb.HttpClient(
                host=settings.CHROMADB_HOST,
                port=settings.CHROMADB_PORT,
            )
        else:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMADB_PATH,
                settings=ChromaSettings(anonymized_telemetry=False)
            )

    def get_collection_name(self, category: str) -> str:
        base_name = self.COLLECTIONS.get(category, category)
        return f"{settings.CHROMADB_COLLECTION_PREFIX}_{base_name}"

    def get_or_create_collection(self, category: str):
        col_name = self.get_collection_name(category)
        return self.client.get_or_create_collection(
            name=col_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        category: str,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        """Inserts or updates vector embeddings with rich metadata in ChromaDB."""
        try:
            collection = self.get_or_create_collection(category)
            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(
                "Upserted vector documents into ChromaDB",
                category=category,
                count=len(ids)
            )
            return True
        except Exception as exc:
            logger.error("Failed to add documents to ChromaDB", error=str(exc), category=category)
            raise

    def query_similar(
        self,
        category: str,
        query_embedding: List[float],
        project_id: uuid.UUID,
        top_k: int = 5,
        service: Optional[str] = None,
        environment: Optional[str] = None,
        severity: Optional[str] = None,
        organization_id: Optional[uuid.UUID] = None
    ) -> List[Dict[str, Any]]:
        """Executes vector similarity search with strict metadata filtering."""
        try:
            collection = self.get_or_create_collection(category)
            
            # Construct metadata filter
            where_clause: Dict[str, Any] = {"project_id": str(project_id)}
            conditions = [{"project_id": str(project_id)}]

            if organization_id:
                conditions.append({"organization_id": str(organization_id)})
            if service:
                conditions.append({"service": service})
            if environment:
                conditions.append({"environment": environment})
            if severity:
                conditions.append({"severity": severity})

            if len(conditions) > 1:
                where_clause = {"$and": conditions}

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )

            retrieved = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else []
                dists = results["distances"][0] if results.get("distances") else []

                for doc, meta, dist in zip(docs, metas, dists):
                    # Cosine distance to similarity score
                    similarity_score = round(1.0 - float(dist), 4)
                    retrieved.append({
                        "document": doc,
                        "metadata": meta,
                        "similarity": similarity_score
                    })

            return retrieved
        except Exception as exc:
            logger.error("ChromaDB query failed", error=str(exc), category=category)
            return []

    def delete_document(self, category: str, document_id: str) -> bool:
        """Deletes a vector document from ChromaDB."""
        try:
            collection = self.get_or_create_collection(category)
            collection.delete(ids=[document_id])
            return True
        except Exception as exc:
            logger.error("Failed to delete ChromaDB document", error=str(exc), doc_id=document_id)
            return False


chroma_store = ChromaVectorStore()
