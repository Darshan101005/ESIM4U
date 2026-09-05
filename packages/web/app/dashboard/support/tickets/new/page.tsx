"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardTopbar from "@/components/dashboard/topbar";
import SelectMenu from "@/components/admin/select-menu";
import { ArrowLeft, Loader2, Paperclip, X, FileText, ImageIcon, Send } from "lucide-react";
import toast from "react-hot-toast";
import { TICKET_CATEGORIES, TICKET_DEPARTMENTS } from "@/lib/support-constants";
import { MAX_ATTACHMENTS, MAX_FILE_BYTES, type PendingAttachment } from "@/components/support/shared";

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<PendingAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_ATTACHMENTS - files.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_ATTACHMENTS} files`);
      return;
    }
    Array.from(list)
      .slice(0, room)
      .forEach((file) => {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} is too large (max 15MB)`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () =>
          setFiles((prev) =>
            prev.length < MAX_ATTACHMENTS
              ? [...prev, { dataUri: reader.result as string, name: file.name, type: file.type, size: file.size }]
              : prev
          );
        reader.readAsDataURL(file);
      });
  };

  const submit = async () => {
    const finalCategory = category === "Other" ? otherCategory.trim() || "Other" : category;
    if (!title.trim()) { toast.error("Please add a title"); return; }
    if (!message.trim()) { toast.error("Please describe your issue"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          category: finalCategory,
          department,
          body: message.trim(),
          attachments: files.map((f) => ({ dataUri: f.dataUri, name: f.name })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create ticket");
      toast.success(`Ticket ${data.ticket.ticket_ref} created`);
      router.replace(`/dashboard/support/tickets/${data.ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create ticket");
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-[#FF561E] focus:ring-2 focus:ring-[#FF561E]/10 text-[14px] transition-all";
  const labelCls = "block text-[13px] font-semibold text-[#1A1D20] mb-1.5";

  return (
    <>
      <DashboardTopbar title="New Ticket" />
      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-2xl mx-auto w-full">
        <Link href="/dashboard/support/tickets" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#FF561E] mb-5">
          <ArrowLeft className="w-4 h-4" /> All tickets
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of your issue" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Order ESIM4U-XXXX" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Problem</label>
              <SelectMenu
                value={category}
                onChange={setCategory}
                placeholder="Select a problem…"
                options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <SelectMenu
                value={department}
                onChange={setDepartment}
                placeholder="Select a department…"
                options={TICKET_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              />
            </div>
          </div>

          {category === "Other" && (
            <div>
              <label className={labelCls}>Please specify</label>
              <input value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} placeholder="Describe your problem type" className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Message <span className="text-red-500">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail. You can use **bold** and *italic*."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Attachments <span className="font-normal text-[#6B7280]">(any file, up to {MAX_ATTACHMENTS} · 15MB each)</span></label>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 pl-2 pr-1 py-1.5">
                  {f.type.startsWith("image/") ? <ImageIcon className="w-3.5 h-3.5 text-[#FF561E]" /> : <FileText className="w-3.5 h-3.5 text-[#FF561E]" />}
                  <span className="text-[12px] text-[#1A1D20] max-w-[140px] truncate">{f.name}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {files.length < MAX_ATTACHMENTS && (
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[12.5px] font-semibold text-[#6B7280] hover:border-[#FF561E] hover:text-[#FF561E] cursor-pointer transition-colors">
                  <Paperclip className="w-3.5 h-3.5" /> Add file
                  <input type="file" multiple className="hidden" onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF561E] text-white text-[14px] font-bold hover:bg-[#E04B18] transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
        </div>
      </main>
    </>
  );
}
