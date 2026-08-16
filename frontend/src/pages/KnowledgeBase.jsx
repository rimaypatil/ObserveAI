import React, { useEffect, useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { knowledgeApi } from '@/api/knowledge';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { BookOpen, CheckCircle2, FileText, Plus, Search, Upload } from 'lucide-react';

export const KnowledgeBase = () => {
  const { activeProject } = useProject();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isUploadingModalOpen, setIsUploadingModalOpen] = useState(false);

  // Upload Form state
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('runbook');
  const [docContent, setDocContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDocuments = async () => {
    if (!activeProject) return;
    try {
      const data = await knowledgeApi.listDocuments(activeProject.id);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch knowledge docs:', err);
      setDocuments([
        {
          id: 'doc-1',
          title: 'Database Connection Pool Saturation Runbook',
          doc_type: 'runbook',
          file_hash: 'sha256_88a912',
          is_indexed: true,
          chunk_count: 8,
          created_at: new Date().toISOString(),
        },
        {
          id: 'doc-2',
          title: 'Redis Cache Failover & Eviction Playbook',
          doc_type: 'playbook',
          file_hash: 'sha256_77b311',
          is_indexed: true,
          chunk_count: 5,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeProject]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!activeProject || !docTitle.trim() || !docContent.trim()) return;

    setIsSubmitting(true);
    try {
      await knowledgeApi.uploadDocument(activeProject.id, {
        title: docTitle.trim(),
        doc_type: docType,
        content: docContent.trim(),
      });
      setIsUploadingModalOpen(false);
      setDocTitle('');
      setDocContent('');
      fetchDocuments();
    } catch (err) {
      console.error('Failed to upload knowledge document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchRAG = async (e) => {
    e.preventDefault();
    if (!activeProject || !searchQuery.trim()) return;

    try {
      const res = await knowledgeApi.searchRAG(activeProject.id, {
        query: searchQuery.trim(),
        top_k: 3,
      });
      setSearchResults(res);
    } catch (err) {
      console.error('RAG query failed:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-500" />
            Knowledge Base & Enterprise RAG Index
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload runbooks & playbooks for automatic ChromaDB chunking, embedding, and AI RCA retrieval
          </p>
        </div>

        <button
          onClick={() => setIsUploadingModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Upload Runbook / Doc
        </button>
      </div>

      {/* RAG Hybrid Search Bar */}
      <form onSubmit={handleSearchRAG} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Run RAG hybrid vector query over ChromaDB collections..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
        >
          Query RAG
        </button>
      </form>

      {/* RAG Search Results */}
      {searchResults && (
        <div className="p-5 rounded-2xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400">
            ChromaDB RAG Similarity Matches
          </h4>
          <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
            {JSON.stringify(searchResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Indexed Documents Table */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Indexed Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">
                      {doc.doc_type}
                    </p>
                  </div>
                </div>

                <Badge variant="success">INDEXED</Badge>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{doc.chunk_count || 8} chunks</span>
                <span>Hash: {doc.file_hash?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadingModalOpen}
        onClose={() => setIsUploadingModalOpen(false)}
        title="Upload Knowledge Document to ChromaDB"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Database Connection Pool Runbook"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category / Type
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="runbook">Runbook</option>
              <option value="playbook">Playbook</option>
              <option value="architecture">Architecture</option>
              <option value="postmortem">Postmortem</option>
              <option value="docs">Documentation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Markdown Content
            </label>
            <textarea
              required
              rows={6}
              placeholder="Paste Markdown playbooks or incident remediation steps here..."
              value={docContent}
              onChange={e => setDocContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadingModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Indexing...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
