"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InviteMemberModal from "@/components/team/InviteMemberModal";
import {
  getInvitations,
  cancelInvitation,
  removeMember,
  updateMember,
  getTeamStats,
  getTeamActivity,
  TeamMember,
  TeamRole,
  MemberStatus,
} from "@/lib/teamAPI";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  UserPlus,
  Mail,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Clock3,
  UserCheck,
} from "lucide-react";

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  hr: "HR Manager",
  recruiter: "Recruiter",
  interviewer: "Interviewer",
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  pending: "Chờ chấp nhận",
  suspended: "Tạm khóa",
};

const STATUS_COLORS: Record<MemberStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  suspended: "destructive",
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    invitesLast7d: number;
    joinsLast7d: number;
    companyName?: string;
  } | null>(null);
  const [activities, setActivities] = useState<
    Array<{ type: string; email?: string; role?: string; at: string; status?: string }>
  >([]);
  const { toast } = useToast();

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await getInvitations();
      if (response.success && response.data) {
        setMembers(response.data.invitations);
      } else {
        throw new Error(response.error || "Không thể tải danh sách thành viên");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách thành viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatsAndActivity = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([getTeamStats(), getTeamActivity()]);
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (activityRes.success && activityRes.data) {
        setActivities(activityRes.data.activities || []);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    loadMembers();
    loadStatsAndActivity();
  }, []);

  const handleCancelInvitation = async (member: TeamMember) => {
    try {
      const response = await cancelInvitation(member._id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã hủy lời mời",
        });
        loadMembers();
      } else {
        throw new Error("Không thể hủy lời mời");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy lời mời",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      const response = await removeMember(selectedMember._id);
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa thành viên khỏi team",
        });
        setDeleteDialogOpen(false);
        setSelectedMember(null);
        loadMembers();
      } else {
        throw new Error("Không thể xóa thành viên");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thành viên",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (member: TeamMember, status: MemberStatus) => {
    try {
      const response = await updateMember(member._id, { status });
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái",
        });
        loadMembers();
      } else {
        throw new Error("Không thể cập nhật trạng thái");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pendingCount = stats?.pending ?? members.filter((m) => m.status === "pending").length;
  const activeCount = stats?.active ?? members.filter((m) => m.status === "active").length;
  const totalCount = stats?.total ?? members.length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Team</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thành viên và quyền hạn trong team của bạn
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Mời thành viên
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng thành viên</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />
              {totalCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang hoạt động</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ chấp nhận</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tuần này</CardDescription>
            <CardTitle className="text-lg flex flex-col gap-1">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Mời: {stats?.invitesLast7d ?? "-"}
              </span>
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> Tham gia: {stats?.joinsLast7d ?? "-"}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thành viên</CardTitle>
          <CardDescription>
            Quản lý tất cả thành viên trong team của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có thành viên nào. Hãy mời thành viên mới!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày mời</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.user?.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.fullName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {member.user?.fullName || member.email || "N/A"}
                          </div>
                          {member.invitedByUser && (
                            <div className="text-xs text-muted-foreground">
                              Mời bởi: {member.invitedByUser.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email || member.user?.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[member.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[member.status]}>
                        {STATUS_LABELS[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.invitedAt)}</TableCell>
                    <TableCell>
                      {member.joinedAt ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {formatDate(member.joinedAt)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          Chưa tham gia
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {member.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCancelInvitation(member)}
                              >
                                Hủy lời mời
                              </DropdownMenuItem>
                            </>
                          )}
                          {member.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(member, "inactive")}
                              >
                                Vô hiệu hóa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(member, "suspended")}
                              >
                                Tạm khóa
                              </DropdownMenuItem>
                            </>
                          )}
                          {member.status === "inactive" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(member, "active")}
                            >
                              Kích hoạt lại
                            </DropdownMenuItem>
                          )}
                          {member.status === "suspended" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(member, "active")}
                            >
                              Gỡ khóa
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedMember(member);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Xóa khỏi team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các sự kiện mời / tham gia</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có hoạt động.</div>
            ) : (
              <ul className="space-y-3">
                {activities.slice(0, 10).map((act, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {act.type === "invite" ? (
                        <Mail className="h-4 w-4 text-blue-500" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm">
                        {act.type === "invite" ? "Mời" : "Tham gia"}:{" "}
                        <span className="font-medium">{act.email || "N/A"}</span>{" "}
                        {act.role && <Badge variant="outline">{act.role}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatDate(act.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={loadMembers}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {selectedMember?.user?.fullName || selectedMember?.email} khỏi team? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

