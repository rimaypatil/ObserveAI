from typing import Any, Dict, List, Optional
from backend.utils.logging import logger


class ConfidenceEngine:
    """
    Evaluates multi-factor confidence across evidence quality, historical RAG match,
    telemetry depth, and LLM consistency to produce an authoritative confidence rating.
    """

    def evaluate_confidence(
        self,
        has_logs: bool,
        log_count: int,
        has_exceptions: bool,
        exception_count: int,
        has_traces: bool,
        trace_count: int,
        has_metrics: bool,
        has_deployment: bool,
        rag_top_similarity: float,
        llm_coherence_score: float = 0.85
    ) -> Dict[str, Any]:
        """Calculates multi-factor confidence breakdown and overall rating."""
        # 1. Evidence Quality (0.0 - 1.0)
        evidence_sources = sum([has_logs, has_exceptions, has_traces, has_metrics, has_deployment])
        evidence_score = round(evidence_sources / 5.0, 2)

        # 2. Telemetry Volume & Completeness Scores
        log_score = min(1.0, round(log_count / 10.0, 2)) if has_logs else 0.0
        exc_score = 1.0 if has_exceptions and exception_count > 0 else 0.0
        trace_score = min(1.0, round(trace_count / 5.0, 2)) if has_traces else 0.0
        metric_score = 0.9 if has_metrics else 0.2
        deploy_score = 1.0 if has_deployment else 0.3

        # 3. RAG Historical Match Score
        rag_score = round(rag_top_similarity, 2)

        # 4. Weighted Calculation
        # Weights: Evidence (25%), Exception/Logs (25%), Traces (15%), Historical RAG (20%), LLM Coherence (15%)
        overall_score = (
            (evidence_score * 0.25) +
            (exc_score * 0.15) +
            (log_score * 0.10) +
            (trace_score * 0.15) +
            (rag_score * 0.20) +
            (llm_coherence_score * 0.15)
        )
        overall_score = round(min(1.0, max(0.0, overall_score)), 2)

        if overall_score >= 0.75:
            confidence_level = "HIGH"
            needs_deep_pass = False
        elif overall_score >= 0.50:
            confidence_level = "MEDIUM"
            needs_deep_pass = False
        else:
            confidence_level = "LOW"
            needs_deep_pass = True

        logger.info(
            "Confidence evaluation completed",
            overall_score=overall_score,
            level=confidence_level,
            needs_deep_pass=needs_deep_pass
        )

        return {
            "overall_score": overall_score,
            "confidence_level": confidence_level,
            "needs_deep_pass": needs_deep_pass,
            "factor_breakdown": {
                "evidence_quality": evidence_score,
                "log_confidence": log_score,
                "exception_confidence": exc_score,
                "trace_confidence": trace_score,
                "metric_confidence": metric_score,
                "deployment_confidence": deploy_score,
                "historical_rag_match": rag_score,
                "llm_coherence": llm_coherence_score
            }
        }


confidence_engine = ConfidenceEngine()
