import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, FolderPlus, MessageSquare, 
  Users, ThumbsUp, Clock, 
  TrendingUp, X, Link2Off, Printer, Info, Merge, Share2, Lock, Unlock
} from 'lucide-react';

// Firebase Imports
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';

const defaultAppId = import.meta.env.VITE_APP_ID || 'resident-idea-board-free';
const adminPin = import.meta.env.VITE_ADMIN_PIN;

const App = () => {
  // --- New State for Multiple Boards ---
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('b') || defaultAppId;
  });
  const [newBoardName, setNewBoardName] = useState("");
  const [newMaxVotes, setNewMaxVotes] = useState(10);
  const [editingMaxVotes, setEditingMaxVotes] = useState(null);
  
  // --- Existing State ---
  const [cards, setCards] = useState([]);
  const [groups, setGroups] = useState([
    { id: "uncategorized", name: "ยังไม่ได้จัดกลุ่ม", color: "bg-gray-100" },
    { id: "maintenance", name: "งานซ่อมบำรุง", color: "bg-blue-100" },
    { id: "activities", name: "กิจกรรม/นันทนาการ", color: "bg-green-100" },
    { id: "security", name: "ความปลอดภัย", color: "bg-red-100" }
  ]);
  
  const [user, setUser] = useState(null);
  const [newCardText, setNewCardText] = useState("");
  
  // --- User Identity State ---
  const [savedUserName, setSavedUserName] = useState(() => {
    return localStorage.getItem('resident_voice_user_name') || "";
  });
  const [newAuthor, setNewAuthor] = useState(savedUserName);
  const [newGroupName, setNewGroupName] = useState("");
  const [view, setView] = useState("board");
  const [sortBy, setSortBy] = useState("votes"); // 'votes' or 'newest'
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Admin State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  
  // Drag and Drop States
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState(null);
  const [dropTargetCardId, setDropTargetCardId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [votingCards, setVotingCards] = useState(new Set());

  const selectedCard = useMemo(() => 
    cards.find(c => c.id === selectedCardId), 
    [cards, selectedCardId]
  );

  // 1. Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Authentication failed:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Update URL seamlessly when board changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('b', currentBoardId);
    window.history.replaceState({}, '', url);
  }, [currentBoardId]);

  const copyShareLink = () => {
    const url = new URL(window.location);
    url.searchParams.set('b', currentBoardId);
    navigator.clipboard.writeText(url.toString());
    alert('คัดลอกลิงก์สำหรับหน้านี้เรียบร้อยแล้ว! สามารถนำไปส่งให้ลูกบ้านได้เลยครับ');
  };

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowPinModal(true);
      setPinInput("");
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setIsAdmin(true);
      setShowPinModal(false);
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
      setPinInput("");
    }
  };

  // 1.5 Fetch Boards List
  useEffect(() => {
    if (!user) return;
    const boardsCol = collection(db, 'boards');
    const unsubBoards = onSnapshot(boardsCol, (snapshot) => {
      const loadedBoards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Auto-create default board if completely empty
      if (loadedBoards.length === 0) {
        setDoc(doc(boardsCol, defaultAppId), { 
          id: defaultAppId, 
          name: "Topic", 
          maxVotes: 10,
          createdAt: Date.now() 
        });
      } else {
        // Sort by newest first
        setBoards(loadedBoards.sort((a, b) => b.createdAt - a.createdAt));
      }
    });
    return () => unsubBoards();
  }, [user]);

  // 2. Data Sync for Current Board
  useEffect(() => {
    if (!user || !currentBoardId) return;
    
    setIsLoading(true); // reset loading state when switching boards

    const cardsCol = collection(db, 'artifacts', currentBoardId, 'public', 'data', 'cards');
    const groupsCol = collection(db, 'artifacts', currentBoardId, 'public', 'data', 'groups');

    const unsubCards = onSnapshot(cardsCol, async (snapshot) => {
      // We no longer auto-populate sample data to prevent mess across different boards
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    const unsubGroups = onSnapshot(groupsCol, (snapshot) => {
      if (snapshot.empty) {
        // Auto-create initial groups if new board
        const initialGroups = [
          { id: "uncategorized", name: "ยังไม่ได้จัดกลุ่ม", color: "bg-gray-100" },
          { id: "maintenance", name: "งานซ่อมบำรุง", color: "bg-blue-100" },
          { id: "activities", name: "กิจกรรม/นันทนาการ", color: "bg-green-100" },
          { id: "security", name: "ความปลอดภัย", color: "bg-red-100" }
        ];
        initialGroups.forEach(g => setDoc(doc(groupsCol, g.id), g));
      } else {
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    return () => { unsubCards(); unsubGroups(); };
  }, [user, currentBoardId]);

  // --- DRAG AND DROP ---
  const handleDragStart = (e, cardId) => {
    if (!isAdmin) return;
    setDraggedCardId(cardId);
    e.dataTransfer.setData("cardId", cardId);
  };

  const handleDragOver = (e, targetId, type) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    if (type === 'group') {
      setDropTargetGroupId(targetId);
      setDropTargetCardId(null);
    } else if (type === 'card' && targetId !== draggedCardId) {
      setDropTargetCardId(targetId);
      setDropTargetGroupId(null);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDropTargetGroupId(null);
    setDropTargetCardId(null);
  };

  const handleDrop = async (e, targetId, type) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData("cardId");
    setDropTargetGroupId(null); setDropTargetCardId(null); setDraggedCardId(null);
    
    if (!sourceId || sourceId === targetId) return;

    if (type === 'group') {
      await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', sourceId), { 
        groupId: targetId, parentId: null 
      });
    } else if (type === 'card') {
      const targetCard = cards.find(c => c.id === targetId);
      if (targetCard) {
        await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', sourceId), { 
          parentId: targetId, groupId: targetCard.groupId
        });
      }
    }
  };

  const addCard = async (e) => {
    e.preventDefault();
    if (!newCardText.trim() || !user) return;
    
    // Check if board is closed
    const currentBoard = boards.find(b => b.id === currentBoardId);
    if (currentBoard?.status === 'closed') {
      alert("ไม่สามารถเพิ่มข้อเสนอได้: หัวข้อนี้ถูกปิดรับความคิดเห็นแล้ว");
      return;
    }
    
    try {
      const authorName = newAuthor.trim() || "ไม่ระบุ";
      
      // Save name for future use (voting/posting)
      if (authorName !== "ไม่ระบุ") {
        let nameToSave = authorName;
        if (nameToSave.length > 15) nameToSave = nameToSave.substring(0, 15);
        localStorage.setItem('resident_voice_user_name', nameToSave);
        setSavedUserName(nameToSave);
      }

      await addDoc(collection(db, 'artifacts', currentBoardId, 'public', 'data', 'cards'), {
        text: newCardText, author: authorName, groupId: "uncategorized",
        votes: 1, baseVotes: 1, likedBy: [user.uid], likedNames: [{ uid: user.uid, name: authorName }], createdAt: Date.now(), parentId: null,
        creatorId: user.uid // Save who created it for deletion rights
      });
      setNewCardText(""); 
      // Keep newAuthor as is to remember it for next time
      setView('board');
    } catch (err) {
      console.error("Error adding card:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้: " + err.message);
    }
  };

  const toggleLike = async (card) => {
    if (!user || votingCards.has(card.id)) return;
    
    // Get current board and check if it's closed
    const currentBoard = boards.find(b => b.id === currentBoardId);
    if (currentBoard?.status === 'closed') {
      alert("ไม่สามารถโหวตได้: หัวข้อนี้ถูกปิดการโหวตแล้ว");
      return;
    }

    setVotingCards(prev => new Set(prev).add(card.id));

    try {
        const likedBy = card.likedBy || [];
        const likedNames = card.likedNames || [];
        const hasLiked = likedBy.includes(user.uid);
        const currentVotes = card.votes || 0;
        const limit = currentBoard?.maxVotes || 10;
        
        let newLikedBy = [...likedBy];
        let newLikedNames = [...likedNames];

        // Check limit: allow unliking, but prevent liking if votes are limit or more
        if (!hasLiked && currentVotes >= limit) {
          alert(`ไม่สามารถโหวตได้: ข้อเสนอนี้ได้รับโหวตเต็มจำนวนแล้ว (สูงสุด ${limit} โหวต)`);
          return;
        }

        if (hasLiked) {
          // Unlike
          newLikedBy = likedBy.filter(id => id !== user.uid);
          newLikedNames = likedNames.filter(item => item.uid !== user.uid);
        } else {
          // Like
          let voterName = savedUserName || "ไม่ระบุ";
          
          newLikedBy.push(user.uid);
          newLikedNames.push({ uid: user.uid, name: voterName });
        }
        
        const newVotes = hasLiked ? currentVotes - 1 : currentVotes + 1;
        
        await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', card.id), {
          likedBy: newLikedBy, 
          likedNames: newLikedNames,
          votes: newVotes
        });
    } finally {
        setVotingCards(prev => {
            const next = new Set(prev);
            next.delete(card.id);
            return next;
        });
    }
  };

  const unmergeCard = async (cardId) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', cardId), { 
      parentId: null 
    });
  };

  const deleteCard = async (id) => {
    if (!isAdmin) return;
    const children = cards.filter(c => c.parentId === id);
    for(const child of children) await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', child.id), { parentId: null });
    await deleteDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', id));
  };

  const addGroup = async () => {
    if (!isAdmin || !newGroupName.trim()) return;
    try {
      const gid = Date.now().toString();
      await setDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'groups', gid), { id: gid, name: newGroupName, color: "bg-yellow-100" });
      setNewGroupName("");
    } catch (err) {
      console.error("Error adding group:", err);
      alert("ไม่สามารถสร้างกลุ่มได้: " + err.message);
    }
  };

  const deleteGroup = async (groupId) => {
    if (!isAdmin || groupId === "uncategorized") return; // Prevent deleting the default group
    
    // Auto move all cards in the deleted group to "uncategorized"
    const groupCards = cards.filter(c => c.groupId === groupId);
    for (const card of groupCards) {
      await updateDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'cards', card.id), { 
        groupId: "uncategorized" 
      });
    }
    
    // Delete the group itself
    await deleteDoc(doc(db, 'artifacts', currentBoardId, 'public', 'data', 'groups', groupId));
  };
  
  // Manage Boards Methods
  const addBoard = async () => {
    if (!isAdmin || !newBoardName.trim()) return;
    try {
      const bid = `board_${Date.now()}`;
      await setDoc(doc(db, 'boards', bid), { id: bid, name: newBoardName, maxVotes: newMaxVotes, status: 'open', createdAt: Date.now() });
      setNewBoardName("");
      setNewMaxVotes(10);
      setCurrentBoardId(bid);
    } catch (err) {
      console.error("Error adding board:", err);
      alert("ไม่สามารถสร้างหัวข้อได้: " + err.message);
    }
  };

  const updateBoardMaxVotes = async (boardId, newLimit) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'boards', boardId), { maxVotes: newLimit });
      setEditingMaxVotes(null);
    } catch (err) {
      console.error("Error updating board limit:", err);
      alert("ไม่สามารถอัพเดทจำกัดโหวตได้");
    }
  };

  const toggleBoardStatus = async (boardId, currentStatus) => {
    if (!isAdmin) return;
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      await updateDoc(doc(db, 'boards', boardId), { status: newStatus });
    } catch (err) {
      console.error("Error updating board status:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const displayCards = useMemo(() => {
    let rootCards = cards.filter(c => !c.parentId);
    const enriched = rootCards.map(parent => {
      const children = cards.filter(c => c.parentId === parent.id);
      const totalVotes = (parent.votes || 0) + children.reduce((sum, child) => sum + (child.votes || 0), 0);
      const totalAuthors = [parent.author, ...children.map(c => c.author)].length;
      return { ...parent, totalVotes, childrenCount: children.length, totalAuthors };
    });

    if (sortBy === 'votes') {
      enriched.sort((a, b) => b.totalVotes - a.totalVotes);
    } else {
      enriched.sort((a, b) => b.createdAt - a.createdAt);
    }
    return enriched;
  }, [cards, sortBy]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 print:bg-white print:text-black">
      {/* Navbar (Hidden on Print) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-xl shadow-sm">
              <MessageSquare className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Resident <span className="text-slate-500">Voice</span></h1>
              <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-wide">กระดานรับฟังความคิดเห็นลูกบ้าน</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleAdmin}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${isAdmin ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
              {isAdmin ? 'สิทธิ์ผู้ดูแลระบบ: เปิดใช้งาน' : 'เข้าสู่ระบบผู้ดูแล'}
            </button>
            <button 
              onClick={() => window.print()}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" /> พิมพ์รายงาน
            </button>
            <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setView('submit')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'submit' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>ส่งข้อเสนอ</button>
              <button onClick={() => setView('board')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'board' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>ดูกระดาน</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 print:p-0">
        
        {/* Print Only Header */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4 mt-4">
          <h1 className="text-3xl font-black uppercase text-black tracking-tight">สรุปความคิดเห็นลูกบ้าน</h1>
          <h2 className="text-xl font-bold text-gray-800 mt-2">หัวข้อ: {boards.find(b=>b.id === currentBoardId)?.name}</h2>
          <p className="text-gray-600 font-bold mt-1">พิมพ์วันที่: {new Date().toLocaleDateString('th-TH')}</p>
        </div>

        {view === 'submit' && (
          <div className="max-w-xl mx-auto mt-8 bg-white rounded-3xl shadow-xl p-8 border border-slate-200 print:hidden relative overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-8 font-sans">เขียนเสนอข้อมูล</h2>
            <form onSubmit={addCard} className="space-y-6 relative z-10">
              
              {/* Board Selection in Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
                <label className="text-sm font-bold text-slate-700 font-sans flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" /> เลือกหัวข้อที่ต้องการเสนอข้อมูล:
                </label>
                <div className="flex gap-3">
                  <select 
                    className="flex-1 bg-white border border-slate-300 text-slate-900 text-base rounded-xl py-3 px-4 font-bold outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer shadow-sm"
                    value={currentBoardId}
                    onChange={(e) => setCurrentBoardId(e.target.value)}
                  >
                    {boards.map(b => (
                      <option key={b.id} value={b.id} className="bg-white text-slate-900">{b.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={copyShareLink} className="px-5 bg-slate-900 text-white border border-slate-800 rounded-xl shadow-sm hover:bg-slate-800 flex items-center justify-center transition-all group" title="คัดลอกลิงก์">
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2 font-sans">ข้อความที่ต้องการเสนอ</label>
                <textarea value={newCardText} onChange={(e) => setNewCardText(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 outline-none h-32 resize-none text-base font-sans shadow-sm placeholder:text-slate-400" placeholder="พิมพ์ข้อความที่ต้องการเสนอที่นี่..." required />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2 font-sans">ชื่อ หรือ บ้านเลขที่ <span className="text-red-500">*</span></label>
                <input type="text" value={newAuthor} maxLength={15} onChange={(e) => setNewAuthor(e.target.value)} placeholder="เช่น บ้าน 12/3 (บังคับกรอก)" required className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 font-sans shadow-sm placeholder:text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-1.5 font-sans">* ใส่ได้สูงสุด 15 ตัวอักษร</p>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-sans mt-8 text-lg border border-slate-800">
                <Plus className="w-5 h-5" /> สร้างการ์ด
              </button>
            </form>
          </div>
        )}

        {view === 'board' && (
          <div className="space-y-6">
            {/* Board Selector for Board View */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-3 text-slate-900 font-black uppercase text-sm pl-2">
                <FolderPlus className="w-5 h-5 text-slate-800" />
                หัวข้อปัจจุบัน:
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                <select 
                  className="flex-1 md:flex-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl py-2.5 px-4 font-bold outline-none focus:border-slate-500 transition-colors shadow-sm min-w-[200px]"
                  value={currentBoardId}
                  onChange={(e) => setCurrentBoardId(e.target.value)}
                >
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const confirmMsg = boards.find(b => b.id === currentBoardId)?.status === 'closed' 
                          ? "แน่ใจหรือไม่ที่จะ เปิดรับข้อเสนอและการโหวต สำหรับหัวข้อนี้อีกครั้ง?"
                          : "แน่ใจหรือไม่ที่จะ ปิดรับข้อเสนอและปิดโหวต สำหรับหัวข้อนี้?\n(ผู้ใช้จะยังอ่านได้แต่ไม่สามารถโหวตหรือพิมพ์เสนอได้อีก)";
                        if (window.confirm(confirmMsg)) {
                          toggleBoardStatus(currentBoardId, boards.find(b => b.id === currentBoardId)?.status);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                        boards.find(b => b.id === currentBoardId)?.status === 'closed'
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {boards.find(b => b.id === currentBoardId)?.status === 'closed' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      สถานะ: {boards.find(b => b.id === currentBoardId)?.status === 'closed' ? 'ปิดรับข้อมูลแล้ว' : 'กำลังเปิดรับข้อมูล'}
                    </button>
                    
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">จำกัดโหวต:</span>
                    {editingMaxVotes === currentBoardId ? (
                      <input 
                        type="number" 
                        min="1" 
                        autoFocus
                        defaultValue={boards.find(b => b.id === currentBoardId)?.maxVotes || 10}
                        onBlur={(e) => updateBoardMaxVotes(currentBoardId, Number(e.target.value))}
                        onKeyPress={(e) => e.key === 'Enter' && updateBoardMaxVotes(currentBoardId, Number(e.target.value))}
                        className="w-12 py-1 px-1 text-center border border-blue-400 rounded text-xs font-bold outline-none"
                      />
                    ) : (
                      <button 
                        onClick={() => setEditingMaxVotes(currentBoardId)}
                        className="text-xs font-black text-slate-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-white transition-colors flex items-center gap-1"
                        title="คลิกเพื่อแก้ไข"
                      >
                        {boards.find(b => b.id === currentBoardId)?.maxVotes || 10}
                      </button>
                    )}
                    </div>
                  </div>
                )}

                <button onClick={copyShareLink} className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-md hover:bg-slate-800 transition" title="คัดลอกลิงก์">
                  <Share2 className="w-4 h-4" /> แชร์ลิงก์
                </button>
              </div>
            </div>

            {/* Sorting & Category Options */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <button onClick={() => setSortBy('newest')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${sortBy === 'newest' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Clock className="w-3.5 h-3.5" /> ล่าสุด
                  </button>
                  <button onClick={() => setSortBy('votes')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${sortBy === 'votes' ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                    <TrendingUp className="w-3.5 h-3.5" /> ยอดนิยม
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <>
                    <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-300">
                      <div className="relative">
                          <input type="text" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="เริ่มหัวข้อใหม่..." className="pl-3 pr-8 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs outline-none w-32 font-bold placeholder:text-slate-400 focus:border-slate-500" onKeyPress={(e) => e.key === 'Enter' && addBoard()} />
                      </div>
                      <div className="relative flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-600">จำกัดโหวต:</span>
                          <input type="number" min="1" value={newMaxVotes} onChange={(e) => setNewMaxVotes(Number(e.target.value))} className="w-14 pl-2 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs outline-none font-bold focus:border-slate-500 text-center" />
                          <button onClick={addBoard} className="ml-1 bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <div className="w-[1px] h-8 bg-slate-200 hidden sm:block"></div>
                    <div className="relative bg-slate-50 p-1.5 rounded-xl border border-slate-300 flex">
                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="เพิ่มกลุ่มใหม่..." className="pl-3 pr-8 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs outline-none w-32 font-bold placeholder:text-slate-400 focus:border-slate-500 transition-colors" onKeyPress={(e) => e.key === 'Enter' && addGroup()} />
                        <button onClick={addGroup} className="ml-2 bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><FolderPlus className="w-4 h-4" /></button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Kanban Board (Hidden on Print) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start print:hidden">
              {groups.map(group => {
                const groupCards = displayCards.filter(c => c.groupId === group.id);

                return (
                  <div
                    key={group.id}
                    onDragOver={(e) => handleDragOver(e, group.id, 'group')}
                    onDrop={(e) => handleDrop(e, group.id, 'group')}
                    onDragLeave={handleDragLeave}
                    className={`w-full rounded-3xl border p-4 min-h-[600px] flex flex-col transition-all bg-white shadow-sm ${
                      dropTargetGroupId === group.id ? 'border-slate-800 scale-[1.02] shadow-lg' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-5 px-2 border-b border-slate-100 pb-3">
                      <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                          {group.name}
                          <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-xs">{groupCards.length}</span>
                      </h3>
                      {group.id !== "uncategorized" && isAdmin && (
                        <button 
                          onClick={() => { if(window.confirm(`ต้องการลบกลุ่ม "${group.name}" ใช่หรือไม่?\nข้อมูลในการ์ดทั้งหมดจะถูกย้ายไปที่ "ยังไม่ได้จัดกลุ่ม"`)) deleteGroup(group.id) }} 
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="ลบกลุ่มนี้"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 flex-1">
                      {groupCards.map(card => {
                        const currentBoardObj = boards.find(b => b.id === currentBoardId);
                        const maxLimit = currentBoardObj?.maxVotes || 10;
                        return (
                        <div 
                          key={card.id} 
                          draggable={isAdmin}
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          onDragOver={(e) => handleDragOver(e, card.id, 'card')}
                          onDrop={(e) => handleDrop(e, card.id, 'card')}
                          className={`bg-white p-5 rounded-2xl border-2 transition-all ${isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group relative flex flex-col min-h-[220px] hover:border-slate-400 ${
                            dropTargetCardId === card.id ? 'border-slate-800 shadow-lg scale-105 z-10' : 'border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4 mt-1">
                            {card.totalVotes >= maxLimit && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg w-fit">
                                  <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-[10px] font-black uppercase whitespace-nowrap">คนโหวตเต็มแล้ว</span>
                              </div>
                            )}
                            <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 flex-shrink-0 rounded-lg text-xs font-black border ${card.totalVotes >= maxLimit ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : (sortBy === 'votes' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200')}`}>
                              <ThumbsUp className="w-3 h-3" /> {Math.min(card.totalVotes, maxLimit)}/{maxLimit}
                            </div>
                          </div>

                          <p className="text-slate-800 font-bold leading-relaxed mb-4 text-sm font-sans flex-grow">{card.text}</p>
                          
                          {card.likedNames && card.likedNames.length > 0 && (
                            <div className="mb-3 text-[10px] text-slate-500 font-sans line-clamp-2" title={card.likedNames.map(n => n.name).join(', ')}>
                              <span className="font-bold">ผู้โหวต:</span> {card.likedNames.map(n => n.name).join(', ')}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 font-sans truncate pr-2">
                                  <Users className="w-3 h-3 text-slate-400 flex-shrink-0" /> <span className="truncate">{card.author}</span> {card.childrenCount > 0 && <span className="text-slate-700 bg-slate-100 px-1.5 rounded border border-slate-200 flex-shrink-0">+ {card.childrenCount} รวมกัน</span>}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button onClick={() => toggleLike(card)} title={card.likedNames?.map(n => n.name).join(', ')} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-lg border border-slate-100 relative group">
                                    <ThumbsUp className={`w-3.5 h-3.5 ${card.likedBy?.includes(user?.uid) ? 'fill-current text-emerald-500' : ''}`} />
                                  </button>
                                  {card.childrenCount > 0 && (
                                    <button onClick={() => setSelectedCardId(card.id)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg border border-slate-100">
                                      <Info className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button onClick={() => {if(window.confirm('ต้องการลบข้อเสนอนี้ใช่หรือไม่?')) deleteCard(card.id)}} className="p-2 text-slate-300 hover:text-red-500">
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Print Table View */}
            <div className="hidden print:block w-full">
              <table className="w-full text-left border-collapse border border-slate-400 table-fixed">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 px-3 py-2 text-sm font-bold w-12 text-center text-slate-800">ลำดับ</th>
                    <th className="border border-slate-400 px-3 py-2 text-sm font-bold text-slate-800">เรื่องที่เสนอ</th>
                    <th className="border border-slate-400 px-3 py-2 text-sm font-bold w-[15%] text-slate-800">ผู้เสนอ</th>
                    <th className="border border-slate-400 px-3 py-2 text-sm font-bold w-16 text-center text-slate-800">โหวต</th>
                    <th className="border border-slate-400 px-3 py-2 text-sm font-bold w-[25%] text-slate-800">ผู้โหวต</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => {
                    const groupCards = displayCards.filter(c => c.groupId === group.id);
                    if (groupCards.length === 0) return null;
                    
                    return (
                      <React.Fragment key={`print-group-${group.id}`}>
                        <tr className="bg-slate-200 break-after-avoid">
                          <td colSpan="5" className="border border-slate-400 px-3 py-2 text-sm font-black text-slate-900 uppercase">
                            หมวดหมู่: {group.name}
                          </td>
                        </tr>
                        {groupCards.map((card, index) => {
                          const children = cards.filter(c => c.parentId === card.id);
                          return (
                            <React.Fragment key={`print-card-wrapper-${card.id}`}>
                              <tr key={`print-card-${card.id}`} className="break-inside-avoid bg-white">
                                <td className="border border-slate-400 px-3 py-2 text-center text-sm font-medium text-slate-700">{index + 1}</td>
                                <td className="border border-slate-400 px-3 py-2 text-sm font-bold text-slate-800 break-words">
                                  {card.text}
                                </td>
                                <td className="border border-slate-400 px-3 py-2 text-xs font-black text-slate-500 break-words">{card.author}</td>
                                <td className="border border-slate-400 px-3 py-2 text-center text-sm font-black text-slate-900">{card.votes || 0}</td>
                                <td className="border border-slate-400 px-3 py-2 text-xs text-slate-700 break-words">
                                  {card.likedNames?.map(n => n.name).join(', ') || '-'}
                                </td>
                              </tr>
                              {children.map((child, childIdx) => (
                                <tr key={`print-child-${child.id}`} className="break-inside-avoid bg-slate-50">
                                  <td className="border border-slate-400 px-3 py-2 text-center text-xs font-medium text-slate-400">↳</td>
                                  <td className="border border-slate-400 px-3 py-2 text-sm text-slate-600 break-words pl-6">
                                    <span className="font-bold text-slate-400 mr-2">-</span>{child.text}
                                  </td>
                                  <td className="border border-slate-400 px-3 py-2 text-xs font-black text-slate-500 break-words">{child.author}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-center text-sm font-bold text-slate-600">{child.votes || 0}</td>
                                  <td className="border border-slate-400 px-3 py-2 text-xs text-slate-600 break-words">
                                    {child.likedNames?.map(n => n.name).join(', ') || '-'}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {displayCards.length === 0 && (
                    <tr>
                      <td colSpan="5" className="border border-slate-400 p-4 text-center text-slate-500 font-bold">ไม่มีข้อมูลในหัวข้อนี้</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Details Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 text-slate-800">
                    <h3 className="font-black text-sm flex items-center gap-2 text-slate-900"><Merge className="w-4 h-4" /> หัวข้อที่ถูกรวมไว้ด้วยกัน</h3>
                    <button onClick={() => setSelectedCardId(null)} className="text-slate-500 hover:text-slate-800 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-slate-900 font-bold font-sans">{selectedCard.text}</p>
                        <p className="text-xs text-slate-500 mt-3 font-bold font-sans">ต้นฉบับโดย: {selectedCard.author}</p>
                    </div>
                    {cards.filter(c => c.parentId === selectedCard.id).map(sub => (
                        <div key={sub.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-700 font-bold font-sans">{sub.text}</p>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase">บ้าน: {sub.author}</span>
                                {isAdmin && (
                                  <button onClick={() => unmergeCard(sub.id)} className="text-red-500 text-[10px] font-black hover:text-red-600 flex items-center gap-1 transition-colors bg-red-50 px-2 py-1 rounded">
                                    <Link2Off className="w-3 h-3" /> แยกการ์ดนี้ออก
                                  </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-slate-600 font-bold text-[10px] uppercase">รวมทั้งหมด: {selectedCard.totalAuthors} รายการ</div>
                    <button onClick={() => setSelectedCardId(null)} className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-xl font-bold text-xs transition-colors">ปิดหน้าต่าง</button>
                </div>
            </div>
        </div>
      )}

      {/* Admin PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
                    <h3 className="font-black text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> สิทธิ์ผู้ดูแลระบบ</h3>
                    <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handlePinSubmit} className="p-7">
                    <p className="text-sm font-bold text-slate-600 mb-6 text-center font-sans">กรุณาใส่รหัสผ่านเพื่อแก้ไขข้อมูล</p>
                    <input 
                      type="password" 
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full text-center tracking-[1em] font-black text-2xl py-4 rounded-2xl border-2 border-slate-300 focus:border-slate-900 transition-colors bg-slate-50 text-slate-900 shadow-sm mb-6 outline-none"
                      autoFocus
                      required
                    />
                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-md transition active:scale-95 text-sm font-sans border border-slate-800">
                      ยืนยันรหัสผ่าน
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
