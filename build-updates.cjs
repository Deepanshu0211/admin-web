const fs = require('fs');

// 1. Members.tsx search
let membersCode = fs.readFileSync('src/pages/Members.tsx', 'utf8');

if (!membersCode.includes('Search')) {
    membersCode = membersCode.replace('import { Users, Plus, Edit, Trash2, Calendar, Phone, Activity } from \'lucide-react\';', 'import { Users, Plus, Edit, Trash2, Calendar, Phone, Activity, Search } from \'lucide-react\';');
}

if (!membersCode.includes('setSearchQuery')) {
    membersCode = membersCode.replace('const [isAddModalOpen, setIsAddModalOpen] = useState(false);', 'const [isAddModalOpen, setIsAddModalOpen] = useState(false);\n  const [searchQuery, setSearchQuery] = useState(\'\');');
    membersCode = membersCode.replace('const filteredMembers = members;', 'const filteredMembers = members.filter(m => (m.name || \'\').toLowerCase().includes(searchQuery.toLowerCase()) || (m.phone || \'\').includes(searchQuery));');

    const oldHeader = /<div className="flex justify-between items-center mb-8">[\s\S]*?<\/button>\s*<\/div>/;
    const newHeader = `      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Members</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent)] hover:opacity-90 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-[var(--accent)]/30"
          >
            <Plus className="w-5 h-5" /> Add Member
          </button>
        </div>
      </div>`;
    membersCode = membersCode.replace(oldHeader, newHeader);
    
    // Add mapping over filteredMembers instead of members in table if not already doing so
    membersCode = membersCode.replace(/members\.map\(\(member\)/g, 'filteredMembers.map((member)');

    fs.writeFileSync('src/pages/Members.tsx', membersCode);
}

// 2. admin.ts delete functions
let adminCode = fs.readFileSync('src/lib/admin.ts', 'utf8');
const adminAdditions = `
export async function deleteBroadcast(id: string) {
  const { error } = await supabase.from('broadcasts').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}
`;
if (!adminCode.includes('deleteBroadcast')) {
    fs.appendFileSync('src/lib/admin.ts', adminAdditions);
}

// 3. Update Broadcasts.tsx to allow delete
let broadcastCode = fs.readFileSync('src/pages/Broadcasts.tsx', 'utf8');
if (!broadcastCode.includes('deleteBroadcast')) {
    broadcastCode = broadcastCode.replace("import { fetchBroadcasts, createBroadcast } from '../lib/admin';", "import { fetchBroadcasts, createBroadcast, deleteBroadcast } from '../lib/admin';");
    broadcastCode = broadcastCode.replace("import { Send, Bell, Calendar, Search } from 'lucide-react';", "import { Send, Bell, Calendar, Search, Trash2 } from 'lucide-react';");

    // Add handleDelete
    const deleteFunc = `  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    try {
      await deleteBroadcast(id);
      setBroadcasts(broadcasts.filter(b => b.id !== id));
    } catch(err) {
      alert('Failed to delete broadcast');
    }
  };
`;
    broadcastCode = broadcastCode.replace('const handleSend = async (e: React.FormEvent) => {', deleteFunc + '\n  const handleSend = async (e: React.FormEvent) => {');
    
    // Add delete button next to date
    broadcastCode = broadcastCode.replace(/(<span className="text-sm text-\[var\(--text-secondary\)\]\">\s*\{formatDate\(broadcast\.created_at\)\}\s*<\/span>)/g, `$1\n                <button onClick={(e) => handleDelete(broadcast.id, e)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>`);
    fs.writeFileSync('src/pages/Broadcasts.tsx', broadcastCode);
}

// 4. Update Messages.tsx to allow delete
let messagesCode = fs.readFileSync('src/pages/Messages.tsx', 'utf8');
if (!messagesCode.includes('deleteMessage')) {
    messagesCode = messagesCode.replace("import { fetchMessages, updateMessageStatus } from '../lib/admin';", "import { fetchMessages, updateMessageStatus, deleteMessage } from '../lib/admin';");
    messagesCode = messagesCode.replace("import { MessageSquare, Check, X, Calendar, Clock } from 'lucide-react';", "import { MessageSquare, Check, X, Calendar, Clock, Trash2 } from 'lucide-react';");

    const deleteMsgFunc = `  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
    } catch(err) {
      alert('Failed to delete message');
    }
  };
`;
    messagesCode = messagesCode.replace('  const loadMessages = () => {', deleteMsgFunc + '\n  const loadMessages = () => {');

    messagesCode = messagesCode.replace(/(<span className="text-sm font-medium text-\[var\(--text-tertiary\)\] uppercase tracking-wider">\s*\{formatTime\(msg\.created_at\)\}\s*<\/span>)/g, `$1\n                <button onClick={(e) => handleDelete(msg.id, e)} className="ml-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"><Trash2 className="w-4 h-4" /></button>`);

    fs.writeFileSync('src/pages/Messages.tsx', messagesCode);
}
