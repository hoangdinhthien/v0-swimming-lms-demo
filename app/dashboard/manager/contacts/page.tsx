"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  ExternalLink,
  Calendar,
  Pencil,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  fetchContacts,
  updateContactNote,
  formatContactDate,
  getGoogleMapsUrl,
  formatLocation,
  type Contact,
} from "@/api/manager/contact-api";

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Search & Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Edit Note state
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [editingNoteContact, setEditingNoteContact] = useState<Contact | null>(
    null
  );
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Load contacts
  const loadContacts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      const data = await fetchContacts(tenantId, token);
      setContacts(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách liên hệ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Handle view contact details
  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  // Open location in Google Maps
  const handleOpenMap = (location: [number, number]) => {
    window.open(getGoogleMapsUrl(location), "_blank");
  };

  // Filter and Sort contacts
  const filteredContacts = contacts
    .filter((contact) => {
      const term = searchTerm.toLowerCase();
      const matchEmail = contact.email.toLowerCase().includes(term);
      const matchPhone = contact.phone.includes(term);
      return matchEmail || matchPhone;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Handle Edit Note
  const handleEditNote = (contact: Contact) => {
    setEditingNoteContact(contact);
    setNoteContent(contact.note || "");
    setIsEditNoteOpen(true);
  };

  const handleSaveNote = async () => {
    if (!editingNoteContact) return;

    try {
      setSavingNote(true);
      await updateContactNote(editingNoteContact._id, noteContent);

      // Update local state
      setContacts(
        contacts.map((c) =>
          c._id === editingNoteContact._id ? { ...c, note: noteContent } : c
        )
      );

      toast({
        title: "Thành công",
        description: "Đã cập nhật ghi chú",
      });
      setIsEditNoteOpen(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật ghi chú",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Liên hệ</h1>
          <p className="text-muted-foreground">
            Danh sách các liên hệ từ khách hàng tiềm năng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadContacts(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo Email hoặc Số điện thoại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách Liên hệ
            <Badge variant="secondary" className="ml-2">
              {filteredContacts.length} liên hệ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy liên hệ nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Tin nhắn</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={toggleSort}
                        className="-ml-4 h-8 data-[state=open]:bg-accent"
                      >
                        Ngày gửi
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{contact.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{contact.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-2 max-w-xs">
                          {contact.message}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group">
                          <span className="text-sm line-clamp-2 max-w-[150px] text-muted-foreground italic">
                            {contact.note || "Chưa có ghi chú"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEditNote(contact)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatContactDate(contact.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(contact)}
                          >
                            Xem chi tiết
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMap(contact.location)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết Liên hệ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về khách hàng liên hệ
            </DialogDescription>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Họ tên
                    </p>
                    <p className="text-base font-semibold">
                      {selectedContact.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="text-base text-blue-600 hover:underline"
                    >
                      {selectedContact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Số điện thoại
                    </p>
                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="text-base text-green-600 hover:underline"
                    >
                      {selectedContact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Tin nhắn
                    </p>
                    <p className="text-base whitespace-pre-wrap">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Ngày gửi
                    </p>
                    <p className="text-base">
                      {formatContactDate(selectedContact.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Vị trí
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatLocation(selectedContact.location)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMap(selectedContact.location)}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Xem trên Google Maps
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật Ghi chú</DialogTitle>
            <DialogDescription>
              Thêm ghi chú cho liên hệ từ {editingNoteContact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Nhập ghi chú..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditNoteOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveNote} disabled={savingNote}>
              {savingNote && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
