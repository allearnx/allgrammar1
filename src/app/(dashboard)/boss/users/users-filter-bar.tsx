import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Academy {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<string, string> = {
  student: '학생',
  teacher: '선생님',
  admin: '관리자',
  boss: '총관리자',
};

const ROLE_OPTIONS = ['student', 'teacher', 'admin', 'boss'];

interface UsersFilterBarProps {
  nameSearch: string;
  onNameSearchChange: (v: string) => void;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  academyFilter: string;
  onAcademyFilterChange: (v: string) => void;
  academies: Academy[];
  filteredCount: number;
}

export function UsersFilterBar({
  nameSearch,
  onNameSearchChange,
  roleFilter,
  onRoleFilterChange,
  academyFilter,
  onAcademyFilterChange,
  academies,
  filteredCount,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름 검색"
          value={nameSearch}
          onChange={(e) => onNameSearchChange(e.target.value)}
          className="pl-8 w-[160px] h-9"
        />
      </div>
      <p className="text-muted-foreground">
        총 {filteredCount}명
      </p>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="역할 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 역할</SelectItem>
          {ROLE_OPTIONS.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={academyFilter} onValueChange={onAcademyFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="학원 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 학원</SelectItem>
          {academies.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { ROLE_LABELS, ROLE_OPTIONS };
