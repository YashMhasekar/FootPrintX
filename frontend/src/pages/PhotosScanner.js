import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Camera, ArrowLeft, RefreshCw, AlertCircle, Search,
  Loader2, Image, Trash2, ExternalLink, CheckSquare,
  Square, Filter, SortDesc, HardDrive, Copy, Clock,
  ZoomIn, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import apiService from '../services/api';

// ── constants ──────────────────────────────────────────────────────────────
const IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/gif', 'image/bmp', 'image/tiff',
  'image/svg+xml', 'image/x-icon',
]);

const MIME_LABELS = {
  'image/jpeg': 'JPEG', 'image/jpg': 'JPEG', 'image/png': 'PNG',
  'image/webp': 'WebP', 'image/heic': 'HEIC', 'image/gif': 'GIF',
  'image/bmp': 'BMP',  'image/tiff': 'TIFF', 'image/svg+xml': 'SVG',
  'image/x-icon': 'ICO',
};

const TYPE_COLORS = {
  JPEG:'#3B82F6', PNG:'#10B981', WebP:'#8B5CF6', GIF:'#F59E0B',
  HEIC:'#EF4444', BMP:'#6B7280', TIFF:'#F97316', SVG:'#06B6D4', ICO:'#A78BFA', Other:'#94A3B8',
};

const LARGE_THRESHOLD = 5 * 1024 * 1024;  // 5 MB
const OLD_THRESHOLD_DAYS = 365;
const NA = 'Not analyzed yet';

// ── helpers ────────────────────────────────────────────────────────────────
function fmtBytes(b = 0) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
}
function isOld(iso) {
  if (!iso) return false;
  return (Date.now() - new Date(iso).getTime()) > OLD_THRESHOLD_DAYS * 86400000;
}
// Naive duplicate detection: same size + same name stem
function markDuplicates(images) {
  const seen = {};
  images.forEach(img => {
    const stem = (img.name || '').replace(/\.[^.]+$/, '').toLowerCase().trim();
    const key  = `${stem}_${img.sizeBytes || 0}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(img.id);
  });
  const dupIds = new Set();
  Object.values(seen).forEach(ids => { if (ids.length > 1) ids.forEach(id => dupIds.add(id)); });
  return dupIds;
}
function thumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w120`;
}

// ── sub-components ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="animate-pulse bg-white rounded-2xl h-28 border border-gray-100 shadow-sm" />;
}
function SkeletonImg() {
  return (
    <div className="animate-pulse bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="bg-gray-200 h-32 w-full" />
      <div className="p-3 space-y-1.5">
        <div className="h-2.5 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <motion.div whileHover={{ y:-3 }} className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
      <Icon size={22} className="opacity-80 mb-3" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold opacity-80 mt-0.5">{label}</p>
    </motion.div>
  );
}

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{payload[0].name}</span>
      <span className="ml-2 text-gray-500">{payload[0].value} images</span>
    </div>
  );
}
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-800">{label}</span>
      <span className="ml-2 text-gray-500">{payload[0].value} images</span>
    </div>
  );
}

// Lightbox
function Lightbox({ image, images, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
        className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-gray-900">
          <img src={thumbnailUrl(image.id)} alt={image.name}
            className="w-full max-h-80 object-contain" onError={e => { e.currentTarget.src=''; }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <X size={14} />
          </button>
          <button onClick={onPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={onNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="p-4">
          <p className="font-semibold text-gray-900 truncate">{image.name}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <span>{MIME_LABELS[image.mimeType] || 'Image'}</span>
            <span>{fmtBytes(image.sizeBytes)}</span>
            <span>Modified: {fmtDate(image.modifiedTime)}</span>
            {image.parents?.[0] && <span>Folder: {image.parents[0]}</span>}
          </div>
          <a href={`https://drive.google.com/file/d/${image.id}/view`} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <ExternalLink size={12} /> Open in Drive
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Image card ─────────────────────────────────────────────────────────────
function ImageCard({ img, selected, onSelect, onOpen, isDup, isLarge, isOldImg }) {
  return (
    <motion.div whileHover={{ y:-2 }}
      className={`bg-white rounded-2xl overflow-hidden border shadow-sm transition-all duration-150 ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative bg-gray-100 h-32 cursor-pointer" onClick={() => onOpen(img)}>
        <img src={thumbnailUrl(img.id)} alt={img.name}
          className="w-full h-full object-cover"
          onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}
        />
        <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-gray-100">
          <Image size={28} className="text-gray-300" />
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isLarge && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">Large</span>}
          {isDup   && <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">Dup</span>}
          {isOldImg && <span className="bg-gray-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">Old</span>}
        </div>
        {/* Select checkbox */}
        <button onClick={e => { e.stopPropagation(); onSelect(img.id); }}
          className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
          {selected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} className="text-gray-400" />}
        </button>
        {/* Zoom hint */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <ZoomIn size={24} className="text-white drop-shadow" />
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 truncate" title={img.name}>{img.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{fmtBytes(img.sizeBytes)}</span>
          <span className="text-xs text-gray-400">{MIME_LABELS[img.mimeType] || 'IMG'}</span>
        </div>
        <p className="text-xs text-gray-300 mt-0.5">{fmtDate(img.modifiedTime)}</p>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PhotosScanner() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // filters
  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilter, setShowFilter] = useState('All'); // All | Large | Duplicate | Old
  const [sort,     setSort]     = useState('name');

  // selection
  const [selected, setSelected] = useState(new Set());

  // lightbox
  const [lightbox, setLightbox] = useState(null); // index into filtered array

  async function load() {
    setLoading(true); setError(null);
    try {
      const result = await apiService.classifyDriveFiles();
      setData(result);
    } catch (e) {
      setError(e.message || 'Failed to load Drive files.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ──────────────────────────────────────────────────────────────
  const allImages = useMemo(() => {
    const files = data?.classifiedFiles || [];
    return files.filter(f => IMAGE_MIMES.has(f.mimeType));
  }, [data]);

  const dupIds   = useMemo(() => markDuplicates(allImages), [allImages]);
  const largeSet = useMemo(() => new Set(allImages.filter(f => (f.sizeBytes||0) >= LARGE_THRESHOLD).map(f => f.id)), [allImages]);
  const oldSet   = useMemo(() => new Set(allImages.filter(f => isOld(f.modifiedTime)).map(f => f.id)), [allImages]);

  const totalBytes = useMemo(() => allImages.reduce((s,f) => s+(f.sizeBytes||0), 0), [allImages]);

  const typeGroups = useMemo(() => {
    const g = {};
    allImages.forEach(f => {
      const lbl = MIME_LABELS[f.mimeType] || 'Other';
      g[lbl] = (g[lbl]||0) + 1;
    });
    return g;
  }, [allImages]);

  const pieData = useMemo(() =>
    Object.entries(typeGroups).map(([name,value]) => ({ name, value, color: TYPE_COLORS[name]||'#94A3B8' })),
    [typeGroups]
  );

  // Age distribution buckets
  const ageData = useMemo(() => {
    const buckets = { '<1 yr':0, '1-2 yr':0, '2-3 yr':0, '3+ yr':0 };
    const now = Date.now();
    allImages.forEach(f => {
      if (!f.modifiedTime) return;
      const days = (now - new Date(f.modifiedTime).getTime()) / 86400000;
      if (days < 365)       buckets['<1 yr']++;
      else if (days < 730)  buckets['1-2 yr']++;
      else if (days < 1095) buckets['2-3 yr']++;
      else                  buckets['3+ yr']++;
    });
    return Object.entries(buckets).map(([name,value]) => ({ name, value }));
  }, [allImages]);

  const typeOptions = useMemo(() => ['All', ...Object.keys(typeGroups)], [typeGroups]);

  const filtered = useMemo(() => {
    let list = [...allImages];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    if (typeFilter !== 'All') {
      list = list.filter(f => (MIME_LABELS[f.mimeType]||'Other') === typeFilter);
    }
    if (showFilter === 'Large')     list = list.filter(f => largeSet.has(f.id));
    if (showFilter === 'Duplicate') list = list.filter(f => dupIds.has(f.id));
    if (showFilter === 'Old')       list = list.filter(f => oldSet.has(f.id));
    switch (sort) {
      case 'size':     list.sort((a,b) => (b.sizeBytes||0)-(a.sizeBytes||0)); break;
      case 'oldest':   list.sort((a,b) => new Date(a.modifiedTime)-new Date(b.modifiedTime)); break;
      case 'newest':   list.sort((a,b) => new Date(b.modifiedTime)-new Date(a.modifiedTime)); break;
      default:         list.sort((a,b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [allImages, search, typeFilter, showFilter, sort, largeSet, dupIds, oldSet]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(f => selected.has(f.id));

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (allFilteredSelected) setSelected(prev => { const n=new Set(prev); filtered.forEach(f=>n.delete(f.id)); return n; });
    else setSelected(prev => { const n=new Set(prev); filtered.forEach(f=>n.add(f.id)); return n; });
  }

  const lbImg = lightbox !== null ? filtered[lightbox] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/20 to-rose-50/20 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="h-7 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                <Camera className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Photos Scanner</h1>
                <p className="text-xs text-gray-400">Powered by Drive File Classifier</p>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[...Array(5)].map((_,i)=><SkeletonCard key={i}/>)}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_,i)=><SkeletonImg key={i}/>)}</div>
          </div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard icon={Image}     label="Total Images"         value={allImages.length}         gradient="from-pink-500 to-rose-600" />
              <StatCard icon={HardDrive} label="Storage Used"         value={fmtBytes(totalBytes)}     gradient="from-blue-500 to-indigo-600" />
              <StatCard icon={Trash2}    label="Large Images (>5MB)"  value={largeSet.size}            gradient="from-red-500 to-rose-600" />
              <StatCard icon={Copy}      label="Duplicate Candidates" value={dupIds.size}              gradient="from-amber-500 to-yellow-600" />
              <StatCard icon={Clock}     label="Old Images (>1 yr)"   value={oldSet.size}              gradient="from-gray-500 to-slate-600" />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-4">Images by Type</h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {pieData.map(d=><Cell key={d.name} fill={d.color}/>)}
                      </Pie>
                      <Tooltip content={<PieTip/>}/>
                      <Legend formatter={v=><span className="text-xs text-gray-600">{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-gray-400 py-16 text-center">{NA}</p>}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-4">Images by Age</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ageData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="name" tick={{ fontSize:11 }}/>
                    <YAxis tick={{ fontSize:10 }}/>
                    <Tooltip content={<BarTip/>}/>
                    <Bar dataKey="value" fill="#F472B6" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
                  <input type="text" placeholder="Search images…" value={search} onChange={e=>setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"/>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13}/>
                  <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
                    className="pl-8 pr-7 py-2.5 text-sm border border-gray-200 rounded-xl outline-none appearance-none bg-white cursor-pointer">
                    {typeOptions.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {['All','Large','Duplicate','Old'].map(f=>(
                    <button key={f} onClick={()=>setShowFilter(f)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${showFilter===f ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13}/>
                  <select value={sort} onChange={e=>setSort(e.target.value)}
                    className="pl-8 pr-7 py-2.5 text-sm border border-gray-200 rounded-xl outline-none appearance-none bg-white cursor-pointer">
                    <option value="name">Name A–Z</option>
                    <option value="size">Largest First</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-pink-600 transition-colors">
                    {allFilteredSelected ? <CheckSquare size={13} className="text-pink-500"/> : <Square size={13}/>}
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  {selected.size > 0 && (
                    <span className="text-xs text-gray-500">{selected.size} selected</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Showing {filtered.length} of {allImages.length} images</p>
              </div>
            </div>

            {/* Selection action bar */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                  className="bg-pink-50 border border-pink-200 rounded-2xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm font-semibold text-pink-800">{selected.size} image{selected.size>1?'s':''} selected</p>
                  <div className="flex gap-2">
                    <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      <ExternalLink size={12}/> View in Drive
                    </a>
                    <button onClick={() => setSelected(new Set())}
                      className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Camera size={40} className="text-gray-300 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No images found</h3>
                <p className="text-sm text-gray-500">{allImages.length === 0 ? 'No image files in your Drive scan.' : 'No images match the current filters.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filtered.map((img, idx) => (
                  <ImageCard key={img.id} img={img}
                    selected={selected.has(img.id)}
                    onSelect={toggleSelect}
                    onOpen={() => setLightbox(idx)}
                    isDup={dupIds.has(img.id)}
                    isLarge={largeSet.has(img.id)}
                    isOldImg={oldSet.has(img.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lbImg && (
          <Lightbox
            image={lbImg}
            images={filtered}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox(i => (i - 1 + filtered.length) % filtered.length)}
            onNext={() => setLightbox(i => (i + 1) % filtered.length)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
