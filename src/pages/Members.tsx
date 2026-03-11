import { useEffect, useState, useRef } from "react";
import {
  createMember,
  updateMember,
  fetchMembers,
  getMemberStatus,
  addMonthsToDate,
  formatDateInput,
  setMemberDeleted,
  type MemberFormData,
} from "../lib/admin";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Search,
  Plus,
  X,
  Camera,
  User,
  Phone,
  MapPin,
  CreditCard,
  ChevronLeft,
  Edit2,
  Trash2,
} from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Expiring" | "Expired" | "Deleted">("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    phoneNumber: "",
    address: "",
    aadharNumber: "",
    alternatePhone: "",
    joiningDate: new Date().toISOString().split("T")[0],
    gender: "male",
    membershipStartDate: new Date().toISOString().split("T")[0],
    membershipExpiryDate: addMonthsToDate(new Date().toISOString().split("T")[0], 1),
    profilePicture: "",
  });

  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6 | 12>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadMembers = () => {
    setLoading(true);
    fetchMembers().then(setMembers).finally(() => setLoading(false));
  };

  useEffect(() => { loadMembers(); }, []);

  useGSAP(() => {
    if (!loading && members.length > 0) {
      gsap.fromTo(".member-card", { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out",
      });
    }
  }, [loading, members, statusFilter, searchQuery]);

  const handleDurationSelect = (months: 1 | 3 | 6 | 12) => {
    setSelectedDuration(months);
    setFormData((prev) => ({ ...prev, membershipExpiryDate: addMonthsToDate(prev.membershipStartDate, months) }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setFormData((prev) => ({
      ...prev,
      membershipStartDate: newStart,
      membershipExpiryDate: addMonthsToDate(newStart, selectedDuration),
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", phoneNumber: "", address: "", aadharNumber: "", alternatePhone: "",
      joiningDate: new Date().toISOString().split("T")[0], gender: "male",
      membershipStartDate: new Date().toISOString().split("T")[0],
      membershipExpiryDate: addMonthsToDate(new Date().toISOString().split("T")[0], 1),
      profilePicture: "",
    });
    setSelectedDuration(1);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedMember) {
        await updateMember(selectedMember.id, formData);
      } else {
        await createMember(formData);
      }
      setShowAddModal(false);
      setIsEditing(false);
      loadMembers();
      if (isEditing) setSelectedMember({ ...selectedMember, ...formData });
      resetForm();
    } catch (err: any) {
      alert(err.message || "Failed to save member");
    }
  };

  const openEditModal = () => {
    if (!selectedMember) return;
    const start = new Date(selectedMember.membershipStartDate);
    const end = new Date(selectedMember.membershipExpiryDate);
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    let dur: 1 | 3 | 6 | 12 = 1;
    if ([1, 3, 6, 12].includes(monthsDiff)) dur = monthsDiff as any;
    setSelectedDuration(dur);
    setFormData({
      name: selectedMember.name || "",
      phoneNumber: selectedMember.phoneNumber || "",
      address: selectedMember.address || "",
      aadharNumber: selectedMember.aadharNumber || "",
      alternatePhone: selectedMember.alternatePhone || "",
      joiningDate: formatDateInput(selectedMember.joiningDate) || new Date().toISOString().split("T")[0],
      gender: selectedMember.gender || "male",
      membershipStartDate: formatDateInput(selectedMember.membershipStartDate) || new Date().toISOString().split("T")[0],
      membershipExpiryDate: formatDateInput(selectedMember.membershipExpiryDate) || new Date().toISOString().split("T")[0],
      profilePicture: selectedMember.profilePicture || "",
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    if (confirm(`Are you sure you want to delete ${selectedMember.name}?`)) {
      try {
        await setMemberDeleted(selectedMember.id, true);
        setSelectedMember(null);
        loadMembers();
      } catch (err: any) {
        alert(err.message || "Failed to delete member");
      }
    }
  };

  const filteredMembers = members.filter((m: any) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phoneNumber.includes(searchQuery);
    if (!matchesSearch) return false;
    const status = getMemberStatus(m);
    if (statusFilter === "All") return true;
    return status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    const colors: any = {
      active: "bg-green-500/10 text-green-400",
      expiring: "bg-yellow-500/10 text-yellow-400",
      expired: "bg-red-500/10 text-red-400",
      deleted: "bg-zinc-500/10 text-zinc-400",
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${colors[status]}`}>
        {status}
      </span>
    );
  };

  // ── Detail info row helper ──
  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</p>
        <p className="text-sm text-[var(--text-primary)] truncate">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Members</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Manage your gym members</p>
        </div>
        <button
          onClick={() => { setIsEditing(false); resetForm(); setShowAddModal(true); }}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 active:scale-95 shadow-[0_4px_16px_rgba(229,57,53,0.25)]"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="input-clean pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {["All", "Active", "Expiring", "Expired", "Deleted"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Member Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 card">
          <User className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">No members found</h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member: any) => {
            const status = getMemberStatus(member);
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="member-card card card-hover p-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {member.profilePicture ? (
                    <img src={member.profilePicture} className="w-10 h-10 rounded-lg object-cover" alt={member.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">{member.name}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">{member.phoneNumber}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-tertiary)]">
                    Expires {formatDateInput(member.membershipExpiryDate) || "N/A"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ DETAIL MODAL ═══════════ */}
      {selectedMember && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMember(null); }}
        >
          <div className="modal-panel max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 flex items-start justify-between border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                {selectedMember.profilePicture ? (
                  <img src={selectedMember.profilePicture} className="w-12 h-12 rounded-xl object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-lg font-bold text-[var(--accent)]">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedMember.name}</h2>
                  <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {selectedMember.phoneNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status + Actions */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--border-color)]">
              {getStatusBadge(getMemberStatus(selectedMember))}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDeleteMember}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={openEditModal}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dates */}
            <div className="px-5 py-3 grid grid-cols-2 gap-3 border-b border-[var(--border-color)]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Joined</p>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{formatDateInput(selectedMember.joiningDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Expires</p>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{formatDateInput(selectedMember.membershipExpiryDate)}</p>
              </div>
            </div>

            {/* Info rows */}
            <div className="px-5 py-2 divide-y divide-[var(--border-color)]">
              <InfoRow icon={User} label="Gender" value={selectedMember.gender} />
              <InfoRow icon={MapPin} label="Address" value={selectedMember.address} />
              <InfoRow icon={CreditCard} label="Aadhar Number" value={selectedMember.aadharNumber} />
              <InfoRow icon={Phone} label="Alternate Phone" value={selectedMember.alternatePhone} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ADD / EDIT MODAL ═══════════ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-panel max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-tertiary)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {isEditing ? "Edit Member" : "Add Member"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-[var(--text-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMember} className="flex-1 overflow-y-auto p-5">
              {/* Photo */}
              <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-20 h-20 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color-light)] flex items-center justify-center overflow-hidden group-hover:border-[var(--accent)] transition-colors">
                    {formData.profilePicture ? (
                      <img src={formData.profilePicture} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Camera className="w-6 h-6 text-[var(--text-tertiary)]" />
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-[var(--accent)] text-white p-1 rounded-lg">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Inputs grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Name *</label>
                  <input required placeholder="Full name" className="input-clean" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Phone *</label>
                  <input required placeholder="9876543210" className="input-clean" value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Start Date</label>
                  <input type="date" required className="input-clean" value={formData.membershipStartDate}
                    onChange={handleStartDateChange} />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1.5">Duration *</label>
                  <div className="flex gap-1.5">
                    {([
                      { label: "1M", val: 1 },
                      { label: "3M", val: 3 },
                      { label: "6M", val: 6 },
                      { label: "1Y", val: 12 },
                    ] as const).map((d) => (
                      <button key={d.val} type="button"
                        onClick={() => handleDurationSelect(d.val)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          selectedDuration === d.val
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-light)]"
                        }`}
                      >{d.label}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">
                    Expires: {formatDateInput(formData.membershipExpiryDate)}
                  </p>
                </div>

                {/* Alt Phone */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Alt. Phone</label>
                  <input placeholder="Optional" className="input-clean" value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} />
                </div>

                {/* Aadhar */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Aadhar No.</label>
                  <input placeholder="12 digits" className="input-clean" value={formData.aadharNumber}
                    onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Gender *</label>
                  <div className="flex gap-1.5">
                    {(["male", "female", "other"] as const).map((g) => (
                      <button key={g} type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          formData.gender === g
                            ? "bg-white text-black"
                            : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-light)]"
                        }`}
                      >{g}</button>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Address *</label>
                  <textarea required placeholder="Full address" rows={2}
                    className="input-clean resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6">
                <button type="submit"
                  className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(229,57,53,0.25)] transition-all active:scale-[0.98]"
                >
                  {isEditing ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
