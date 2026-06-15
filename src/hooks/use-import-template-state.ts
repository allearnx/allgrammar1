import { useState, useEffect } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface TemplateItem {
  id: string;
  title: string;
  questions: NaesinProblemQuestion[];
  template_topic: string;
  category: string;
}

interface TemplateData {
  grouped: Record<string, TemplateItem[]>;
}

export type { TemplateItem };

export function useImportTemplateState(unitId: string, onAdd: () => void) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, TemplateItem[]>>({});
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  useEffect(() => {
    if (!open) return;
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await fetchWithToast<TemplateData>('/api/naesin/templates', {
        method: 'GET',
        errorMessage: '템플릿 목록 불러오기 실패',
        logContext: 'import_template.load',
      });
      setGrouped(data.grouped);
      const topics = Object.keys(data.grouped);
      if (topics.length > 0 && !activeTopic) setActiveTopic(topics[0]);
    } catch {
      // fetchWithToast handles toast
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleImport(templateId: string) {
    setCopying(templateId);
    try {
      await fetchWithToast('/api/naesin/templates/import', {
        body: {
          templateId,
          targetUnitIds: [unitId],
        },
        successMessage: '템플릿을 가져왔습니다',
        errorMessage: '템플릿 가져오기 실패',
        logContext: 'import_template.import',
      });
      setOpen(false);
      onAdd();
    } catch {
      // fetchWithToast handles toast
    } finally {
      setCopying(null);
    }
  }

  async function handleBulkImport() {
    if (selectedIds.size === 0) return;
    setBulkImporting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((templateId) =>
          fetchWithToast('/api/naesin/templates/import', {
            body: { templateId, targetUnitIds: [unitId] },
            errorMessage: '템플릿 가져오기 실패',
            logContext: 'import_template.bulk_import',
          })
        )
      );
      setSelectedIds(new Set());
      setOpen(false);
      onAdd();
    } catch {
      // fetchWithToast handles toast
    } finally {
      setBulkImporting(false);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!window.confirm('이 템플릿을 삭제하시겠습니까?\n\n이 템플릿에서 가져온(import) 복사본 문제들도 모두 함께 삭제됩니다.')) return;
    setDeleting(templateId);
    try {
      await fetchWithToast(`/api/naesin/templates?id=${templateId}`, {
        method: 'DELETE',
        successMessage: '템플릿 및 복사본 삭제됨',
        errorMessage: '템플릿 삭제 실패',
        logContext: 'import_template.delete',
      });
      setGrouped((prev) => {
        const next: Record<string, TemplateItem[]> = {};
        for (const [topic, items] of Object.entries(prev)) {
          const filtered = items.filter((t) => t.id !== templateId);
          if (filtered.length > 0) next[topic] = filtered;
        }
        return next;
      });
    } catch {
      // fetchWithToast handles toast
    } finally {
      setDeleting(null);
    }
  }

  const topics = Object.keys(grouped);

  return {
    open, setOpen,
    loading,
    grouped,
    activeTopic, setActiveTopic,
    copying,
    bulkImporting,
    selectedIds,
    deleting,
    editingTemplate, setEditingTemplate,
    topics,
    loadTemplates,
    toggleSelect,
    handleImport,
    handleBulkImport,
    handleDeleteTemplate,
  };
}
