'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Issue } from '@/types';

interface EditIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue | null;
  onSuccess: () => void;
  existingProjects?: string[];
  existingDescriptions?: string[];
}

export function EditIssueModal({ 
  open, 
  onOpenChange, 
  issue,
  onSuccess,
  existingProjects = [],
  existingDescriptions = []
}: EditIssueModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form States
  const [openDate, setOpenDate] = useState('');
  const [project, setProject] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('In Progress');
  const [location, setLocation] = useState('');
  const [workItemType, setWorkItemType] = useState('Issue');

  // Load issue data when modal opens
  useEffect(() => {
    if (issue) {
      setOpenDate(issue.openDate || new Date().toISOString().substring(0, 10));
      setProject(issue.project || '');
      setCategory(issue.category || '');
      setDescription(issue.description || '');
      setDueDate(issue.dueDate || new Date().toISOString().substring(0, 10));
      setPriority(issue.priority || 'Medium');
      setStatus(issue.status || 'In Progress');
      setLocation(issue.location === 'Unassigned' ? '' : (issue.location || ''));
      setWorkItemType(issue.workItemType || 'Issue');
      setError('');
      setSuccess(false);
    }
  }, [issue, open]);

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setError('');
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    
    if (!project.trim() || !category.trim() || !description.trim()) {
      setError('กรุณากรอกข้อมูลในช่องที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/issues', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...issue,
          project: project.trim(),
          category: category.trim(),
          description: description.trim(),
          openDate,
          dueDate,
          priority,
          status,
          location: location.trim() || 'Unassigned',
          workItemType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onSuccess();
        setTimeout(() => {
          handleClose(false);
        }, 1500);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 text-slate-800 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-600 font-sans">
            <Settings className="w-5 h-5 text-indigo-600" /> ตั้งค่า Work Item: {issue?.issueId}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-sans">
            แก้ไขและปรับปรุงรายละเอียดสถานะหรือข้อมูลต่างๆ ของ Work Item นี้
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <p className="font-semibold text-slate-800 text-lg">บันทึกข้อมูลสำเร็จ!</p>
            <p className="text-sm text-slate-500">ระบบจะทำการปิดหน้าต่างนี้และรีเฟรชข้อมูลโดยอัตโนมัติ...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2 font-sans">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date (วันที่เริ่ม) *</label>
                <input 
                  type="date" 
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-mono"
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Due Date (กำหนดเสร็จ) *</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-mono"
                  required
                />
              </div>

              {/* Work Item Type */}
              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Work Item (ประเภท) *</label>
                <select 
                  value={workItemType}
                  onChange={(e) => setWorkItemType(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-semibold cursor-pointer"
                  required
                >
                  <option value="Issue">Issue</option>
                  <option value="Requirement">Requirement</option>
                </select>
              </div>

              {/* Topic / Agenda */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-semibold text-slate-600 mb-1">Topic / Agenda (หัวข้อ) *</label>
                <input 
                  type="text" 
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="เช่น Document, Monitoring"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  list="edit-projects-list"
                  required
                />
                <datalist id="edit-projects-list">
                  {existingProjects.map((proj) => (
                    <option key={proj} value={proj} />
                  ))}
                </datalist>
              </div>

              {/* Action Item */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block font-semibold text-slate-600 mb-1">Action Item (รายละเอียดงาน) *</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="กรอกรายละเอียดงานหรือหัวข้อปัญหาที่พบ..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  list="edit-descriptions-list"
                  required
                />
                <datalist id="edit-descriptions-list">
                  {existingDescriptions.map((desc) => (
                    <option key={desc} value={desc} />
                  ))}
                </datalist>
              </div>

              {/* Priority */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Priority (ความสำคัญ)</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Status (สถานะ)</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Discussion */}
              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Discussion (หมวดหมู่) *</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="เช่น Architectural, MEP"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  required
                />
              </div>

              {/* Comments */}
              <div className="col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Comments (ความคิดเห็น)</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="กรอกความคิดเห็นเพิ่มเติม..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                type="button"
                variant="outline" 
                className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md px-6 flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกการแก้ไข
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
