import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
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
  Bell,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { runSupabaseAutoVerification } from "@/src/lib/autoVerification";
import { getDirectLink } from "@/src/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type AdminTab =
  | "courses"
  | "pages"
  | "analytics"
  | "transactions"
  | "logs"
  | "pdf"
  | "youtube"
  | "users"
  | "results"
  | "notifications"
  | "verifications";

import AdminCourses from "../components/admin/AdminCourses";
import AdminUsers from "../components/admin/AdminUsers";
import AdminPages from "../components/admin/AdminPages";
import AdminPdfs from "../components/admin/AdminPdfs";
import AdminVerifications from "../components/admin/AdminVerifications";

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>((searchParams.get("tab") as AdminTab) || "courses");
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventPageScroll = (e: WheelEvent) => {
      const container = tabsScrollRef.current;
      if (container && e.deltaY !== 0) {
        container.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    const container = tabsScrollRef.current;
    if (container) {
      container.addEventListener('wheel', preventPageScroll as any, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', preventPageScroll as any);
      }
    };
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab as AdminTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
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

  // Transactions State
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [rocketNumber, setRocketNumber] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSmsConfig, setShowSmsConfig] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSavingDonationNum, setIsSavingDonationNum] = useState(false);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionStatusTab, setTransactionStatusTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [transactionTypeTab, setTransactionTypeTab] = useState<"all" | "course" | "book" | "donation">("all");
  const [approvedOriginTab, setApprovedOriginTab] = useState<"all" | "auto" | "manual">("all");

  const isManualTx = (t: any) => {
    return t.method === 'admin_manual' || (t.transaction_id && String(t.transaction_id).startsWith('MANUAL-'));
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus = t.status === transactionStatusTab;
    const matchesType = transactionTypeTab === "all" || t.type === transactionTypeTab;
    
    let matchesOrigin = true;
    if (transactionStatusTab === "approved") {
      if (approvedOriginTab === "auto") {
        matchesOrigin = !isManualTx(t);
      } else if (approvedOriginTab === "manual") {
        matchesOrigin = isManualTx(t);
      }
    }

    const matchesSearch = !searchQuery || 
      t.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesOrigin && matchesSearch;
  });

  const getStatsForStatus = (status: string) => {
    const list = transactions.filter(t => {
      if (t.status !== status) return false;
      if (transactionTypeTab !== 'all' && t.type !== transactionTypeTab) return false;
      if (status === 'approved') {
        if (approvedOriginTab === 'auto') return !isManualTx(t);
        if (approvedOriginTab === 'manual') return isManualTx(t);
      }
      return true;
    });
    const count = list.length;
    const amount = list.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    return { count, amount };
  };

  const pendingStats = getStatsForStatus("pending");
  const approvedStats = getStatsForStatus("approved");
  const rejectedStats = getStatsForStatus("rejected");

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
          "bkash_number",
          "nagad_number",
          "rocket_number",
        ]);

      if (data) {
        const newStats = { ...stats };
        data.forEach((item) => {
          if (item.key === "stat_courses") newStats.courses = item.value;
          if (item.key === "stat_students") newStats.students = item.value;
          if (item.key === "stat_polytechnics")
            newStats.polytechnics = item.value;
          if (item.key === "home_banner") setBannerUrl(item.value);
          if (item.key === "donation_number") setBkashNumber(item.value); // fallback
          if (item.key === "bkash_number") setBkashNumber(item.value);
          if (item.key === "nagad_number") setNagadNumber(item.value);
          if (item.key === "rocket_number") setRocketNumber(item.value);
        });
        setStats(newStats);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Transactions and Logs automatically + Periodic background Refresh
  React.useEffect(() => {
    if (activeTab === "transactions" || activeTab === "logs") {
      fetchTransactions();
      fetchWebhookLogs();
      handleAutoVerify();

      // Auto-refresh logs and auto-verify every 10 seconds
      const interval = setInterval(() => {
        handleAutoVerify();
        fetchWebhookLogs();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleAutoVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await runSupabaseAutoVerification();
      if (res.newlyVerifiedCount > 0) {
        setVerifyMessage(`🎉 ${res.newlyVerifiedCount} টি ট্রানজেকশন অটো-ভেরিফাই ও অ্যাপ্রুভ হয়েছে!`);
        await fetchTransactions();
      }
    } catch (e: any) {
      console.error("Auto verify error:", e);
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchTransactions = async () => {
    // Fetch normal donations
    const { data: dData } = await supabase
      .from("donations")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    
    // Fetch course payments from the new table
    const { data: pData } = await supabase
      .from("payments")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });

    const userIds = new Set<string>();
    dData?.forEach(d => { if (d.user_id) userIds.add(d.user_id); });
    pData?.forEach(p => { if (p.user_id) userIds.add(p.user_id); });

    let profileMap = new Map<string, any>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, polytechnic_name")
        .in("id", Array.from(userIds));
      if (profiles) {
        profiles.forEach(pr => profileMap.set(pr.id, pr));
      }
    }
      
    const donationsList = (dData || []).map(d => {
      const prof = d.user_id ? profileMap.get(d.user_id) : null;
      return { 
        ...d, 
        _table: 'donations',
        student_name: prof?.full_name || d.student_name || d.phone || 'Anonymous',
        polytechnic_name: prof?.polytechnic_name || d.polytechnic_name || 'N/A',
        phone: prof?.phone || d.phone || 'N/A'
      };
    });

    const paymentsList = (pData || []).map(p => {
      const prof = p.user_id ? profileMap.get(p.user_id) : null;
      return { 
        ...p, 
        _table: 'payments',
        student_name: prof?.full_name || (p.method === 'admin_manual' || (p.transaction_id && String(p.transaction_id).startsWith('MANUAL-')) ? 'Admin Manual Access' : p.phone || 'Guest User'),
        polytechnic_name: prof?.polytechnic_name || p.method || 'N/A',
        phone: prof?.phone || p.phone || 'N/A'
      };
    });
    
    const combined = [...donationsList, ...paymentsList].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (combined.length > 0) {
      // Filter out duplicate TrxIDs in the UI
      const uniqueDocs = combined.filter((v, i, a) => 
        a.findIndex(t => t.transaction_id === v.transaction_id) === i
      );
      setTransactions(uniqueDocs);
    } else {
      setTransactions([]);
    }
  };

  const fetchWebhookLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      // 1. Fetch from database (Persistent)
      const { data: dbLogs, error: dbError } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);
      
      if (!dbError && dbLogs && dbLogs.length > 0) {
        setWebhookLogs(dbLogs.map(l => ({
          timestamp: l.timestamp,
          body: l.payload,
          method: l.method
        })));
        return;
      }

      // 2. Fallback to server API (Local)
      const isWeb = Capacitor.getPlatform() === 'web' || 
                   (typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname.includes('run.app') || 
                     window.location.hostname.includes('ais-dev-')));
      
      const baseUrl = isWeb ? '' : 'https://polyguid.vercel.app';
      const res = await fetch(`${baseUrl}/api/webhook-logs`);
      const data = await res.json();
      setWebhookLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const savePaymentSetting = async (key: string, value: string) => {
      const { data: existing } = await supabase.from("site_settings").select("key").eq("key", key).maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("site_settings").insert({ key, value });
      }
  };

  const handleSaveDonationNumber = async () => {
    setIsSavingDonationNum(true);
    try {
      await savePaymentSetting("bkash_number", bkashNumber);
      await savePaymentSetting("nagad_number", nagadNumber);
      await savePaymentSetting("rocket_number", rocketNumber);

      setStatusMsg({ type: "success", text: "✅ Payment numbers updated!" });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: "❌ Failed to save payment numbers.",
      });
    } finally {
      setIsSavingDonationNum(false);
    }
  };

  const updateTransactionStatus = async (id: string, status: string) => {
    try {
      const tx = transactions.find(t => t.id === id);
      
      // If approved and it's a course or book, auto-enroll
      if (status === 'approved' && tx && tx.status !== 'approved') {
        const isEnrollable = tx.type === 'course' || tx.type === 'book' || tx.type === 'pdf';
        
        if (isEnrollable && tx.course_id && tx.user_id) {
          try {
            await supabase.from('enrollments').insert({
              user_id: tx.user_id,
              course_id: tx.course_id
            });
          } catch (e) {
            // Probably already enrolled, ignore conflict
          }

          // Send approval notification
          await supabase.from('notifications').insert([{
            user_id: tx.user_id,
            title: `${tx.type === 'donation' ? 'Donation' : (tx.type === 'book' || tx.type === 'pdf' ? 'Book' : 'Course')} Approved 🎉`,
            body: `আপনার কেনা ${tx.type === 'book' || tx.type === 'pdf' ? 'বই' : (tx.type === 'course' ? 'কোর্সটি' : 'ডোনেশন')} অ্যাপ্রুভ হয়েছে। এখন আপনি এর কন্টেন্ট দেখতে পারবেন। PolyGuid এর সাথে থাকার জন্য ধন্যবাদ!`,
            type: 'course_approved'
          }]);
        } else if (tx.type === 'donation' && tx.user_id) {
          // Send approval notification for donation
          await supabase.from('notifications').insert([{
            user_id: tx.user_id,
            title: 'Donation Approved 🎉',
            body: 'অভিনন্দন! আপনার ডোনেশনটি অ্যাপ্রুভ হয়েছে এবং আমাদের ওয়েবসাইটে আপনার প্রোফাইলটি ফিচার করা হয়েছে। PolyGuid কে সাপোর্ট করার জন্য ধন্যবাদ!',
            type: 'donation_approved'
          }]);
        }
      } else if (status === 'rejected' && tx && tx.status !== 'rejected') {
        if (tx.user_id) {
          await supabase.from('notifications').insert([{
            user_id: tx.user_id,
            title: `${tx.type === 'donation' ? 'Donation' : (tx.type === 'book' || tx.type === 'pdf' ? 'Book Order' : 'Course Payment')} Rejected ❌`,
            body: `দুঃখিত, আপনার প্রদানকৃত ট্রানজেকশনটি বাতিল করা হয়েছে। যদি কোন ভুল থাকে, দয়া করে আমাদের হেল্পলাইন নাম্বারে যোগাযোগ করুন।`,
            type: 'payment_rejected'
          }]);
        }
      }

      const updateTable = tx?._table || "donations";
      const { error } = await supabase
        .from(updateTable)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setTransactions(transactions.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deleteTransaction = async (id: string, table?: string) => {
    try {
      const targetTable = table || "donations";
      const { error } = await supabase.from(targetTable).delete().eq("id", id);
      if (error) throw error;
      setTransactions(transactions.filter((d) => d.id !== id));
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
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
    { id: "pdf", label: "Books", icon: BookOpen },
    { id: "pages", label: "Manage Pages", icon: Layout },
    { id: "analytics", label: "Analytics", icon: FileText },
    { id: "transactions", label: "Transactions", icon: DollarSign },
    { id: "logs", label: "SMS Logs & Config", icon: Database },
    { id: "verifications", label: "Verifications", icon: ShieldCheck },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "results", label: "Result Parser", icon: FileCheck },
    { id: "notifications", label: "Push Notify", icon: Bell },
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
          ref={tabsScrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-0 sm:px-0 scroll-smooth touch-pan-x snap-x hide-scrollbar border-b border-black/10 dark:border-white/10"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                handleTabChange(tab.id as AdminTab);
              }}
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

          {activeTab === "pages" && <AdminPages />}

          {activeTab === "verifications" && <AdminVerifications />}

          {activeTab === "analytics" && (
            <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
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

          {activeTab === "transactions" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Pending</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-yellow-600">{pendingStats.count}</span>
                    <span className="text-xs text-yellow-600/60 font-bold">৳{pendingStats.amount}</span>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Approved</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-green-600">{approvedStats.count}</span>
                    <span className="text-xs text-green-600/60 font-bold">৳{approvedStats.amount}</span>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Rejected</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-red-600">{rejectedStats.count}</span>
                    <span className="text-xs text-red-600/60 font-bold">৳{rejectedStats.amount}</span>
                  </div>
                </div>
              </div>

              <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
                <div className="flex flex-col gap-6">
                  {/* Transaction Tabs and Filters */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl w-fit">
                        {(["pending", "approved", "rejected"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setTransactionStatusTab(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                              transactionStatusTab === status
                                ? "bg-[var(--primary)] text-white shadow-md"
                                : "text-gray-500 hover:text-[var(--text)]"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>

                      {/* Origin Sub-filter: auto / manual / all - ONLY shown when Approved is selected */}
                      {transactionStatusTab === "approved" && (
                        <div className="flex p-1 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit transition-all">
                          {(["all", "auto", "manual"] as const).map((origin) => (
                            <button
                              key={origin}
                              onClick={() => setApprovedOriginTab(origin)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                                approvedOriginTab === origin
                                  ? "bg-purple-600 text-white shadow-md"
                                  : "text-purple-400 hover:text-purple-200"
                              }`}
                            >
                              {origin}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(["all", "course", "book", "donation"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTransactionTypeTab(type)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border uppercase tracking-widest ${
                            transactionTypeTab === type
                              ? "bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white"
                              : "border-black/10 dark:border-white/10 text-gray-500 hover:border-black/30 dark:hover:border-white/30"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search number or TrxID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead className="text-[10px] text-gray-400 uppercase tracking-widest font-black border-b border-black/5 dark:border-white/5">
                        <tr>
                          <th className="px-4 py-4">User Details</th>
                          <th className="px-4 py-4">Type</th>
                          <th className="px-4 py-4">Amount</th>
                          <th className="px-4 py-4">Purpose</th>
                          <th className="px-4 py-4">TrxID</th>
                          <th className="px-4 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-gray-400 italic">
                              No {transactionStatusTab} transactions found.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((d) => (
                            <tr key={d.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-4">
                                <div className="font-bold text-[var(--text)]">{d.student_name}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{d.polytechnic_name}</div>
                                <div className="text-[9px] text-[var(--primary)]/60 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {new Date(d.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                    d.type === 'course' ? 'bg-blue-500/10 text-blue-500' : 
                                    d.type === 'book' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-pink-500/10 text-pink-500'
                                  }`}>
                                    {d.type === 'course' ? 'Course Fee' : d.type === 'book' ? 'Book Order' : 'Donation'}
                                  </span>
                                  {isManualTx(d) ? (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                      MANUAL
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      AUTO
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-xs font-black text-[var(--text)]">৳{d.amount}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-[10px] font-bold text-gray-500 max-w-[150px] truncate">
                                  {d.type === 'course' || d.type === 'book' || d.type === 'pdf' ? (
                                    <span className="text-blue-500">{d.courses?.title || (d.course_id ? 'Loading...' : 'Deleted Database Item')}</span>
                                  ) : (
                                    <span className="text-gray-400">Direct Donation</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-mono text-[10px] font-bold bg-black/5 dark:bg-white/10 px-2 py-1 rounded w-fit select-all">
                                  {d.transaction_id}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {d.status === "pending" ? (
                                    <>
                                      <button
                                        onClick={() => updateTransactionStatus(d.id, "approved")}
                                        className="p-2 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                                        title="Approve"
                                      >
                                        <Check size={16} strokeWidth={3} />
                                      </button>
                                      <button
                                        onClick={() => updateTransactionStatus(d.id, "rejected")}
                                        className="p-2 bg-red-500/10 hover:bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                                        title="Reject"
                                      >
                                        <X size={16} strokeWidth={3} />
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => deleteTransaction(d.id, d._table)}
                                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
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
                </div>
              </GlassmorphicCard>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="flex flex-col gap-6">
              {/* Payment Settings: bKash, Nagad, Rocket Receive Numbers */}
              <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-red-500" size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text)]">
                      Payment Receive Numbers (bKash / Nagad / Rocket)
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Payment Receive Numbers
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs font-bold text-gray-500">bKash</span>
                      <input
                        type="text"
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs font-bold text-gray-500">Nagad</span>
                      <input
                        type="text"
                        value={nagadNumber}
                        onChange={(e) => setNagadNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs font-bold text-gray-500">Rocket</span>
                      <input
                        type="text"
                        value={rocketNumber}
                        onChange={(e) => setRocketNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[#32CD32]"
                      />
                    </div>

                    <button
                      onClick={handleSaveDonationNumber}
                      disabled={isSavingDonationNum}
                      className="bg-[var(--primary)] hover:bg-[#28a428] text-white font-bold py-2.5 px-4 rounded-lg transition-all text-sm disabled:opacity-50 mt-2"
                    >
                      {isSavingDonationNum ? "Saving..." : "Save Numbers"}
                    </button>
                  </div>
                  {statusMsg && (
                    <p className={`text-xs mt-1 ${statusMsg.type === "success" ? "text-green-500" : "text-red-500"}`}>
                      {statusMsg.text}
                    </p>
                  )}
                </div>
              </GlassmorphicCard>

              {/* Transaction Forwarder App Setup Parameters */}
              <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      📱
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text)]">Transaction App Config Parameters</h3>
                      <p className="text-xs text-gray-500">
                        SMS Forwarder অ্যাপসে বসাতে এই প্যারামিটারগুলো কপি করে ব্যবহার করুন (Anon Key সহ)।
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20">
                    Active
                  </span>
                </div>

                <div className="flex flex-col gap-5 text-xs">
                  {/* Box 1: Webhook URL */}
                  <div className="flex flex-col gap-1.5 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <label className="font-bold text-gray-700 dark:text-gray-300">
                      1. Webhook URL (POST Target URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${import.meta.env.VITE_SUPABASE_URL || 'https://ycflp7quzujcyjbcxjg2ft.supabase.co'}/rest/v1/webhook_logs`}
                        className="flex-1 bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-xs font-mono text-[var(--text)] selection:bg-primary/30"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL || 'https://ycflp7quzujcyjbcxjg2ft.supabase.co'}/rest/v1/webhook_logs`);
                          setCopiedField('url');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-sm"
                      >
                        {copiedField === 'url' ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>

                  {/* Box 2: Headers JSON (Contains full Anon key) */}
                  <div className="flex flex-col gap-2 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-gray-700 dark:text-gray-300">
                        2. Headers JSON (Paste in SMS App Headers Field)
                      </label>
                      <button
                        onClick={() => {
                          const headersJson = JSON.stringify({
                            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                          }, null, 2);
                          navigator.clipboard.writeText(headersJson);
                          setCopiedField('headers');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-1.5 rounded-xl transition-all text-xs shrink-0 shadow-sm"
                      >
                        {copiedField === 'headers' ? 'Copied Full Headers!' : 'Copy Headers JSON'}
                      </button>
                    </div>

                    <pre className="p-3 bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl text-[11px] font-mono text-primary whitespace-pre-wrap overflow-x-auto select-all leading-relaxed">
                      {JSON.stringify({
                        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                      }, null, 2)}
                    </pre>
                  </div>

                  {/* Box 3: Body Payload */}
                  <div className="flex flex-col gap-1.5 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <label className="font-bold text-gray-700 dark:text-gray-300">
                      3. JSON Payload Body (Paste in SMS App Body Field)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`{"payload": "%from%: %text%", "method": "SMS_FORWARDER"}`}
                        className="flex-1 bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-xs font-mono text-[var(--text)]"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`{"payload": "%from%: %text%", "method": "SMS_FORWARDER"}`);
                          setCopiedField('body');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-sm"
                      >
                        {copiedField === 'body' ? 'Copied!' : 'Copy Body'}
                      </button>
                    </div>
                  </div>

                  {/* Box 4: Security Explanation against fake student SMS */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                      <ShieldCheck size={18} />
                      <span>🛡️ ভুয়া মেসেজ (Fake SMS) প্রতিরোধ নিরাপত্তা:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-gray-600 dark:text-gray-300 space-y-1 pl-1">
                      <li>
                        <strong>অফিশিয়াল কিওয়ার্ড ভ্যালিডেশন:</strong> ওয়েবসাইট শুধু সেইসব এসএমএসই গ্রান্ট করবে যেগুলোতে bKash, NAGAD, Rocket, 16216, TrxID, Balance, Ref ইত্যাদি আসল আর্থিক কিওয়ার্ড পাওয়া যাবে।
                      </li>
                      <li>
                        <strong>অ্যাপসে সেন্ডার ফিল্টারিং (Sender Filter):</strong> অ্যাপসের <em>Sender (number or text)</em> ঘরে <code>*</code> এর পরিবর্তে <code>bKash,NAGAD,16216,Rocket</code> বসিয়ে রাখলে কোন সাধারণ স্টুডেন্টের মোবাইল নম্বর থেকে পাঠানো মেসেজ অ্যাপস ফরোয়ার্ডই করবে না।
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassmorphicCard>

              {/* Live SMS Received in Supabase Card */}
              <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      </div>
                      <h2 className="text-lg font-bold text-[var(--text)]">Supabase Live SMS Logs ({webhookLogs.length})</h2>
                    </div>
                    <button 
                      onClick={() => {
                        fetchWebhookLogs();
                        handleAutoVerify();
                      }} 
                      className="text-xs font-bold bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                    >
                      {isRefreshingLogs ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <span>Refresh SMS Logs</span>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    যখনই আপনার ফোন থেকে SMS Forwarder অ্যাপের মাধ্যমে SMS পাঠানো হবে, তা নিচে রিয়েল-টাইমে অটোমেটিক জমা হবে এবং ব্যাকগ্রাউন্ডে ভেরিফাই হতে থাকবে।
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {webhookLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Supabase-এ এখনো কোন SMS লগ জমা হয়নি। ফোন থেকে Test SMS ফরওয়ার্ড করে Refresh চাপুন।
                    </div>
                  ) : (
                    webhookLogs.slice(0, 30).map((log, idx) => {
                       let payloadText = '';
                       try {
                         payloadText = typeof log.body === 'string' ? JSON.stringify(JSON.parse(log.body), null, 2) : JSON.stringify(log.body, null, 2);
                       } catch(e) {
                         payloadText = typeof log.body === 'string' ? log.body : JSON.stringify(log.body);
                       }
                       
                       return (
                         <div key={idx} className="p-3 bg-white dark:bg-[#1a1b1e] rounded-xl border border-black/10 dark:border-white/10 flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                             <span className="text-[10px] font-bold bg-green-500/10 text-green-600 px-2 py-0.5 rounded uppercase">{log.method || 'POST'}</span>
                           </div>
                           <pre className="text-[11px] bg-black/5 dark:bg-white/5 p-2 rounded-lg overflow-x-auto text-[var(--text)] whitespace-pre-wrap font-mono">
                             {payloadText}
                           </pre>
                         </div>
                       );
                    })
                  )}
                </div>
              </GlassmorphicCard>
            </div>
          )}

          {activeTab === "pdf" && <AdminPdfs />}

          {activeTab === "youtube" && (
            <GlassmorphicCard className="max-w-7xl p-6 sm:p-8">
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
                  <div className="bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-center">
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
          
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <GlassmorphicCard className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="text-[var(--primary)]" />
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">Send a notification to all users using the built-in system. Make sure you've ran the Supabase script for notifications table.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white"
                      placeholder="e.g. New Feature Update!"
                      id="notify-title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Message Body
                    </label>
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white resize-none"
                      placeholder="Write 1/2 lines of message to push to all users..."
                      id="notify-body"
                    />
                  </div>
                  
                  <button
                    onClick={async () => {
                      const titleNode = document.getElementById('notify-title') as HTMLInputElement;
                      const bodyNode = document.getElementById('notify-body') as HTMLTextAreaElement;
                      if (!titleNode.value || !bodyNode.value) {
                         alert("Please enter title and body.");
                         return;
                      }
                      
                      try {
                        const { data: users, error: userError } = await supabase.from('profiles').select('id');
                        if (userError) throw userError;
                        
                        if (users && users.length > 0) {
                           const notifications = users.map(u => ({
                              user_id: u.id,
                              title: titleNode.value,
                              body: bodyNode.value,
                              type: 'admin'
                           }));
                           
                           const { error } = await supabase.from('notifications').insert(notifications);
                           if (error) throw error;
                           
                           alert(`Notification sent to ${users.length} users!`);
                           titleNode.value = '';
                           bodyNode.value = '';
                        } else {
                           alert("No users found.");
                        }
                      } catch (err: any) {
                         alert(err.message || 'Make sure the notifications table exists! Check the UI setup instructions.');
                      }
                    }}
                    className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Bell size={18} />
                    Push to All Users
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete ALL notifications for ALL users? This cannot be undone.")) return;
                      try {
                        // Delete all notifications
                        const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        if (error) throw error;
                        alert("All notifications have been deleted!");
                      } catch (err: any) {
                        alert(err.message || "Failed to delete notifications.");
                      }
                    }}
                    className="w-full py-3 mt-4 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Clear All Notifications
                  </button>
                </div>
              </GlassmorphicCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
