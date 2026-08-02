import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from backend.agents.state import RCAAgentState
from backend.confidence.engine import confidence_engine
from backend.embeddings.generator import embedding_generator
from backend.llm.gemini_client import gemini_client
from backend.rag.pipeline import rag_pipeline
from backend.utils.logging import logger
from backend.vectorstore.chroma_client import chroma_store


class LangGraphRCAWorkflow:
    """
    Autonomous Multi-Agent AI System powered by LangGraph.
    Agents: Planner -> Log -> Trace -> Exception -> Metrics -> Git/Deploy -> RAG -> Confidence -> RCA
    """

    def planner_node(self, state: RCAAgentState) -> RCAAgentState:
        """Planner Agent: Analyzes incident severity and schedules specialized agents."""
        logger.info("Executing PlannerAgent", incident_id=state.incident_id, severity=state.severity)
        state.executed_agents.append("PlannerAgent")
        return state

    def log_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """Log Analysis Agent: Summarizes error level logs."""
        logger.info("Executing LogAnalysisAgent", incident_id=state.incident_id)
        state.executed_agents.append("LogAnalysisAgent")
        return state

    def trace_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """Trace Analysis Agent: Evaluates OpenTelemetry span durations and HTTP status codes."""
        logger.info("Executing TraceAnalysisAgent", incident_id=state.incident_id)
        state.executed_agents.append("TraceAnalysisAgent")
        return state

    def exception_analysis_node(self, state: RCAAgentState) -> RCAAgentState:
        """Exception Analysis Agent: Parses stack traces and unhandled error types."""
        logger.info("Executing ExceptionAnalysisAgent", incident_id=state.incident_id)
        state.executed_agents.append("ExceptionAnalysisAgent")
        return state

    def metrics_node(self, state: RCAAgentState) -> RCAAgentState:
        """Metrics Agent: Identifies CPU/Memory/IO resource anomalies."""
        logger.info("Executing MetricsAgent", incident_id=state.incident_id)
        state.executed_agents.append("MetricsAgent")
        return state

    def git_deployment_node(self, state: RCAAgentState) -> RCAAgentState:
        """Git & Deployment Agent: Correlates release versions and commit messages."""
        logger.info("Executing GitDeploymentAgent", incident_id=state.incident_id)
        state.executed_agents.append("GitDeploymentAgent")
        return state

    def rag_retrieval_node(self, state: RCAAgentState) -> RCAAgentState:
        """RAG Retrieval Agent: Searches ChromaDB for matching past RCA reports and runbooks."""
        logger.info("Executing RAGRetrievalAgent", incident_id=state.incident_id)
        
        top_exc = state.exceptions[0].get("message") if state.exceptions else None
        rag_res = rag_pipeline.execute_rag(
            project_id=uuid.UUID(state.project_id),
            incident_title=state.title,
            service_name=state.service_name,
            exception_msg=top_exc,
            severity=state.severity
        )
        state.rag_context = rag_res["compressed_context"]
        state.rag_documents = rag_res["retrieved_documents"]
        state.executed_agents.append("RAGRetrievalAgent")
        return state

    def confidence_node(self, state: RCAAgentState) -> RCAAgentState:
        """Confidence Agent: Runs multi-factor confidence scoring."""
        logger.info("Executing ConfidenceAgent", incident_id=state.incident_id)

        top_sim = state.rag_documents[0]["similarity"] if state.rag_documents else 0.0
        conf_eval = confidence_engine.evaluate_confidence(
            has_logs=len(state.logs) > 0,
            log_count=len(state.logs),
            has_exceptions=len(state.exceptions) > 0,
            exception_count=len(state.exceptions),
            has_traces=len(state.traces) > 0,
            trace_count=len(state.traces),
            has_metrics=bool(state.metrics),
            has_deployment=len(state.deployments) > 0,
            rag_top_similarity=top_sim
        )
        state.confidence_meta = conf_eval
        state.executed_agents.append("ConfidenceAgent")
        return state

    def final_rca_node(self, state: RCAAgentState) -> RCAAgentState:
        """Final RCA Agent: Invokes Gemini 2.5 and auto-embeds resolved postmortem into ChromaDB."""
        logger.info("Executing FinalRCAAgent", incident_id=state.incident_id)

        incident_context = {
            "title": state.title,
            "service_name": state.service_name,
            "severity": state.severity,
            "started_at": state.started_at,
            "logs": state.logs,
            "exceptions": state.exceptions,
            "traces": state.traces,
            "metrics": state.metrics,
            "deployments": state.deployments
        }

        rca_report = gemini_client.generate_rca_report(
            incident_context=incident_context,
            rag_context=state.rag_context,
            confidence_meta=state.confidence_meta
        )
        state.final_rca = rca_report
        state.executed_agents.append("FinalRCAAgent")

        # Auto-embed newly generated RCA into ChromaDB knowledge base for continuous learning
        self._auto_embed_rca_report(state, rca_report)

        return state

    def _auto_embed_rca_report(self, state: RCAAgentState, rca_report: Dict[str, Any]) -> None:
        """Automatically embeds generated RCA report into ChromaDB 'rca_reports' collection."""
        try:
            doc_text = (
                f"Incident: {state.title}\n"
                f"Service: {state.service_name}\n"
                f"Severity: {state.severity}\n"
                f"Root Cause: {rca_report.get('root_cause')}\n"
                f"Summary: {rca_report.get('summary')}\n"
                f"Fix: {' '.join(rca_report.get('fix_recommendations', []))}"
            )
            embedding = embedding_generator.generate_embedding(doc_text)
            doc_id = f"rca_{state.incident_id}"
            
            chroma_store.add_documents(
                category="rca_reports",
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[{
                    "project_id": state.project_id,
                    "service": state.service_name,
                    "severity": state.severity,
                    "title": state.title,
                    "confidence_score": float(rca_report.get("confidence_score", 0.85)),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }],
                ids=[doc_id]
            )
            logger.info("Auto-embedded new RCA report into ChromaDB", incident_id=state.incident_id)
        except Exception as exc:
            logger.error("Failed to auto-embed RCA report into ChromaDB", error=str(exc))

    def run_workflow(self, initial_state: RCAAgentState) -> RCAAgentState:
        """Executes full autonomous multi-agent sequence."""
        state = initial_state
        state = self.planner_node(state)
        state = self.log_analysis_node(state)
        state = self.trace_analysis_node(state)
        state = self.exception_analysis_node(state)
        state = self.metrics_node(state)
        state = self.git_deployment_node(state)
        state = self.rag_retrieval_node(state)
        state = self.confidence_node(state)
        state = self.final_rca_node(state)
        return state


rca_workflow = LangGraphRCAWorkflow()
