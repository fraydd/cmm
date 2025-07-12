import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props;

    const hasPermission = (permission) => {
        if (!auth?.user) return false;
        
        // Si el usuario tiene rol admin, tiene todos los permisos
        if (auth.user.roles?.some(role => role.name === 'admin')) {
            return true;
        }
        
        // Verificar permisos específicos
        return auth.user.permissions?.some(p => p.name === permission) || 
               auth.user.roles?.some(role => role.permissions?.some(p => p.name === permission));
    };

    const hasRole = (roleName) => {
        if (!auth?.user) return false;
        return auth.user.roles?.some(role => role.name === roleName);
    };

    const can = (permission) => hasPermission(permission);
    const isAdmin = () => hasRole('admin');

    return {
        hasPermission,
        hasRole,
        can,
        isAdmin,
        user: auth?.user
    };
} 