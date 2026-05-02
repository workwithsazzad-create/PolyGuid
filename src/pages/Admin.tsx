import React, { useState, useEffect } from "react";
import GlassmorphicCard from "@/src/components/ui/GlassmorphicCard";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  UserPlus,
  Image as ImageIcon,
  DollarSign,
  CheckCircle2,
  FileText,
  Youtube,
  Upload,
  Layout,
  Settings,
  BookOpen,
  Heart,
  Check,
  X,
  Trash2,
  FileCheck,
  Search,
  Loader2,
  AlertCircle,
  FileUp,
  Paperclip,
  Database,
  Users,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { getDirectLink } from "@/src/lib/utils";
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type AdminTab =
  | "courses"
  | "banner"
  | "analytics"
  | "donations"
  | "pdf"
  | "youtube"
  | "admins"
  | "users"
  | "results";

import AdminCourses from "../components/admin/AdminCourses";
import AdminUsers from "../components/admin/AdminUsers";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("courses");
  const [isPremium, setIsPremium] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Analytics Stats State
  const [stats, setStats] = useState({
    courses: "150",
    students: "20000",
    polytechnics: "49",
  });
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsMsg, setStatsMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Donations State
  const [donationNumber, setDonationNumber] = useState("");
  const [donations, setDonations] = useState<any[]>([]);
  const [isSavingDonationNum, setIsSavingDonationNum] = useState(false);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // Fetch student count
  const fetchDBStats = async () => {
    const { count, error } = await supabase
      .from("student_results")
      .select("*", { count: "exact", head: true });

    if (!error && count !== null) {
      setTotalStudentsCount(count);
    }
  };

  React.useEffect(() => {
    if (activeTab === "results") {
      fetchDBStats();
    }
  }, [activeTab]);

  // Fetch settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "stat_courses",
          "stat_students",
          "stat_polytechnics",
          "home_banner",
          "donation_number",
        ]);

      if (data) {
        const newStats = { ...stats };
        data.forEach((item) => {
          if (item.key === "stat_courses") newStats.courses = item.value;
          if (item.key === "stat_students") newStats.students = item.value;
          if (item.key === "stat_polytechnics")
            newStats.polytechnics = item.value;
          if (item.key === "home_banner") setBannerUrl(item.value);
          if (item.key === "donation_number") setDonationNumber(item.value);
        });
        setStats(newStats);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Donations
  React.useEffect(() => {
    if (activeTab === "donations") {
      const fetchDonations = async () => {
        const { data } = await supabase
          .from("donations")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setDonations(data);
      };
      fetchDonations();
    }
  }, [activeTab]);

  const handleSaveDonationNumber = async () => {
    setIsSavingDonationNum(true);
    try {
      // Robust save: Check if exists, then update or insert
      const { data: existing } = await supabase.from("site_settings").select("key").eq("key", "donation_number").maybeSingle();
      
      let error;
      if (existing) {
        const { error: updateError } = await supabase.from("site_settings").update({ value: donationNumber }).eq("key", "donation_number");
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("site_settings").insert({ key: "donation_number", value: donationNumber });
        error = insertError;
      }

      if (error) throw error;
      setStatusMsg({ type: "success", text: "✅ Donation number updated!" });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: "❌ Failed to save donation number.",
      });
    } finally {
      setIsSavingDonationNum(false);
    }
  };

  const updateDonationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("donations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setDonations(donations.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deleteDonation = async (id: string) => {
    // Removed window.confirm as it is blocked in the iframe
    try {
      const { error } = await supabase.from("donations").delete().eq("id", id);
      if (error) throw error;
      setDonations(donations.filter((d) => d.id !== id));
    } catch (err: any) {
      console.error("Error deleting donation:", err);
      // alert is also blocked in iframe, so we just log it or use a toast.
      // For now, we'll just log it.
    }
  };

  const handleSaveStats = async () => {
    setStatsMsg(null);
    setIsSavingStats(true);
    try {
      const statsToSave = [
        { key: "stat_courses", value: stats.courses },
        { key: "stat_students", value: stats.students },
        { key: "stat_polytechnics", value: stats.polytechnics },
      ];

      for (const item of statsToSave) {
        const { data: existing } = await supabase.from("site_settings").select("key").eq("key", item.key).maybeSingle();
        if (existing) {
          await supabase.from("site_settings").update({ value: item.value }).eq("key", item.key);
        } else {
          await supabase.from("site_settings").insert(item);
        }
      }

      setStatsMsg({
        type: "success",
        text: "✅ Analytics stats updated successfully!",
      });
    } catch (err: any) {
      console.error("Failed to save stats:", err);
      setStatsMsg({
        type: "error",
        text: `❌ Failed to save stats. Error: ${err.message}`,
      });
    } finally {
      setIsSavingStats(false);
    }
  };

  const handleBannerApply = async () => {
    setStatusMsg(null);
    if (!bannerUrl) {
      setStatusMsg({
        type: "error",
        text: "Please provide a banner URL or upload an image first.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase.from("site_settings").select("key").eq("key", "home_banner").maybeSingle();
      
      let dbError;
      if (existing) {
        const { error: updateError } = await supabase.from("site_settings").update({ value: bannerUrl }).eq("key", "home_banner");
        dbError = updateError;
      } else {
        const { error: insertError } = await supabase.from("site_settings").insert({ key: "home_banner", value: bannerUrl });
        dbError = insertError;
      }

      if (dbError) {
        throw dbError;
      }
      setStatusMsg({
        type: "success",
        text: "✅ Banner successfully saved to database! Everyone can see it now.",
      });
    } catch (err: any) {
      console.error("Supabase save failed:", err);
      setStatusMsg({
        type: "error",
        text: `❌ Failed to save to database. Error: ${err.message || "Unknown error"}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "banner", label: "Banner", icon: Layout },
    { id: "analytics", label: "Analytics", icon: FileText },
    { id: "donations", label: "Donations", icon: Heart },
    { id: "pdf", label: "PDFs", icon: FileText },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "admins", label: "Admins", icon: UserPlus },
    { id: "results", label: "Result Parser", icon: FileCheck },
  ];

  // Result Parser State
  const [parseText, setParseText] = useState("");
  const [parseStatus, setParseStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [parsedResults, setParsedResults] = useState<any[]>([]);
  const [parsedMeta, setParsedMeta] = useState({
    polytechnic: "",
    regulation: "2022",
    department: "Diploma in Engineering",
    published_date: "",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resultStats, setResultStats] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("student_results")
        .select("department, regulation, semesters");

      if (data) {
        const counts: any = {};
        data.forEach((row) => {
          const key = `${row.department} (${row.regulation})`;
          if (!counts[key]) counts[key] = { total: 0, sems: new Set() };
          counts[key].total++;
          row.semesters?.forEach((s: any) => counts[key].sems.add(s.index));
        });

        setResultStats(
          Object.entries(counts).map(([name, val]: [string, any]) => ({
            name,
            count: val.total,
            semesters: Array.from(val.sems).sort(),
          })),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [totalStudentsCount]);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("student_results")
        .delete()
        .neq("roll_no", "0"); // Delete all rows where roll_no is not '0'

      if (error) throw error;
      
      setTotalStudentsCount(0);
      setResultStats([]);
      setShowDeleteConfirm(false);
      setParseStatus({ type: 'success', text: 'সকল রেজাল্ট সফলভাবে ডাটাবেস থেকে ডিলিট করা হয়েছে।' });
    } catch (err: any) {
      setParseStatus({ type: 'error', text: 'কোথাও সমস্যা হয়েছে বা ডিলিট করার পারমিশন নেই: ' + err.message });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseStatus(null);
    setIsExtractingPDF(true);
    setPdfProgress(0);
    setParseText("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
        setPdfProgress(Math.round((i / pdf.numPages) * 100));
      }

      setParseText(fullText);
      setParseStatus({
        type: "success",
        text: `PDF থেকে মোট ${pdf.numPages} পেজ টেক্সট এক্সট্রাক্ট করা হয়েছে। ডিটেক্ট করা হচ্ছে...`,
      });

      // Auto-parse immediately
      handleParse(fullText);
    } catch (err: any) {
      console.error("PDF error:", err);
      setParseStatus({
        type: "error",
        text: "PDF পড়তে সমস্যা হয়েছে: " + err.message,
      });
    } finally {
      setIsExtractingPDF(false);
    }
  };

  const handleParse = (textToParse?: string) => {
    setParseStatus(null);
    const text = textToParse || parseText;
    if (!text.trim()) return;

    try {
      const students: any[] = [];

      // 1. First, find all Polytechnic institute headers and their positions
      // Pattern: 12053 - Thakurgaon Polytechnic Institute, Thakurgaon
      const polyHeaders: { name: string; pos: number }[] = [];
      const polyHeaderRegex = /(\d{5})\s*-\s*([^,\n\r]+)/g;
      let polyMatch;
      while ((polyMatch = polyHeaderRegex.exec(text)) !== null) {
        polyHeaders.push({ name: polyMatch[2].trim(), pos: polyMatch.index });
      }

      // 2. Find all Semester headers and their positions
      // Pattern: 4th Semester (2022 Regulation) or similar
      const semHeaders: { index: number; regulation: string; pos: number }[] =
        [];
      const semHeaderRegex =
        /(\d+)(?:st|nd|rd|th)\s*(?:Semester|Probidhan)\s*(?:\(([^)]+)\))?/gi;
      let semMatch;
      while ((semMatch = semHeaderRegex.exec(text)) !== null) {
        semHeaders.push({
          index: parseInt(semMatch[1]),
          regulation: (semMatch[2] || "2022")
            .replace(/Regulation/gi, "")
            .trim(),
          pos: semMatch.index,
        });
      }

      // 3. Global detection of student blocks: Roll (...) or Roll {...}
      // Improved regex to handle internal (T) or (P) markers
      const studentBlockRegex =
        /(\d{6})\s*(?:\{((?:[^{}]*|\{[^{}]*\})*)\}|\(([^)]*(?:\([TP]\)[^)]*)*)\))/gs;
      let match;

      while ((match = studentBlockRegex.exec(text)) !== null) {
        const roll = match[1];
        const referredContent = match[2]; // Content from { ... }
        const passedContent = match[3]; // Content from ( ... )
        const matchPos = match.index;

        const isReferredFormat = referredContent !== undefined;
        const innerContent =
          (isReferredFormat ? referredContent : passedContent) || "";

        // Find the polytechnic and semester that appeared most recently BEFORE this block
        const poly =
          [...polyHeaders].reverse().find((p) => p.pos < matchPos)?.name ||
          "Unknown Institute";
        const semInfo = [...semHeaders]
          .reverse()
          .find((s) => s.pos < matchPos) || { index: 1, regulation: "2022" };

        // Clean content but keep internal subject code markers
        const cleanContent = innerContent.replace(/[\n\r]/g, " ").trim();
        
        let refSubString = "";
        let contentWithoutRefSub = cleanContent;
        const refMatch = cleanContent.match(/ref_sub:\s*(.+)$/i);
        if (refMatch) {
          refSubString = refMatch[1];
          contentWithoutRefSub = cleanContent.replace(/,\s*ref_sub:\s*(.+)$/i, '');
        }

        const parts = contentWithoutRefSub
          .split(/,(?![^()]*\))/)
          .map((p) => p.trim())
          .filter(Boolean);

        const currentSemesters: any[] = [];
        let referredSubjects: string[] = [];

        if (refSubString) {
          referredSubjects = refSubString.split(',').map(s => s.trim());
        }

        const hasGpaLabel = contentWithoutRefSub.toLowerCase().includes("gpa");

        if (hasGpaLabel) {
          parts.forEach((part) => {
            if (part.includes(":")) {
              const [key, val] = part.split(":").map((s) => s.trim());
              if (key.toLowerCase().startsWith("gpa")) {
                const sIdx = parseInt(key.replace(/[^\d]/g, ""));
                const isRef =
                  val.toLowerCase() === "ref" ||
                  val.toLowerCase() === "referred";
                
                let myRefSubs: string[] = [];
                if (isRef) {
                  const mapped = referredSubjects.filter(sub => {
                    const digits = sub.replace(/\D/g, '');
                    if (semInfo.regulation === "2022" && digits.length >= 4) {
                      return parseInt(digits[3]) === sIdx;
                    }
                    if (semInfo.regulation === "2016" && digits.length >= 3) {
                      return parseInt(digits[2]) === sIdx;
                    }
                    if (digits.length >= 3) return parseInt(digits[2]) === sIdx;
                    return false;
                  });
                  myRefSubs = mapped.length > 0 ? mapped : referredSubjects;
                }

                currentSemesters.push({
                  index: sIdx,
                  status: isRef ? "Referred" : "Passed",
                  gpa: isRef ? null : val,
                  referred_subjects: myRefSubs,
                });
              }
            }
          });
        } else {
          referredSubjects = parts;
          currentSemesters.push({
            index: semInfo.index,
            status: "Referred",
            gpa: null,
            referred_subjects: referredSubjects,
          });
        }

        if (currentSemesters.length > 0) {
          students.push({
            roll_no: roll,
            polytechnic_name: poly,
            regulation: semInfo.regulation,
            department: "Diploma in Engineering",
            semesters: currentSemesters,
            published_date:
              parsedMeta.published_date ||
              new Date().toISOString().split("T")[0],
          });
        }
      }

      if (students.length === 0) {
        setParseStatus({
          type: "error",
          text: "কোন রেজাল্ট খুঁজে পাওয়া যায়নি। দয়া করে সঠিক BTEB PDF আপলোড করুন।",
        });
      } else {
        // Remove duplicates within this session
        const uniqueStudents = Object.values(
          students.reduce(
            (acc, current) => {
              acc[current.roll_no] = current;
              return acc;
            },
            {} as Record<string, any>,
          ),
        );

        setParsedResults(uniqueStudents);
        setParseStatus({
          type: "success",
          text: `সফলভাবে ${uniqueStudents.length} জনের রেজাল্ট ডিটেক্ট করা হয়েছে। নিচে প্রিভিউ দেখুন এবং সেভ করুন।`,
        });
      }
    } catch (err: any) {
      setParseStatus({
        type: "error",
        text: "এনালাইজ করতে সমস্যা: " + err.message,
      });
    }
  };

  const saveParsedResults = async () => {
    if (parsedResults.length === 0) return;
    setIsParsing(true);
    setParseStatus(null);

    try {
      // Chunk size for database operations (e.g., 200 students at a time)
      const CHUNK_SIZE = 200;
      let totalSaved = 0;
      let totalUpdated = 0;
      let totalNew = 0;

      for (let i = 0; i < parsedResults.length; i += CHUNK_SIZE) {
        const chunk = parsedResults.slice(i, i + CHUNK_SIZE);
        const rollsInChunk = chunk.map((r) => r.roll_no);

        // 1. Fetch existing records for this chunk to merge
        const { data: existingRecords, error: fetchError } = await supabase
          .from("student_results")
          .select("*")
          .in("roll_no", rollsInChunk);

        if (fetchError) throw fetchError;

        // 2. Merge data for this chunk
        const mergedChunk = chunk.map((parsedStudent) => {
          const existing = existingRecords?.find(
            (dbRow) => dbRow.roll_no === parsedStudent.roll_no,
          );
          let mergedSemesters = parsedStudent.semesters;

          if (existing) {
            totalUpdated++;
            // Smart Merge: Combine existing semesters with newly parsed ones
            const existingSems = [...(existing.semesters || [])];
            parsedStudent.semesters.forEach((newSem: any) => {
              const semIdx = existingSems.findIndex(
                (s) => s.index === newSem.index,
              );
              if (semIdx !== -1) {
                // Update specific fields of existing semester (keep what's not in new one)
                existingSems[semIdx] = { ...existingSems[semIdx], ...newSem };
              } else {
                // Add new semester to the academic history
                existingSems.push(newSem);
              }
            });
            mergedSemesters = existingSems.sort((a, b) => a.index - b.index);
          } else {
            totalNew++;
          }

          return {
            roll_no: parsedStudent.roll_no,
            polytechnic_name:
              parsedStudent.polytechnic_name ||
              existing?.polytechnic_name ||
              parsedMeta.polytechnic ||
              "Unknown Institute",
            regulation:
              parsedStudent.regulation ||
              existing?.regulation ||
              parsedMeta.regulation ||
              "2022",
            department:
              parsedStudent.department ||
              existing?.department ||
              parsedMeta.department ||
              "Diploma in Engineering",
            semesters: mergedSemesters,
            published_date:
              parsedStudent.published_date ||
              existing?.published_date ||
              parsedMeta.published_date ||
              new Date().toISOString().split("T")[0],
          };
        });

        // 3. Upsert this chunk
        const { error: upsertError } = await supabase
          .from("student_results")
          .upsert(mergedChunk, { onConflict: "roll_no" });

        if (upsertError) {
          if (upsertError.message.includes("row-level security")) {
            throw new Error(
              "RLS Policy Error: Please disable RLS for student_results table in Supabase SQL Editor.",
            );
          }
          throw upsertError;
        }
        totalSaved += mergedChunk.length;

        // Update status for the user
        setParseStatus({
          type: "success",
          text: `ডাটাবেজ আপডেট হচ্ছে... (${totalSaved}/${parsedResults.length} জন রেডি, নতুন: ${totalNew}, আপডেট: ${totalUpdated})`,
        });
      }

      setParseStatus({
        type: "success",
        text: `✅ সাফল্যের সাথে সম্পন্ন হয়েছে! মোট ${totalSaved} জন ছাত্রের ডাটা (নতুন: ${totalNew}, আপডেট: ${totalUpdated}) সংরক্ষিত হয়েছে।`,
      });
      setParsedResults([]);
      setParseText("");
      fetchDBStats(); // Refresh count
    } catch (err: any) {
      console.error("Save error:", err);
      setParseStatus({ type: "error", text: `ডেটাবেস এরর: ${err.message}` });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-12"
    >
      {/* Tab Navigation */}
      <div className="w-full relative">
        <div 
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-0 sm:px-0 scroll-smooth touch-pan-x snap-x hide-scrollbar border-b border-black/10 dark:border-white/10"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-start shrink-0 ${
                activeTab === tab.id
                  ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/25 scale-100 sm:scale-105 z-10"
                  : "text-gray-500 hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "courses" && <AdminCourses />}

          {activeTab === "users" && <AdminUsers />}

          {activeTab === "banner" && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                  <Layout className="text-[var(--primary)]" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">
                    Home Page Hero Banner
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage the main banner image shown to students</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative pt-2">
                  <label className="absolute -top-1.5 left-3 bg-white dark:bg-[#1a1a1a] px-1 text-[11px] font-bold text-gray-400 uppercase z-10 transition-all tracking-wider">Banner Image URL*</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Paperclip size={18} />
                    </div>
                    <input
                      required
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="Paste Google Drive share link or direct image URL..."
                      className="w-full bg-transparent border border-gray-300 dark:border-white/10 rounded-md p-3 pl-10 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 px-1 leading-relaxed">
                    Recommended size: 1200 x 400 pixels. High quality Google Drive links are supported automatically.
                  </p>
                </div>

                {bannerUrl && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Preview</p>
                      <span className="text-[10px] text-green-500 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">Active View</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5 shadow-inner">
                      <img
                        src={getDirectLink(bannerUrl)}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  </div>
                )}

                {statusMsg && (
                  <div
                    className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${statusMsg.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${statusMsg.type === "success" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    {statusMsg.text}
                  </div>
                )}

                <button
                  onClick={handleBannerApply}
                  disabled={isSaving || !bannerUrl}
                  className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-xl hover:bg-[#28a428] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 active:scale-[0.98]"
                >
                  {isSaving
                    ? "Upgrading Site Server..."
                    : "Apply Changes to Banner"}
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === "analytics" && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Edit Analytics Numbers
                </h2>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Courses
                  </label>
                  <input
                    type="number"
                    value={stats.courses}
                    onChange={(e) =>
                      setStats({ ...stats, courses: e.target.value })
                    }
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fake Student Count (Offset)
                  </label>
                  <input
                    type="number"
                    value={stats.students}
                    onChange={(e) =>
                      setStats({ ...stats, students: e.target.value })
                    }
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    This value will be added to the actual database user count.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Polytechnics
                  </label>
                  <input
                    type="number"
                    value={stats.polytechnics}
                    onChange={(e) =>
                      setStats({ ...stats, polytechnics: e.target.value })
                    }
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                  />
                </div>

                {statsMsg && (
                  <div
                    className={`p-3 rounded-lg text-sm font-medium ${statsMsg.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    {statsMsg.text}
                  </div>
                )}

                <button
                  onClick={handleSaveStats}
                  disabled={isSavingStats}
                  className="w-full bg-[var(--primary)] text-black font-bold py-3 rounded-lg hover:bg-[#28a428] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSavingStats ? "Saving..." : "Save Analytics Numbers"}
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === "donations" && (
            <div className="flex flex-col gap-6">
              <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Heart className="text-red-500" size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text)]">
                    Donation Settings
                  </h2>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Donation Receive Number (bKash/Nagad/Rocket)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={donationNumber}
                      onChange={(e) => setDonationNumber(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                    />
                    <button
                      onClick={handleSaveDonationNumber}
                      disabled={isSavingDonationNum}
                      className="bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold px-4 rounded-lg transition-all text-sm disabled:opacity-50"
                    >
                      {isSavingDonationNum ? "Saving..." : "Save"}
                    </button>
                  </div>
                  {statusMsg && activeTab === "donations" && (
                    <p
                      className={`text-xs mt-1 ${statusMsg.type === "success" ? "text-green-500" : "text-red-500"}`}
                    >
                      {statusMsg.text}
                    </p>
                  )}
                </div>
              </GlassmorphicCard>

              <GlassmorphicCard className="max-w-4xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[var(--text)] mb-6">
                  Donation Submissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-black/5 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Name</th>
                        <th className="px-4 py-3">Polytechnic</th>
                        <th className="px-4 py-3">TrxID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            No donations found.
                          </td>
                        </tr>
                      ) : (
                        donations.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-black/5 dark:border-white/5 last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-[var(--text)]">
                              {d.student_name}
                            </td>
                            <td className="px-4 py-3">{d.polytechnic_name}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {d.transaction_id}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  d.status === "approved"
                                    ? "bg-green-500/10 text-green-500"
                                    : d.status === "rejected"
                                      ? "bg-red-500/10 text-red-500"
                                      : "bg-yellow-500/10 text-yellow-500"
                                }`}
                              >
                                {d.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {d.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateDonationStatus(d.id, "approved")
                                      }
                                      className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-md transition-colors"
                                      title="Approve"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateDonationStatus(d.id, "rejected")
                                      }
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                                      title="Reject"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}
                                {(d.status === "approved" ||
                                  d.status === "rejected") && (
                                  <button
                                    onClick={() => deleteDonation(d.id)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassmorphicCard>
            </div>
          )}

          {activeTab === "pdf" && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-red-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Add PDF Book
                </h2>
              </div>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                <p className="text-gray-500 text-sm">
                  PDF Management coming soon...
                </p>
                <button className="mt-4 text-[var(--primary)] text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> Add First PDF
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === "youtube" && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Youtube className="text-blue-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Add YouTube Playlist
                </h2>
              </div>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                <p className="text-gray-500 text-sm">
                  YouTube Management coming soon...
                </p>
                <button className="mt-4 text-[var(--primary)] text-sm font-bold flex items-center gap-1">
                  <Plus size={16} /> Add First Playlist
                </button>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === "admins" && (
            <GlassmorphicCard className="max-w-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="text-blue-500" size={18} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Manage Admins
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                    />
                    <button className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text)] font-bold px-4 rounded-lg transition-all text-sm">
                      Grant
                    </button>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          )}

          {activeTab === "results" && (
            <div className="flex flex-col gap-6">
              <GlassmorphicCard className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <FileCheck className="text-green-500" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text)]">
                        Smart Result Parser
                      </h2>
                      <p className="text-xs text-gray-500">
                        PDF এর টেক্সট কপি করে পেস্ট করুন, পলিটেকনিক অটোমেটিক
                        ডিটেক্ট হবে।
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 bg-[var(--primary)]/10 px-4 py-2 rounded-xl text-[var(--primary)] font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {totalStudentsCount.toLocaleString()} Students in DB
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[var(--card)] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Database size={18} />
                      <h4 className="font-bold text-sm">স্টোরেজ রিপোর্ট</h4>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-[var(--text)]">{(totalStudentsCount * 0.0015).toFixed(2)}</span>
                      <span className="text-xs text-gray-500 font-bold mb-1">MB</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      {totalStudentsCount} জন ছাত্রের ডেটা মাত্র {(totalStudentsCount * 0.0015).toFixed(2)} MB জায়গা নিয়েছে। (PDF ফাইল সেভ হয় না, শুধু দরকারি রেজাল্টগুলো সেভ হয়)।<br/>
                      <span className="text-[var(--text)] opacity-70">ফ্রি ডাটাবেসে <span className="text-blue-400">500 MB</span> জায়গা থাকে, অর্থাৎ আপনি প্রায় ৩ লক্ষ ছাত্রের ডেটা নিশ্চিন্তে ফ্রিতে রাখতে পারবেন!</span>
                    </p>
                  </div>

                  <div className="relative overflow-hidden bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3">
                      <Trash2 className="text-red-500" size={24} />
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text)] mb-1">
                      Clear Database
                    </h4>
                    <p className="text-[10px] text-gray-400 mb-4">
                      Delete all student records to start fresh
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                      disabled={isDeleting || totalStudentsCount === 0}
                      className="w-full mt-auto py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="animate-spin mx-auto" size={16} />
                      ) : (
                        "Delete Everything"
                      )}
                    </button>
                    
                    {showDeleteConfirm && (
                      <div className="absolute inset-0 bg-black/90 rounded-2xl p-6 flex flex-col items-center justify-center text-center z-10 border border-red-500/50">
                        <AlertCircle className="text-red-500 mb-2" size={24} />
                        <h4 className="font-bold text-sm text-[var(--text)] mb-2">Are you fully sure?</h4>
                        <p className="text-[10px] text-gray-400 mb-4">You cannot undo this action.</p>
                        <div className="flex gap-2 w-full mt-auto">
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2 bg-black/50 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleDeleteAll}
                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
                      <AlertCircle className="text-orange-500" size={24} />
                    </div>
                    <code className="bg-black/20 p-2 rounded text-[9px] font-mono break-all text-orange-400 select-all mb-2 mt-auto w-full">
                      ALTER TABLE student_results DISABLE ROW LEVEL SECURITY;
                    </code>
                    <p className="text-[9px] text-gray-500">
                      Run this in SQL Editor if saving fails
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="relative border-2 border-dashed border-green-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-green-500/5 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      {isExtractingPDF ? (
                        <Loader2
                          className="text-green-500 animate-spin"
                          size={24}
                        />
                      ) : (
                        <FileUp className="text-green-500" size={24} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[var(--text)]">
                        {isExtractingPDF
                          ? `Reading PDF... ${pdfProgress}%`
                          : "Upload Result PDF"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Directly extract text from 1000+ pages PDF
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isExtractingPDF || isParsing}
                    />
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <AlertCircle size={18} />
                      <h4 className="font-bold text-sm">
                        Fix RLS Violation Error
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                      যদি সেভ করার সময় "RLS policy" এরর পান, অথবা সার্চ দ্রুত
                      করতে চান, তবে Supabase Dashboard এর SQL Editor এ নিচের
                      কমান্ডগুলো রান করুন:
                    </p>
                    <code className="bg-black/20 p-2 rounded text-[9px] font-mono break-all text-red-400 select-all">
                      ALTER TABLE student_results DISABLE ROW LEVEL SECURITY;
                      <br />
                      ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
                      <br />
                      CREATE INDEX IF NOT EXISTS idx_roll_no ON
                      student_results(roll_no);
                    </code>
                  </div>
                </div>

                {/* Textarea hidden for cleaner UI, processed directly via PDF Dropzone */}
                <div className="hidden">
                  <textarea
                    rows={12}
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                    placeholder="পুরো PDF এর টেক্সট এখানে পেস্ট করুন..."
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm font-mono text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#32CD32]/30 transition-all"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  {parsedResults.length > 0 && (
                    <button
                      onClick={() => {
                        setParsedResults([]);
                        setParseStatus(null);
                        setParseText("");
                      }}
                      className="flex-1 bg-black/5 dark:bg-white/10 text-[var(--text)] font-bold py-4 rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={saveParsedResults}
                    disabled={isParsing || parsedResults.length === 0}
                    className="flex-[2] bg-[var(--primary)] text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(50,205,50,0.3)] transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isParsing ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <FileCheck size={18} />
                    )}
                    Save {parsedResults.length} Students
                  </button>
                </div>

                {parseStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${parseStatus.type === "success" ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}
                  >
                    {parseStatus.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    {parseStatus.text}
                  </motion.div>
                )}
              </GlassmorphicCard>

              {parsedResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {parsedResults.slice(0, 20).map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 text-xs"
                    >
                      <p className="font-bold text-[var(--primary)] mb-1">
                        Roll: {r.roll_no}
                      </p>
                      <div className="space-y-0.5 text-gray-500">
                        {r.semesters.map((s: any) => (
                          <div key={s.index} className="flex justify-between">
                            <span>Sem {s.index}:</span>
                            <span
                              className={
                                s.status === "Referred"
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              {s.status === "Referred" ? "Ref" : s.gpa}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {parsedResults.length > 20 && (
                    <div className="col-span-full text-center py-4 text-gray-400 text-xs font-bold">
                      + {parsedResults.length - 20} more results parsed
                      successfully
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
