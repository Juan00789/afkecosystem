'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (newRole: string) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <Select value={currentRole} onValueChange={onRoleChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
            {currentRole === 'provider' ? <UserCheck className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            <SelectValue placeholder="Seleccionar rol" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="provider">
          <div className="flex items-center gap-3">
            <UserCheck className="h-4 w-4" />
            <span>Rol Proveedor</span>
          </div>
        </SelectItem>
        <SelectItem value="client">
           <div className="flex items-center gap-3">
            <Users className="h-4 w-4" />
            <span>Rol Cliente</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
