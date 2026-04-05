import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { ROLE_LABELS, ROLE_OPTIONS } from './users-filter-bar';

interface Academy {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserCardProps {
  user: User;
  academies: Academy[];
  academyName: string | undefined;
  currentService: string | undefined;
  updating: string | null;
  onUpdate: (userId: string, updates: Record<string, unknown>) => void;
  onServiceChange: (studentId: string, newService: string) => void;
  onDelete: (user: User) => void;
}

export function UserCard({
  user: u,
  academies,
  academyName,
  currentService,
  updating,
  onUpdate,
  onServiceChange,
  onDelete,
}: UserCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">{u.full_name}</span>
              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[u.role] || u.role}
              </Badge>
              <Badge
                variant={u.is_active ? 'default' : 'secondary'}
                className="text-xs"
              >
                {u.is_active ? '활성' : '비활성'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {u.email}{u.phone && <span className="ml-2">{u.phone}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              학원: {u.academy_id ? academyName || '-' : '미배정'}
              {' · '}
              가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select
              value={u.role}
              onValueChange={(role) => onUpdate(u.id, { role })}
              disabled={updating === u.id}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={u.academy_id || 'none'}
              onValueChange={(val) =>
                onUpdate(u.id, { academy_id: val === 'none' ? null : val })
              }
              disabled={updating === u.id}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미배정</SelectItem>
                {academies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {u.role === 'student' && (
              <Select
                value={currentService || 'none'}
                onValueChange={(val) => onServiceChange(u.id, val)}
                disabled={updating === u.id}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">서비스 없음</SelectItem>
                  <SelectItem value="naesin">올인내신</SelectItem>
                  <SelectItem value="voca">올킬보카</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant={u.is_active ? 'destructive' : 'default'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => onUpdate(u.id, { is_active: !u.is_active })}
              disabled={updating === u.id}
            >
              {u.is_active ? '비활성화' : '활성화'}
            </Button>
            {u.role !== 'boss' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                onClick={() => onDelete(u)}
                disabled={updating === u.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
